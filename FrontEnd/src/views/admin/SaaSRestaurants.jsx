import { useEffect, useState } from "react";
import { getRegisteredRestaurants, toggleRestaurantStatus } from "../../lib/saas";
import "../shared/shared.css";

export const SaaSRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRestaurants = async () => {
    try {
      setIsLoading(true);
      const data = await getRegisteredRestaurants();
      setRestaurants(data.restaurants || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchInitialRestaurants = async () => {
      try {
        const data = await getRegisteredRestaurants();
        if (isMounted) setRestaurants(data.restaurants || []);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchInitialRestaurants();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleStatus = async (restaurant) => {
    const isSuspending = restaurant.status === "active";
    const actionText = isSuspending ? "SUSPENDER" : "REACTIVAR";
    
    if (!window.confirm(`¿Estás seguro que deseas ${actionText} el acceso al restaurante "${restaurant.name}"?`)) {
      return;
    }

    try {
      const res = await toggleRestaurantStatus(restaurant.id);
      alert(res.message);
      await loadRestaurants(); // Refresca la tabla para ver el nuevo estado
    } catch (err) {
      alert(err.message);
    }
  };

  if (isLoading && restaurants.length === 0) {
    return (
      <div className="users-console">
        <div className="content-placeholder">
          <p>Cargando base de clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-console">
      <div className="users-console-head">
        <div>
          <div className="users-breadcrumb">Super Admin</div>
          <h2>Restaurantes Registrados</h2>
          <p>Gestiona los inquilinos (clientes) que están utilizando la plataforma TechFlavor.</p>
        </div>
        <div className="users-inline-stats" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span>{restaurants.length} Clientes totales</span>
          <button type="button" className="users-primary-action users-secondary-action" onClick={loadRestaurants} style={{ height: "36px", padding: "0 16px" }}>
            Actualizar Lista
          </button>
        </div>
      </div>

      {error && <div className="admin-users-error">{error}</div>}

      <div className="users-management-shell">
        <div className="users-table-wrap">
          <div className="users-table-scroll">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Fecha de Alta</th>
                  <th>Nombre Comercial</th>
                  <th>Slug (URL)</th>
                  <th>Base de Datos Fija</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acción Restrictiva</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="users-empty-row">
                      Aún no hay restaurantes registrados en la plataforma.
                    </td>
                  </tr>
                ) : (
                  restaurants.map((rest) => (
                    <tr key={rest.id} style={{ opacity: rest.status === "active" ? 1 : 0.65 }}>
                      <td>
                        {new Date(rest.createdAt).toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <div className="users-name-cell">
                          <span>{rest.name.charAt(0).toUpperCase()}</span>
                          <strong>{rest.name}</strong>
                        </div>
                      </td>
                      <td>/{rest.slug}</td>
                      <td><code style={{ fontSize: "12px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>{rest.databaseName}</code></td>
                      <td>
                        <span className={`users-role-badge ${rest.plan === 'pro' ? 'role-admin' : ''}`}>
                          {rest.plan.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className="users-status-text">
                          <i style={{ 
                            background: rest.status === 'active' ? 'oklch(.69 .14 145)' : 'oklch(.55 .2 25)',
                            borderColor: rest.status === 'active' ? 'oklch(.69 .14 145)' : 'oklch(.55 .2 25)'
                          }}></i>
                          {rest.status === 'active' ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="users-primary-action"
                          style={{ 
                            height: "34px", 
                            fontSize: "13px", 
                            padding: "0 16px",
                            background: rest.status === "active" ? "#b91c1c" : "#16a34a",
                            border: "none",
                            boxShadow: "none"
                          }}
                          onClick={() => handleToggleStatus(rest)}
                        >
                          {rest.status === "active" ? "Suspender (Pánico)" : "Reactivar Acceso"}
                        </button>
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