import { lazy, memo, Suspense, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff, X } from "lucide-react";

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

const CONFIRM_HINTS = {
  idle: "Vuelve a escribir tu contraseña para confirmarla.",
  match: "Las contraseñas coinciden.",
  mismatch: "Las contraseñas no coinciden.",
};

// Botón del ojito: un solo estado controla los dos campos de contraseña
function PasswordToggle({ visible, onToggle }) {
  const label = visible ? "Ocultar contraseñas" : "Mostrar contraseñas";

  return (
    <button
      type="button"
      className="register-password-toggle"
      onClick={onToggle}
      // Evita que el botón le quite el foco al campo al hacer clic
      onMouseDown={(event) => event.preventDefault()}
      aria-label={label}
      aria-pressed={visible}
      title={label}
    >
      {visible ? (
        <EyeOff key="hide" size={22} />
      ) : (
        <Eye key="show" size={22} />
      )}
    </button>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const confirmRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /*
   * Estado de la confirmación, pensado para no regañar a medio escribir:
   * - idle: aún no escribe, o lo que lleva coincide con el inicio de la contraseña
   * - match: ya son iguales
   * - mismatch: lo escrito ya se desvió de la contraseña
   */
  const confirmStatus = !confirmPassword
    ? "idle"
    : confirmPassword === password
      ? "match"
      : password.startsWith(confirmPassword)
        ? "idle"
        : "mismatch";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 12) {
      setError("La contraseña debe tener al menos 12 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden. Escríbelas de nuevo.");
      confirmRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      // La confirmación solo se valida aquí: el backend no la necesita
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

      navigate("/verificar-correo", {
        state: { email: normalizedEmail },
      });
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
          aria-label="GensTI, ir al inicio"
        >
          <img
            src={logoGensti}
            alt="GensTI"
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
            <p className="register-label">ÚNETE A GensTI</p>

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

              <div className="register-password-wrap">
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                    setSuccess("");
                  }}
                  placeholder="Mínimo 12 caracteres"
                  autoComplete="new-password"
                  autoCapitalize="none"
                  spellCheck={false}
                  minLength={12}
                  maxLength={1024}
                  aria-describedby="register-password-hint"
                  required
                />

                <PasswordToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                />
              </div>

              <span
                className="register-hint"
                id="register-password-hint"
              >
                Utiliza al menos 12 caracteres.
              </span>
            </div>

            <div className="register-field">
              <label htmlFor="register-confirm-password">
                Confirma tu contraseña
              </label>

              <div className="register-password-wrap">
                <input
                  id="register-confirm-password"
                  ref={confirmRef}
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setError("");
                    setSuccess("");
                  }}
                  placeholder="Escríbela otra vez"
                  autoComplete="new-password"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={1024}
                  aria-describedby="register-confirm-hint"
                  aria-invalid={confirmStatus === "mismatch"}
                  required
                />

                <PasswordToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                />
              </div>

              <span
                className="register-hint register-confirm-hint"
                id="register-confirm-hint"
                data-state={confirmStatus}
                role="status"
              >
                {confirmStatus === "match" && (
                  <Check size={14} strokeWidth={3} aria-hidden="true" />
                )}
                {confirmStatus === "mismatch" && (
                  <X size={14} strokeWidth={3} aria-hidden="true" />
                )}
                {CONFIRM_HINTS[confirmStatus]}
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
                {loading
                  ? "Creando cuenta..."
                  : "Crear mi cuenta"}
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
        <span>GensTI</span>
        <span aria-hidden="true">·</span>
        <span>Universidad Cooperativa de Colombia</span>
      </footer>
    </main>
  );
}