import { useEffect, useState } from "react";
import { getErrorMessage, signInWithEmail } from "../../lib/auth";

const brandColor = "#2D1810";
const mutedColor = "#6B5D56";

export default function Login({ onLogin }) {
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
      setError("Ingresa tu correo y contrasena para continuar.");
      return;
    }

    if (!email.includes("@")) {
      setError("Usa un correo valido.");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmail({ email: email.trim(), password });
      setToast("Sesion iniciada correctamente");
      await onLogin?.();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (!email.trim()) {
      setError("Escribe tu correo para preparar la recuperacion de acceso.");
      return;
    }

    setError("");
    setToast("Recuperacion de contrasena pendiente de conectar al backend.");
  };

  return (
    <main className="login-shell">
      <style>{`
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: Inter, 'Plus Jakarta Sans', system-ui, sans-serif;
          background: #F7F3F1;
          color: ${brandColor};
        }
        .login-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(360px, 0.95fr) minmax(420px, 1.05fr);
          background: #F7F3F1;
        }
        .login-brand-panel {
          position: relative;
          display: grid;
          place-items: center;
          min-height: 100vh;
          border-right: 1px solid rgba(45, 24, 16, 0.06);
          padding: 32px;
          overflow: hidden;
        }
        .login-brand-panel::after {
          content: "";
          position: absolute;
          inset: auto -120px -160px auto;
          width: 420px;
          height: 420px;
          border-radius: 999px;
          background: rgba(232, 155, 143, 0.18);
          filter: blur(2px);
        }
        .login-brand-copy {
          position: relative;
          z-index: 1;
          max-width: 520px;
          text-align: center;
        }
        .login-kicker {
          margin: 0 0 14px;
          color: ${mutedColor};
          font-size: 12px;
          font-weight: 820;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .login-brand-copy h1 {
          margin: 0;
          color: ${brandColor};
          font-size: clamp(42px, 5vw, 72px);
          line-height: 0.96;
          letter-spacing: 0;
          font-weight: 880;
        }
        .login-brand-copy p {
          max-width: 460px;
          margin: 22px auto 0;
          color: ${mutedColor};
          font-size: 16px;
          line-height: 1.7;
        }
        .login-secure-badge {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          border: 1px solid rgba(45, 24, 16, 0.07);
          border-radius: 999px;
          padding: 0 11px;
          background: rgba(255,255,255,0.48);
          color: ${mutedColor};
          font-size: 12px;
          font-weight: 760;
        }
        .login-form-panel {
          display: grid;
          place-items: center;
          min-height: 100vh;
          padding: 32px;
        }
        .login-card {
          width: min(440px, 100%);
          display: grid;
          gap: 22px;
          border: 1px solid rgba(45, 24, 16, 0.065);
          border-radius: 22px;
          background: rgba(253, 252, 251, 0.76);
          box-shadow: 0 24px 60px rgba(45, 24, 16, 0.08);
          padding: 28px;
          backdrop-filter: blur(18px);
        }
        .login-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
        }
        .login-card h2 {
          margin: 0;
          color: ${brandColor};
          font-size: 34px;
          line-height: 1.1;
          font-weight: 860;
        }
        .login-card-head p {
          margin: 9px 0 0;
          color: ${mutedColor};
          font-size: 14px;
          line-height: 1.6;
        }
        .login-form {
          display: grid;
          gap: 14px;
        }
        .login-form label {
          display: grid;
          gap: 8px;
        }
        .login-form label span {
          color: ${mutedColor};
          font-size: 12px;
          font-weight: 780;
        }
        .login-field-wrap {
          position: relative;
        }
        .login-field {
          width: 100%;
          height: 48px;
          border: 1px solid rgba(45, 24, 16, 0.08);
          border-radius: 12px;
          padding: 0 14px;
          background: rgba(255,255,255,0.72);
          color: ${brandColor};
          outline: none;
          font-size: 14px;
          transition: border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
        }
        .login-field:focus {
          border-color: rgba(232, 155, 143, 0.72);
          background: white;
          box-shadow: 0 0 0 4px rgba(232, 155, 143, 0.14);
        }
        .login-field:disabled {
          opacity: 0.72;
          cursor: wait;
        }
        .login-password-toggle {
          position: absolute;
          top: 7px;
          right: 7px;
          height: 34px;
          border: 0;
          border-radius: 9px;
          padding: 0 10px;
          background: transparent;
          color: ${mutedColor};
          cursor: pointer;
          font-weight: 760;
        }
        .login-row {
          display: flex;
          justify-content: flex-end;
          margin-top: -2px;
        }
        .login-link {
          border: 0;
          background: transparent;
          color: ${brandColor};
          cursor: pointer;
          font-size: 13px;
          font-weight: 780;
        }
        .login-submit {
          height: 48px;
          border: 0;
          border-radius: 12px;
          background: ${brandColor};
          color: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 840;
          box-shadow: 0 14px 28px rgba(45, 24, 16, 0.16);
          transition: transform 140ms ease, box-shadow 140ms ease;
        }
        .login-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 18px 34px rgba(45, 24, 16, 0.18);
        }
        .login-submit:disabled {
          opacity: 0.7;
          cursor: wait;
        }
        .login-error {
          margin: 0;
          border: 1px solid rgba(185, 28, 28, 0.18);
          border-radius: 12px;
          padding: 11px 12px;
          background: rgba(254, 242, 242, 0.78);
          color: #991b1b;
          font-size: 13px;
          font-weight: 700;
        }
        .login-reset-panel {
          display: grid;
          gap: 10px;
          border: 1px solid rgba(45, 24, 16, 0.07);
          border-radius: 14px;
          background: rgba(255,255,255,0.52);
          padding: 14px;
        }
        .login-reset-panel strong {
          color: ${brandColor};
          font-size: 14px;
        }
        .login-reset-panel p {
          margin: 0;
          color: ${mutedColor};
          font-size: 13px;
          line-height: 1.55;
        }
        .login-reset-panel button {
          justify-self: start;
          height: 36px;
          border: 1px solid rgba(45, 24, 16, 0.08);
          border-radius: 10px;
          padding: 0 12px;
          background: rgba(255,255,255,0.7);
          color: ${brandColor};
          cursor: pointer;
          font-weight: 780;
        }
        .login-toast {
          position: fixed;
          right: 22px;
          bottom: 22px;
          border-radius: 12px;
          padding: 11px 14px;
          background: ${brandColor};
          color: white;
          box-shadow: 0 14px 30px rgba(45, 24, 16, 0.18);
          font-size: 13px;
          font-weight: 760;
        }
        @media (max-width: 900px) {
          .login-shell { grid-template-columns: 1fr; }
          .login-brand-panel {
            min-height: auto;
            gap: 56px;
            border-right: 0;
            border-bottom: 1px solid rgba(45, 24, 16, 0.06);
          }
          .login-form-panel { min-height: auto; place-items: start; }
        }
        @media (max-width: 560px) {
          .login-brand-panel, .login-form-panel { padding: 22px; }
          .login-card h2 { font-size: 28px; }
          .login-card-head { flex-direction: column; }
        }
      `}</style>

      <section className="login-brand-panel" aria-label="Panel de acceso">
        <div className="login-brand-copy">
          <p className="login-kicker">SaaS multi-restaurante</p>
          <h1>Operaciones claras desde el primer turno.</h1>
          <p>Accede al panel para administrar caja, cocina, despacho, usuarios y catalogo del restaurante con permisos por rol.</p>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-card" aria-live="polite">
          <header className="login-card-head">
            <div>
              <p className="login-kicker">Iniciar sesion</p>
              <h2>Bienvenido de nuevo</h2>
              <p>Usa tus credenciales del restaurante para continuar.</p>
            </div>
            <span className="login-secure-badge">Seguro</span>
          </header>

          <form className="login-form" onSubmit={handleLogin}>
            <label>
              <span>Correo</span>
              <input
                className="login-field"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@techflavor.com"
                autoComplete="email"
                disabled={loading}
              />
            </label>

            <label>
              <span>Contrasena</span>
              <div className="login-field-wrap">
                <input
                  className="login-field"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Ingresa tu contrasena"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button type="button" className="login-password-toggle" onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </label>

            <div className="login-row">
              <button
                type="button"
                className="login-link"
                onClick={() => {
                  setShowReset((current) => !current);
                  setToast(showReset ? "Recuperacion cerrada" : "Recuperacion abierta");
                }}
              >
                Olvide mi contrasena
              </button>
            </div>

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          {error ? <p className="login-error">{error}</p> : null}

          {showReset ? (
            <section className="login-reset-panel">
              <strong>Recuperar acceso</strong>
              <p>Usaremos el correo escrito arriba para enviarte instrucciones cuando activemos este flujo.</p>
              <button type="button" onClick={handleReset}>Preparar recuperacion</button>
            </section>
          ) : null}
        </div>
      </section>

      {toast ? <div className="login-toast">{toast}</div> : null}
    </main>
  );
}
