import logging
import os

import httpx

logger = logging.getLogger(__name__)

BREVO_URL = "https://api.brevo.com/v3/smtp/email"


class EmailDeliveryError(Exception):
    """Fallo al entregar el correo."""


def send_verification_email(recipient: str, code: str) -> None:
    api_key = os.getenv("BREVO_API_KEY")
    sender_email = os.getenv("EMAIL_FROM")
    sender_name = os.getenv("EMAIL_FROM_NAME", "GENSTI")

    if not api_key or not sender_email:
        raise EmailDeliveryError("Falta BREVO_API_KEY o EMAIL_FROM")

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;
                padding:28px;border:1px solid #d9edeb;border-radius:18px;">
      <h2 style="color:#0d9488;margin:0 0 12px;">Verifica tu cuenta GENSTI</h2>
      <p style="color:#475569;">
        Usa este código para verificar tu correo institucional:
      </p>
      <div style="margin:24px 0;text-align:center;">
        <span style="display:inline-block;padding:16px 26px;border-radius:14px;
                     background:#eafaf7;color:#087f7a;font-size:32px;
                     font-weight:800;letter-spacing:8px;">
          {code}
        </span>
      </div>
      <p style="color:#64748b;font-size:14px;">
        El código expira en 10 minutos. Si no creaste esta cuenta,
        ignora este mensaje.
      </p>
    </div>
    """

    payload = {
        "sender": {"name": sender_name, "email": sender_email},
        "to": [{"email": recipient}],
        "subject": "Tu código de verificación GENSTI",
        "htmlContent": html,
    }

    try:
        response = httpx.post(
            BREVO_URL,
            json=payload,
            headers={"api-key": api_key, "accept": "application/json"},
            timeout=10,
        )
    except httpx.HTTPError as exc:
        raise EmailDeliveryError("No se pudo contactar a Brevo") from exc

    if response.status_code >= 300:
        raise EmailDeliveryError(f"Brevo respondió {response.status_code}")