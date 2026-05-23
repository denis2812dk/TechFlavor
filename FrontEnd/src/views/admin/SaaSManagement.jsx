import { useEffect, useState } from "react";
import { getPendingRequests, approveRequest, rejectRequest } from "../../lib/saas";

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
    loadRequests();
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
    return <div className="p-5 text-center text-muted">Cargando base de datos central...</div>;
  }

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4 border-bottom pb-3">
        <div>
          <p className="text-uppercase text-muted fw-semibold small mb-1">Super Admin</p>
          <h2 className="h3 mb-1">Solicitudes de Suscripción</h2>
          <p className="text-muted mb-0">Revisa y aprueba a los nuevos restaurantes que desean usar TechFlavor.</p>
        </div>
        <div className="d-flex gap-2">
          <span className="badge text-bg-primary fs-6 py-2 px-3">
            {requests.length} Solicitudes pendientes
          </span>
        </div>
      </div>

      {error && <div className="alert alert-danger shadow-sm border-0">{error}</div>}

      {/* MODAL / ALERTA DE CREDENCIALES (Aparece tras aprobar) */}
      {credentials && (
        <div className="alert alert-success border border-success border-opacity-25 shadow-sm p-4 mb-4 position-relative">
          <button type="button" className="btn-close position-absolute top-0 end-0 m-3" onClick={closeCredentials}></button>
          <h4 className="alert-heading fw-bold mb-3">¡Restaurante Aprovisionado con Éxito!</h4>
          <p>La base de datos y la cuenta de <strong>{credentials.restaurantName}</strong> han sido creadas. Envía estos datos al cliente para que inicie sesión:</p>
          
          <div className="bg-white p-3 rounded border border-success border-opacity-25 my-3 font-monospace">
            <div className="mb-2"><strong>URL de Acceso:</strong> <span className="text-primary">tu-dominio.com</span></div>
            <div className="mb-2"><strong>Usuario (Gerente):</strong> {credentials.email}</div>
            <div className="mb-0"><strong>Contraseña Temporal:</strong> <span className="badge bg-dark fs-6">{credentials.tempPassword}</span></div>
          </div>
          <p className="mb-0 small text-muted">Nota: El gerente podrá cambiar esta contraseña desde su panel de control.</p>
        </div>
      )}

      {/* TABLA DE SOLICITUDES */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Restaurante</th>
                  <th className="py-3 px-4">Propietario / Contacto</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Notas</th>
                  <th className="py-3 px-4 text-end">Acciones</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No hay solicitudes de restaurantes pendientes.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id}>
                      <td className="px-4 text-muted small">
                        {new Date(req.createdAt).toLocaleDateString('es-SV', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 fw-semibold text-dark">
                        {req.restaurantName}
                      </td>
                      <td className="px-4">
                        <div className="fw-medium">{req.ownerName}</div>
                        <div className="small text-muted">{req.email}</div>
                        <div className="small text-muted">{req.phone || "Sin teléfono"}</div>
                      </td>
                      <td className="px-4">
                        <span className={`badge ${req.planRequested === 'pro' ? 'text-bg-warning' : 'text-bg-secondary'}`}>
                          {req.planRequested.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4">
                        {req.notes ? (
                          <span className="d-inline-block text-truncate small text-muted" style={{ maxWidth: "200px" }} title={req.notes}>
                            {req.notes}
                          </span>
                        ) : (
                          <span className="text-muted small fst-italic">Sin notas</span>
                        )}
                      </td>
                      <td className="px-4 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            className="btn btn-sm btn-outline-danger fw-semibold"
                            disabled={processingId === req.id}
                            onClick={() => handleReject(req)}
                          >
                            Rechazar
                          </button>
                          <button
                            className="btn btn-sm btn-success fw-semibold"
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