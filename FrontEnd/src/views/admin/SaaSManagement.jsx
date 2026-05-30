import { useEffect, useState } from "react";
import { getPendingRequests, approveRequest, rejectRequest } from "../../lib/saas";
import "../shared/shared.css";

export const SaaSManagement = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Estados para acciones
  const [processingId, setProcessingId] = useState(null);
  const [credentials, setCredentials] = useState(null); // Almacena credenciales al aprobar

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await getPendingRequests();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchInitialRequests = async () => {
      try {
        const data = await getPendingRequests();
        if (!isMounted) return;
        setRequests(data.requests || []);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchInitialRequests();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleApprove = async (request) => {
    if (!window.confirm(`¿Estás seguro de crear la base de datos para ${request.restaurantName}?`)) return;
    
    setProcessingId(request.id);
    setError("");
    try {
      const response = await approveRequest(request.id);
      // Guardamos las credenciales generadas para mostrarlas en un modal/alerta
      setCredentials(response.data.credentials);
      await loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request) => {
    const reason = window.prompt(`Ingresa el motivo de rechazo para ${request.restaurantName} (Opcional):`);
    if (reason === null) return; // Si el admin le da cancelar al prompt

    setProcessingId(request.id);
    setError("");
    try {
      await rejectRequest(request.id, reason);
      await loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const closeCredentials = () => setCredentials(null);

  if (isLoading && requests.length === 0) {
    return (
      <div className="users-console">
        <div className="content-placeholder">
          <h2>Cargando base de datos central...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="users-console">
      <div className="users-console-head">
        <div>
          <p className="users-breadcrumb">Super Admin</p>
          <h2>Solicitudes de Suscripción</h2>
          <p>Revisa y aprueba a los nuevos restaurantes que desean usar TechFlavor.</p>
        </div>
        <div className="users-inline-stats">
          <span>{requests.length} Solicitudes pendientes</span>
        </div>
      </div>

      {error && <div className="admin-users-error">{error}</div>}

      {/* MODAL / ALERTA DE CREDENCIALES (Aparece tras aprobar) */}
      {credentials && (
        <div className="admin-users-panel mb-4 position-relative">
          <h4 className="fw-bold mb-3" style={{ color: "oklch(0.45 0.14 145)" }}>¡Restaurante Aprovisionado con Éxito!</h4>
          <p>La base de datos y la cuenta de <strong>{credentials.restaurantName}</strong> han sido creadas. Envía estos datos al cliente para que inicie sesión:</p>
          
          <div className="bg-white p-3 rounded border my-3 font-monospace text-dark">
            <div className="mb-2"><strong>URL de Acceso:</strong> <span style={{ color: "var(--color-accent)" }}>tu-dominio.com</span></div>
            <div className="mb-2"><strong>Usuario (Gerente):</strong> {credentials.email}</div>
            <div className="mb-0"><strong>Contraseña Temporal:</strong> <span>{credentials.tempPassword}</span></div>
          </div>
          <p className="mb-3 small" style={{ color: "var(--color-muted)" }}>Nota: El gerente podrá cambiar esta contraseña desde su panel de control.</p>
          <button type="button" className="users-primary-action users-secondary-action" onClick={closeCredentials}>Cerrar</button>
        </div>
      )}

      {/* TABLA DE SOLICITUDES */}
      <div className="users-management-shell">
        <div className="users-table-wrap">
          <div className="users-table-scroll">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Restaurante</th>
                  <th>Propietario / Contacto</th>
                  <th>Plan</th>
                  <th>Notas</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="users-empty-row">
                      No hay solicitudes de restaurantes pendientes.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id}>
                      <td>
                        {new Date(req.createdAt).toLocaleDateString('es-SV', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <div className="users-name-cell">
                          <div>
                            <strong>{req.restaurantName}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="users-name-cell">
                          <div>
                            <strong>{req.ownerName}</strong>
                            <small className="d-block">{req.email}</small>
                            <small className="d-block">{req.phone || "Sin teléfono"}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`users-role-badge ${req.planRequested === 'pro' ? 'role-admin' : ''}`}>
                          {req.planRequested.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {req.notes ? (
                          <span className="d-inline-block text-truncate" style={{ maxWidth: "200px" }} title={req.notes}>
                            {req.notes}
                          </span>
                        ) : (
                          <span className="fst-italic" style={{ opacity: 0.75 }}>Sin notas</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            className="users-primary-action users-secondary-action"
                            style={{ height: "34px", fontSize: "13px", padding: "0 12px" }}
                            disabled={processingId === req.id}
                            onClick={() => handleReject(req)}
                          >
                            Rechazar
                          </button>
                          <button
                            className="users-primary-action"
                            style={{ height: "34px", fontSize: "13px", padding: "0 12px" }}
                            disabled={processingId === req.id}
                            onClick={() => handleApprove(req)}
                          >
                            {processingId === req.id ? "Aprovisionando..." : "Aprobar y Crear"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
