import { useEffect, useState } from "react";
import { getPendingRequests, approveRequest, rejectRequest, getSaaSStatistics } from "../../lib/saas";
import "../shared/shared.css";

export const SaaSManagement = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ totalRestaurants: 0, activeRestaurants: 0, pendingApprovals: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Estados para acciones
  const [processingId, setProcessingId] = useState(null);
  const [credentials, setCredentials] = useState(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsData, requestsData] = await Promise.all([
        getSaaSStatistics(),
        getPendingRequests()
      ]);
      setStats(statsData.stats);
      setRequests(requestsData.requests || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const [statsData, requestsData] = await Promise.all([
          getSaaSStatistics(),
          getPendingRequests()
        ]);
        if (!isMounted) return;
        setStats(statsData.stats);
        setRequests(requestsData.requests || []);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchInitialData();

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
      setCredentials(response.data.credentials);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request) => {
    const reason = window.prompt(`Ingresa el motivo de rechazo para ${request.restaurantName} (Opcional):`);
    if (reason === null) return;

    setProcessingId(request.id);
    setError("");
    try {
      await rejectRequest(request.id, reason);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const closeCredentials = () => setCredentials(null);

  if (isLoading && requests.length === 0 && stats.totalRestaurants === 0) {
    return (
      <div className="users-console">
        <div className="content-placeholder">
          <h2>Cargando métricas y solicitudes...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="users-console">
      <div className="users-console-head">
        <div>
          <p className="users-breadcrumb">Super Admin</p>
          <h2>Dashboard Central</h2>
          <p>Métricas de la plataforma y revisión de nuevas suscripciones a TechFlavor.</p>
        </div>
        <div className="users-inline-stats" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button type="button" className="users-primary-action users-secondary-action" onClick={loadData} style={{ height: "36px", padding: "0 16px" }}>
            Actualizar Datos
          </button>
        </div>
      </div>

      {error && <div className="admin-users-error">{error}</div>}

      {/* --- NUEVA SECCIÓN DE ESTADÍSTICAS --- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px", marginTop: "16px" }}>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <p style={{ margin: 0, color: "#64748b", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>Clientes Registrados</p>
          <h3 style={{ margin: "8px 0 0", fontSize: "36px", color: "#0f172a", fontWeight: "900" }}>{stats.totalRestaurants}</h3>
        </div>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <p style={{ margin: 0, color: "#16a34a", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>Operando Activos</p>
          <h3 style={{ margin: "8px 0 0", fontSize: "36px", color: "#15803d", fontWeight: "900" }}>{stats.activeRestaurants}</h3>
        </div>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <p style={{ margin: 0, color: "#d97706", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pendientes de Aprobar</p>
          <h3 style={{ margin: "8px 0 0", fontSize: "36px", color: "#b45309", fontWeight: "900" }}>{stats.pendingApprovals}</h3>
        </div>
      </div>

      {/* MODAL DE CREDENCIALES */}
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
      <h3 style={{ fontSize: "18px", marginBottom: "16px", color: "#0f172a" }}>Solicitudes de Inquilinos en Espera</h3>
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