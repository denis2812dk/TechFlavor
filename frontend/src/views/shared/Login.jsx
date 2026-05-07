import { useEffect, useState } from "react";
import { getErrorMessage, signInWithEmail } from "../../lib/auth";

const TWEAK_DEFAULTS = {
  accentColor: "oklch(0.62 0.17 28)",
  surfaceTone: "oklch(0.99 0.01 85)",
  compactMode: false,
  brandName: "TechFlavor",
};

const T = {
  bg: "oklch(0.97 0.01 85)",
  surface: TWEAK_DEFAULTS.surfaceTone,
  text: "oklch(0.24 0.02 260)",
  muted: "oklch(0.52 0.03 250)",
  border: "oklch(0.87 0.02 255)",
  ring: "oklch(0.72 0.08 30 / 0.45)",
  accent: TWEAK_DEFAULTS.accentColor,
  accentSoft: "oklch(0.95 0.03 28)",
  danger: "oklch(0.58 0.20 25)",
  radius: "16px",
  easeOut: "cubic-bezier(.22,.61,.36,1)",
  shadow: "0 10px 30px oklch(0.20 0.02 260 / 0.08)",
};

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [toast, setToast] = useState("");

  const spacing = TWEAK_DEFAULTS.compactMode ? "18px" : "24px";

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
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 10% 10%, ${T.accentSoft}, transparent 45%), ${T.bg}`,
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'DM Sans', system-ui, sans-serif; background: ${T.bg}; color: ${T.text}; }
        .login-card { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: ${T.radius}; box-shadow: ${T.shadow}; width: min(440px, 100%); padding: ${spacing}; }
        .login-interactive { transition: transform 120ms ${T.easeOut}, background-color 120ms, box-shadow 160ms; }
        .login-interactive:hover { transform: translateY(-2px); }
        .login-interactive:active { transform: scale(0.96); }
        .login-field { width: 100%; border: 1px solid ${T.border}; border-radius: 12px; padding: 12px 14px; font-size: 15px; color: ${T.text}; background: white; }
        .login-field:focus { outline: none; box-shadow: 0 0 0 2px ${T.ring}; border-color: ${T.accent}; }
        .login-btn { width: 100%; border: none; border-radius: 12px; padding: 12px 16px; font-weight: 700; font-size: 15px; color: white; background: ${T.accent}; cursor: pointer; }
        .login-btn:disabled { cursor: wait; opacity: 0.72; }
        .login-link { color: ${T.accent}; text-decoration: none; font-weight: 600; }
        .login-link:hover { text-decoration: underline; }
        .login-badge { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; border: 1px solid ${T.border}; border-radius: 999px; padding: 4px 8px; color: ${T.muted}; }
        .login-toast { position: fixed; bottom: 20px; right: 20px; background: ${T.text}; color: white; padding: 10px 14px; border-radius: 12px; font-size: 14px; box-shadow: ${T.shadow}; animation: fadeUp .2s ${T.easeOut}; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
      `}</style>

      <main className="login-card" aria-live="polite">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
              <rect x="1" y="1" width="32" height="32" rx="9" fill={T.accentSoft} stroke={T.border} />
              <path d="M10 21h14M12 16h10M15 11h4" stroke={T.accent} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: "20px", lineHeight: 1 }}>{TWEAK_DEFAULTS.brandName}</div>
              <div style={{ color: T.muted, fontSize: "12px" }}>Restaurant Operations Cloud</div>
            </div>
          </div>
          <span className="login-badge">Seguro</span>
        </header>

        <form onSubmit={handleLogin}>
          <label style={{ display: "block", marginBottom: "12px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: T.muted }}>Correo</span>
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

          <label style={{ display: "block", marginBottom: "8px" }}>
            <span style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: T.muted }}>Contrasena</span>
            <div style={{ position: "relative" }}>
              <input
                className="login-field"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Ingresa tu contrasena"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="login-interactive"
                onClick={() => setShowPassword((current) => !current)}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "7px",
                  border: "none",
                  background: "transparent",
                  color: T.muted,
                  padding: "6px 8px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", margin: "-2px 0 18px" }}>
            <button
              type="button"
              className="login-interactive login-link"
              onClick={() => {
                setShowReset((current) => !current);
                setToast(showReset ? "Recuperacion cerrada" : "Recuperacion abierta");
              }}
              style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", fontSize: "13px" }}
            >
              Olvide mi contrasena
            </button>
          </div>

          <button className="login-btn login-interactive" type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        {error ? (
          <article style={{ marginTop: "12px", border: `1px solid ${T.danger}`, background: "oklch(0.98 0.02 25)", borderRadius: "12px", padding: "10px 12px", fontSize: "14px", color: T.danger }}>
            {error}
          </article>
        ) : null}

        {showReset ? (
          <section style={{ marginTop: "16px", border: `1px dashed ${T.border}`, borderRadius: "12px", padding: "14px" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: "15px", color: T.text }}>Recuperar acceso</h2>
            <p style={{ margin: "0 0 12px", color: T.muted, fontSize: "13px", lineHeight: 1.5 }}>
              Usaremos el correo escrito arriba para enviarte instrucciones cuando activemos este flujo.
            </p>
            <button
              type="button"
              className="login-interactive"
              onClick={handleReset}
              style={{ border: `1px solid ${T.border}`, background: "white", borderRadius: "10px", padding: "8px 10px", fontWeight: 700, cursor: "pointer", color: T.text }}
            >
              Preparar recuperacion
            </button>
          </section>
        ) : null}

        <section style={{ marginTop: "18px", borderTop: `1px solid ${T.border}`, paddingTop: "16px" }}>
          <div style={{ display: "grid", gap: "10px" }}>
            {[
              "Acceso por roles para caja, cocina, despacho y administracion.",
              "Sesion segura para proteger la operacion del restaurante.",
            ].map((item) => (
              <div key={item} style={{ display: "flex", gap: "10px", alignItems: "flex-start", color: T.muted, fontSize: "13px", lineHeight: 1.45 }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: T.accent, marginTop: "6px", flex: "0 0 auto" }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {toast ? <div className="login-toast">{toast}</div> : null}
    </div>
  );
}
