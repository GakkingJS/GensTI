import { useState } from "react";
import { Link } from "react-router-dom";
import logoGensti from "../assets/genssti-logo.jpg";
import "./ForgotPasswordPage.css";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "No fue posible procesar la solicitud"
        );
      }

      setSent(true);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Ocurrió un error al solicitar la recuperación"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="forgot-page">
      <header className="forgot-header">
        <Link to="/" className="forgot-brand">
          <img
            src={logoGensti}
            alt="Logo de GensTI"
            className="forgot-logo"
          />

          <span>
            <strong>GensTI</strong>
            <small>Ingeniería de Sistemas</small>
          </span>
        </Link>
      </header>

      <section className="forgot-panel">
        {sent ? (
          <>
            <h1>Revisa tu correo</h1>

            <p>
              Si el correo está registrado, te enviamos un enlace
              para restablecer tu contraseña.
            </p>

            <Link to="/login" className="forgot-button">
              Volver a iniciar sesión
            </Link>
          </>
        ) : (
          <>
            <p className="forgot-label">RECUPERAR ACCESO</p>

            <h1>¿Olvidaste tu contraseña?</h1>

            <p>
              Ingresa tu correo institucional y te enviaremos un
              enlace para crear una nueva contraseña.
            </p>

            <form onSubmit={handleSubmit} className="forgot-form">
              <div className="forgot-field">
                <label htmlFor="email">
                  Correo institucional
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nombre@campusucc.edu.co"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  inputMode="email"
                  required
                />
              </div>

              {error && (
                <div className="forgot-error" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="forgot-button"
                disabled={loading}
              >
                {loading
                  ? "Enviando..."
                  : "Enviar enlace"}
              </button>
            </form>

            <div className="forgot-login">
              <span>
                ¿Recordaste tu contraseña?
              </span>

              <Link to="/login">
                Iniciar sesión
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default ForgotPasswordPage;