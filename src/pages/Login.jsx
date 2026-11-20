import { lazy, memo, Suspense, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "./Login.css";
import logoGensti from "../assets/genssti-logo.jpg";
import { useAuth } from "../context/AuthContext";

const FloatingLines = memo(
  lazy(() => import("../components/FloatingLines/FloatingLines"))
);

const ENABLED_WAVES = ["top", "middle", "bottom"];
const LINES_GRADIENT = ["#00A6A6", "#2B8C85", "#72B947"];

const TOP_WAVE_POSITION = { x: 10.0, y: 0.5, rotate: -0.4 };
const MIDDLE_WAVE_POSITION = { x: 5.0, y: 0.0, rotate: 0.2 };
const BOTTOM_WAVE_POSITION = { x: 2.0, y: -0.7, rotate: 0.4 };

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "No fue posible iniciar sesión"
        );
      }

      const sessionResponse = await fetch("/auth/me", {
        credentials: "include",
      });

      if (!sessionResponse.ok) {
        throw new Error(
          "La sesión se creó, pero no fue posible cargar tu perfil"
        );
      }

      const userData = await sessionResponse.json();

      setUser(userData);

      navigate("/", { replace: true });
    } catch (requestError) {
      setError(
        requestError.message ||
          "Ocurrió un error al iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      {/* Fondo animado */}
      <div className="login-background" aria-hidden="true">
        <Suspense fallback={null}>
          <FloatingLines
            enabledWaves={ENABLED_WAVES}
            lineCount={8}
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

      <div className="login-overlay" aria-hidden="true" />

      {/* Header */}
      <header className="login-header">
      <div className="brand">
        <div className="brand-logo-frame">
          <span className="brand-logo-glow" aria-hidden="true" />

          <img
            className="brand-logo"
            src={logoGensti}
            alt="Logo de GensTI"
          />
        </div>

        <div className="brand-text">
          <strong>GensTI</strong>
          <span>Ingeniería de Sistemas</span>
        </div>
      </div>
    </header>

      {/* Contenido principal */}
      <section className="login-content">
        {/* Introducción */}
        <div className="login-introduction">
          <p className="eyebrow">
            Comunidad de Ingeniería de Sistemas
          </p>

          <h1>
            Todo lo que pasa
            <br />
            <span>en Ingeniería de Sistemas.</span>
          </h1>

          <p className="introduction-text">
            Un espacio para conectar, participar y estar al día
            con todo lo que ocurre en nuestra comunidad.
          </p>
        </div>

        {/* Panel de login */}
        <section
          className="login-panel"
          aria-labelledby="login-title"
        >
          <div className="login-panel-top">
            <p className="login-label">ACCESO</p>

            <h2 id="login-title">
              Bienvenido.
            </h2>

            <p>
              Ingresa con tu correo institucional para continuar.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="login-form"
          >
            {/* Correo */}
            <div className="field">
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

            {/* Contraseña */}
            <div className="field">
              <div className="field-label-row">
                <label htmlFor="password">
                  Contraseña
                </label>

                <Link
                  to="/olvide-contrasena"
                  className="forgot-password">
                  ¿La olvidaste?
                </Link>
              </div>

              <div className="password-input">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  // Evita que el botón le quite el foco al campo al hacer clic
                  onMouseDown={(event) => event.preventDefault()}
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  aria-pressed={showPassword}
                  title={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff key="hide" size={22} />
                  ) : (
                    <Eye key="show" size={22} />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="login-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Ingresando..."
                  : "Ingresar"}
              </span>

              {!loading && (
                <span
                  className="button-arrow"
                  aria-hidden="true"
                >
                  →
                </span>
              )}
            </button>
          </form>

          {/* Registro */}
          <div className="register-prompt">
            <span>
              ¿Todavía no tienes una cuenta?
            </span>

            <Link to="/registro">
              Crear cuenta
            </Link>
          </div>
        </section>
      </section>

      {/* Footer */}
      <footer className="login-footer">
        <span>GensTI</span>

        <span aria-hidden="true">
          •
        </span>

        <span>
          Universidad Cooperativa de Colombia
        </span>
      </footer>
    </main>
  );
}

export default Login;