import { useEffect, useState } from "react";
import { getRegisteredRestaurants } from "../../lib/saas";
import "../shared/shared.css";

export const SaaSRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadRestaurants = async () => {
      try {
        setIsLoading(true);
        const data = await getRegisteredRestaurants();
        if (isMounted) {
          setRestaurants(data.restaurants || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRestaurants();

    return () => {
      isMounted = false;
    };
  }, []);

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
          <h2>Restaurantes Activos</h2>
          <p>Listado de todos los inquilinos (clientes) que están utilizando TechFlavor.</p>
        </div>
        <div className="users-inline-stats">
          <span>{restaurants.length} Clientes totales</span>
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
                </tr>
              </thead>
              <tbody>
                {restaurants.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="users-empty-row">
                      Aún no hay restaurantes registrados en la plataforma.
                    </td>
                  </tr>
                ) : (
                  restaurants.map((rest) => (
                    <tr key={rest.id}>
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
                      <td>{rest.databaseName}</td>
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
                          {rest.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
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