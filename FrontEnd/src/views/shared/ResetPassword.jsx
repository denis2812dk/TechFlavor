import { useState } from "react";
import "./Login.css";

export const ResetPassword = ({ onNavigate }) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      setError("El enlace no es válido o está incompleto (falta el token de seguridad).");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: password,
          token: token,
        }),
      });

      if (!res.ok) {
        throw new Error("El enlace ha expirado o ya fue utilizado anteriormente.");
      }

      setStatus("¡Contraseña restablecida con éxito! Redirigiendo al inicio de sesión...");
      setTimeout(() => onNavigate("/login"), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-panel" style={{ width: "100%", maxWidth: "450px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", padding: "20px" }}>
        <div className="login-form-inner" style={{ width: "100%" }}>
          <p className="login-kicker">Recuperación</p>
          <h2 className="login-title">Nueva contraseña</h2>
          <p style={{ color: "var(--color-muted)", marginBottom: "24px" }}>
            Ingresa tu nueva contraseña para recuperar el acceso a la plataforma de TechFlavor.
          </p>

          <form onSubmit={handleReset}>
            <div className="mb-3">
              <label className="login-field-label d-block">Nueva Contraseña</label>
              <input
                className="login-field"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                disabled={loading || status !== ""}
              />
            </div>

            {error && <p className="login-error-box mb-3">{error}</p>}
            {status && <p className="admin-users-success mb-3">{status}</p>}

            <button className="login-submit" type="submit" disabled={loading || status !== ""}>
              {loading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>

          <div className="text-center mt-4">
            <button type="button" className="login-link-btn" onClick={() => onNavigate("/login")}>
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};