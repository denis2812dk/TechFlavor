import { useEffect, useState } from "react";
import { getErrorMessage, signInWithEmail } from "../../lib/auth";
import "./Login.css";

// Bootstrap debe estar cargado globalmente en tu app:
// import 'bootstrap/dist/css/bootstrap.min.css';

export default function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña para continuar.");
      return;
    }
    if (!email.includes("@")) {
      setError("Usa un correo válido.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail({ email: email.trim(), password });
      setToast("Sesión iniciada correctamente");
      await onLogin?.();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (!email.trim()) {
      setError("Escribe tu correo para preparar la recuperación de acceso.");
      return;
    }
    setError("");
    setToast("Recuperación de contraseña pendiente de conectar al backend.");
  };

  return (
    <>
      <main className="login-page">
        {/* Panel visual izquierdo */}
        <div className="login-visual">
          {/* Reemplaza src con la imagen de tu proyecto */}
          <img src="/restaurant-bg.jpg" alt="Restaurante" />
          <div className="login-brand">
            <span>SaaS multi-restaurante</span>
            <h1>Operaciones claras desde el primer turno.</h1>
            <p>
              Accede al panel para administrar caja, cocina, despacho, usuarios
              y catálogo del restaurante con permisos por rol.
            </p>
          </div>
        </div>

        {/* Panel de formulario derecho */}
        <div className="login-panel">
          <div className="login-form-inner" aria-live="polite">

            <p className="login-kicker">Iniciar sesión</p>
            <h2 className="login-title">Bienvenido de nuevo</h2>

            <form onSubmit={handleLogin} noValidate>
              {/* Correo */}
              <div className="mb-3">
                <label className="login-field-label d-block">Correo</label>
                <input
                  className="login-field"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@techflavor.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              {/* Contraseña */}
              <div className="mb-3">
                <label className="login-field-label d-block">Contraseña</label>
                <div className="position-relative">
                  <input
                    className="login-field"
                    style={{ paddingRight: "70px" }}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              {/* Olvidé contraseña */}
              <div className="d-flex justify-content-end mb-3">
                <button
                  type="button"
                  className="login-link-btn"
                  onClick={() => {
                    setShowReset((v) => !v);
                    setToast(showReset ? "Recuperación cerrada" : "Recuperación abierta");
                  }}
                >
                  Olvidé mi contraseña
                </button>
              </div>

              <div className="mb-3 text-center">
                <p className="mb-2 text-muted small">
                  ¿No tienes cuenta? Regístrate con nosotros y te ayudamos a comenzar.
                </p>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm px-4"
                  onClick={() => onRegister?.()}
                >
                  Crear cuenta
                </button>
              </div>

              {/* Error */}
              {error && <p className="login-error-box mb-3">{error}</p>}

              {/* Panel recuperación */}
              {showReset && (
                <div className="login-reset-panel mb-3">
                  <strong>Recuperar acceso</strong>
                  <p>
                    Usaremos el correo escrito arriba para enviarte instrucciones
                    cuando activemos este flujo.
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleReset}
                  >
                    Preparar recuperación
                  </button>
                </div>
              )}

              {/* Submit */}
              <button className="login-submit" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Ingresando...
                  </>
                ) : (
                  "Ingresar"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {toast && <div className="login-toast">{toast}</div>}
    </>
  );
}