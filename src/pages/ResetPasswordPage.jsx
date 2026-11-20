import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import logoGensti from "../assets/genssti-logo.jpg";
import "./ResetPasswordPage.css";


function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";


  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");


  const handleSubmit = async (event) => {
    event.preventDefault();


    setError("");


    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }


    setLoading(true);


    try {
      const response = await fetch("/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          token,
          password,
        }),
      });


      const data = await response.json().catch(() => ({}));


      if (!response.ok) {
        throw new Error(
          data.detail || "No fue posible restablecer la contraseña"
        );
      }


      setSuccess(true);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Ocurrió un error al restablecer la contraseña"
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="reset-page">
      <header className="reset-header">
        <Link to="/" className="reset-brand">
          <img
            src={logoGensti}
            alt="Logo de GensTI"
            className="reset-logo"
          />


          <span>
            <strong>GensTI</strong>
            <small>Ingeniería de Sistemas</small>
          </span>
        </Link>
      </header>


      <section className="reset-panel">
        {success ? (
          <>
            <h1>Contraseña actualizada</h1>


            <p>
              Tu contraseña fue restablecida correctamente.
              Ahora puedes iniciar sesión con la nueva contraseña.
            </p>


            <Link to="/login" className="reset-button">
              Iniciar sesión
            </Link>
          </>
        ) : (
          <>
            <p className="reset-label">NUEVA CONTRASEÑA</p>


            <h1>Restablecer contraseña</h1>


            <p>
              Crea una nueva contraseña para tu cuenta de GensTI.
            </p>


            <form onSubmit={handleSubmit} className="reset-form">
              <div className="reset-field">
                <label htmlFor="password">
                  Nueva contraseña
                </label>


                <div className="reset-password-input">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 12 caracteres"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    autoCapitalize="none"
                    spellCheck={false}
                    minLength={12}
                    maxLength={1024}
                    required
                  />


                  <button
                    type="button"
                    className="reset-password-toggle"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    onMouseDown={(event) =>
                      event.preventDefault()
                    }
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
                      <EyeOff size={22} />
                    ) : (
                      <Eye size={22} />
                    )}
                  </button>
                </div>
              </div>


              <div className="reset-field">
                <label htmlFor="confirmPassword">
                  Confirmar contraseña
                </label>


                <div className="reset-password-input">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    autoCapitalize="none"
                    spellCheck={false}
                    minLength={12}
                    maxLength={1024}
                    required
                  />


                  <button
                    type="button"
                    className="reset-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
                    onMouseDown={(event) =>
                      event.preventDefault()
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    aria-pressed={showConfirmPassword}
                    title={
                      showConfirmPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={22} />
                    ) : (
                      <Eye size={22} />
                    )}
                  </button>
                </div>
              </div>


              {error && (
                <div className="reset-error" role="alert">
                  {error}
                </div>
              )}


              <button
                type="submit"
                className="reset-button"
                disabled={loading || !token}
              >
                {loading
                  ? "Guardando..."
                  : "Restablecer contraseña"}
              </button>
            </form>


            <div className="reset-login">
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


export default ResetPasswordPage;