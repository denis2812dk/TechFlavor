import { useState } from "react";

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
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8 col-xl-7">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">
              <div className="mb-4">
                <p className="text-uppercase text-muted fw-semibold small mb-1">Configuración</p>
                <h2 className="h3 fw-bold mb-1">Mi Perfil</h2>
                <p className="text-muted">Personaliza tu información y asegura tu cuenta.</p>
              </div>

              {status && <div className="alert alert-success border-0 shadow-sm">{status}</div>}
              {error && <div className="alert alert-danger border-0 shadow-sm">{error}</div>}

              <form onSubmit={handleUpdateProfile} className="row g-4">
                <div className="col-12">
                  <label className="form-label fw-semibold">Nombre Completo</label>
                  <input
                    type="text"
                    className="form-control form-control-lg fs-6"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-control form-control-lg fs-6 bg-light"
                    value={email}
                    disabled
                  />
                  <div className="form-text">El correo está vinculado a tu cuenta global y no puede cambiarse aquí.</div>
                </div>

                <div className="col-12 border-top pt-4">
                  <h4 className="h6 fw-bold mb-3">Cambiar Contraseña</h4>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small text-muted">Contraseña Actual</label>
                      <input
                        type="password"
                        className="form-control"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Requerido para cambios"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-muted">Nueva Contraseña</label>
                      <input
                        type="password"
                        className="form-control"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Dejar vacío para no cambiar"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-muted">Confirmar Nueva Contraseña</label>
                      <input
                        type="password"
                        className="form-control"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite la contraseña"
                      />
                    </div>
                  </div>
                </div>

                <div className="col-12 d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg px-4 fs-6"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Guardando...
                      </>
                    ) : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};