import { lazy, memo, Suspense, useState } from "react";
import { Link } from "react-router-dom";

import "./Register.css";
import logoGensti from "../assets/logo-gensti.png";

const FloatingLines = memo(
  lazy(() => import("../components/FloatingLines/FloatingLines"))
);

const ENABLED_WAVES = ["top", "middle", "bottom"];
const LINES_GRADIENT = ["#00A6A6", "#2B8C85", "#72B947"];

const TOP_WAVE_POSITION = { x: 10, y: 0.5, rotate: -0.4 };
const MIDDLE_WAVE_POSITION = { x: 5, y: 0, rotate: 0.2 };
const BOTTOM_WAVE_POSITION = { x: 2, y: -0.7, rotate: 0.4 };

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 12) {
      setError("La contraseña debe tener al menos 12 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "No fue posible crear la cuenta."
        );
      }

      setSuccess(
        data.message ||
          "Cuenta creada. Revisa tu correo institucional para verificarla."
      );
      setEmail(normalizedEmail);
      setPassword("");
    } catch (requestError) {
      setError(
        requestError.message ||
          "Ocurrió un error al registrar la cuenta."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <div className="register-background" aria-hidden="true">
        <Suspense fallback={null}>
          <FloatingLines
            enabledWaves={ENABLED_WAVES}
            lineCount={6}
            lineDistance={8}
            bendRadius={8}
            bendStrength={-2}
            interactive
            parallax
            animationSpeed={0.8}
            linesGradient={LINES_GRADIENT}
            topWavePosition={TOP_WAVE_POSITION}
            middleWavePosition={MIDDLE_WAVE_POSITION}
            bottomWavePosition={BOTTOM_WAVE_POSITION}
          />
        </Suspense>
      </div>

      <div className="register-overlay" aria-hidden="true" />

      <header className="register-header">
        <Link
          to="/"
          className="register-brand"
          aria-label="GENSTI, ir al inicio"
        >
          <img
            src={logoGensti}
            alt="GENSTI"
            className="register-logo"
          />
        </Link>
      </header>

      <section className="register-content">
        <div className="register-introduction">
          <p className="register-eyebrow">
            COMUNIDAD DE INGENIERÍA DE SISTEMAS
          </p>

          <h1>
            Tu comunidad.
            <br />
            <span>Tu espacio.</span>
          </h1>

          <p className="register-description">
            Conecta con estudiantes y profesores, descubre eventos
            y mantente al día con todo lo que pasa en Ingeniería
            de Sistemas.
          </p>

          <div className="register-highlight">
            <span
              className="register-highlight-dot"
              aria-hidden="true"
            />
            <span>
              Un espacio para compartir, aprender y participar.
            </span>
          </div>
        </div>

        <section
          className="register-panel"
          aria-labelledby="register-title"
        >
          <div className="register-panel-heading">
            <p className="register-label">ÚNETE A GENSTI</p>

            <h2 id="register-title">Crea tu cuenta.</h2>

            <p>
              Regístrate con tu correo institucional para comenzar.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="register-form"
          >
            <div className="register-field">
              <label htmlFor="register-email">
                Correo institucional
              </label>

              <input
                id="register-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                  setSuccess("");
                }}
                placeholder="nombre@campusucc.edu.co"
                autoComplete="email"
                inputMode="email"
                aria-describedby="register-email-hint"
                required
              />

              <span
                className="register-hint"
                id="register-email-hint"
              >
                Usa tu dirección institucional @campusucc.edu.co.
              </span>
            </div>

            <div className="register-field">
              <label htmlFor="register-password">
                Crea una contraseña
              </label>

              <input
                id="register-password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                  setSuccess("");
                }}
                placeholder="Mínimo 12 caracteres"
                autoComplete="new-password"
                minLength={12}
                maxLength={1024}
                aria-describedby="register-password-hint"
                required
              />

              <span
                className="register-hint"
                id="register-password-hint"
              >
                Utiliza al menos 12 caracteres.
              </span>
            </div>

            {error && (
              <div
                className="register-message register-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="register-message register-success"
                role="status"
                aria-live="polite"
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              <span>
                {loading ? "Creando cuenta..." : "Crear mi cuenta"}
              </span>

              {!loading && (
                <span
                  aria-hidden="true"
                  className="register-arrow"
                >
                  →
                </span>
              )}
            </button>
          </form>

          <div className="register-login-prompt">
            <span>¿Ya tienes una cuenta?</span>
            <Link to="/login">Iniciar sesión</Link>
          </div>
        </section>
      </section>

      <footer className="register-footer">
        <span>GENSTI</span>
        <span aria-hidden="true">·</span>
        <span>Universidad Cooperativa de Colombia</span>
      </footer>
    </main>
  );
}