import { useState } from "react";
import "./shared.css";

export const ProfileEdit = ({ session, onRefresh }) => {
  const [name, setName] = useState(session?.user?.name || "");
  const [email] = useState(session?.user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Apuntamos al backend (usando variable de entorno si existe, o localhost:3000 por defecto)
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatus("");
    setError("");
    setIsUpdating(true);

    try {
      // 1. Actualizar Nombre si cambió
      if (name !== session?.user?.name) {
        const res = await fetch(`${API_URL}/api/auth/update-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: name.trim() })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Error al actualizar el nombre");
        }
      }

      // 2. Actualizar Contraseña si se llenaron los campos
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error("La nueva contraseña y su confirmación no coinciden.");
        }
        if (!currentPassword) {
          throw new Error("Debes ingresar tu contraseña actual para realizar cambios de seguridad.");
        }

        const res = await fetch(`${API_URL}/api/auth/change-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            newPassword: newPassword,
            currentPassword: currentPassword,
            revokeOtherSessions: true,
          })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "La contraseña actual es incorrecta.");
        }
      }

      // Refrescar la sesión global para que el Navbar/Sidebar se actualicen
      if (onRefresh) await onRefresh();
      
      setStatus("¡Perfil actualizado con éxito!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="users-console" style={{ padding: "32px", maxWidth: "800px", margin: "0 auto" }}>
      <div className="users-console-head">
        <div>
          <p className="users-breadcrumb">Configuración</p>
          <h2>Mi Perfil</h2>
          <p>Personaliza tu información y asegura tu cuenta.</p>
        </div>
      </div>

      {status && <div className="admin-users-success">{status}</div>}
      {error && <div className="admin-users-error">{error}</div>}

      <form onSubmit={handleUpdateProfile} className="menu-saas-form">
        <div className="menu-two-columns">
          <label>
            <span>Nombre Completo</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              required
            />
          </label>

          <label>
            <span>Correo Electrónico</span>
            <input
              type="email"
              value={email}
              disabled
            />
            <small style={{ color: "var(--color-muted)", fontSize: "11px", marginTop: "4px" }}>
              El correo está vinculado a tu cuenta global.
            </small>
          </label>
        </div>

        <div className="menu-section-heading" style={{ marginTop: "12px" }}>
          <span>🔒</span>
          <div>
            <h3>Cambiar Contraseña</h3>
            <p>Déjalo en blanco si no deseas hacer cambios de seguridad.</p>
          </div>
        </div>

        <label>
          <span>Contraseña Actual</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Requerido para cambios"
          />
        </label>

        <div className="menu-two-columns">
          <label>
            <span>Nueva Contraseña</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Dejar vacío para no cambiar"
            />
          </label>
          <label>
            <span>Confirmar Nueva Contraseña</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
            />
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <button
            type="submit"
            className="menu-primary-action"
            disabled={isUpdating}
          >
            {isUpdating ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
};