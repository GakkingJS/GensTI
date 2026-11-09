import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import styles from "../styles/VerifyEmailPage.module.css";

function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(
    location.state?.email ?? ""
  );
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsVerifying(true);

    try {
      const response = await fetch("/auth/verify-email", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ?? "No pudimos verificar tu correo."
        );
      }

      setMessage(
        data.message ?? "Correo verificado correctamente."
      );
      setCode("");

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (verifyError) {
      setError(verifyError.message);
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setMessage("");
    setError("");
    setIsResending(true);

    try {
      const response = await fetch(
        "/auth/resend-verification",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ?? "No pudimos reenviar el código."
        );
      }

      setMessage(
        data.message ?? "Enviamos un nuevo código a tu correo."
      );
    } catch (resendError) {
      setError(resendError.message);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.badge}>
          <span className={styles.badgeDot} />
          Verificación de correo
        </span>

        <h1>Confirma tu cuenta</h1>

        <p>
          Ingresa el código de 6 dígitos que enviamos a tu
          correo para activar tu cuenta GensTI.
        </p>

        <form
          onSubmit={handleSubmit}
          className={styles.form}
        >
          <label className={styles.field}>
            Correo institucional

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="nombre@campusucc.edu.co"
              required
              autoComplete="email"
            />
          </label>

          <label className={styles.field}>
            Código de verificación

            <input
              className={styles.codeInput}
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
          </label>

          <button
            type="submit"
            className={styles.verifyButton}
            disabled={isVerifying || code.length !== 6}
          >
            {isVerifying
              ? "Verificando..."
              : "Verificar correo"}
          </button>
        </form>

        {message && (
          <p className={styles.success}>{message}</p>
        )}

        {error && (
          <p className={styles.error}>{error}</p>
        )}

        <button
          type="button"
          className={styles.resendButton}
          onClick={handleResend}
          disabled={isResending || !email}
        >
          {isResending
            ? "Reenviando..."
            : "Reenviar código"}
        </button>

        <p className={styles.loginLink}>
          ¿Ya verificaste tu cuenta?{" "}
          <Link to="/login">Inicia sesión</Link>
        </p>
      </section>
    </main>
  );
}

export default VerifyEmailPage;