from database import engine

from outbox_entrypoint import run_outbox_with_configured_key
from verification_mail import FakeVerificationEmailSender


sender = FakeVerificationEmailSender()

result = run_outbox_with_configured_key(
    engine,
    sender,
    limit=10,
)

print(f"Resultado: {result}")

for message in sender.sent:
    print(f"Destinatario: {message.recipient}")
    print(f"Token: {message.token}")
    print(
        "Enlace: "
        f"http://localhost:8001/verificar-correo#token={message.token}"
    )


