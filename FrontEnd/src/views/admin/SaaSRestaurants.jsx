import { useEffect, useState } from "react";
import { getRegisteredRestaurants } from "../../lib/saas";

export const SaaSRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRestaurants = async () => {
    try {
      setIsLoading(true);
      const data = await getRegisteredRestaurants();
      setRestaurants(data.restaurants || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  if (isLoading && restaurants.length === 0) {
    return <div className="p-5 text-center text-muted">Cargando base de clientes...</div>;
  }

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4 border-bottom pb-3">
        <div>
          <p className="text-uppercase text-muted fw-semibold small mb-1">Super Admin</p>
          <h2 className="h3 mb-1">Restaurantes Activos</h2>
          <p className="text-muted mb-0">Listado de todos los inquilinos (clientes) que están utilizando TechFlavor.</p>
        </div>
        <div className="d-flex gap-2">
          <span className="badge text-bg-success fs-6 py-2 px-3">
            {restaurants.length} Clientes totales
          </span>
        </div>
      </div>

      {error && <div className="alert alert-danger shadow-sm border-0">{error}</div>}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-4">Fecha de Alta</th>
                  <th className="py-3 px-4">Nombre Comercial</th>
                  <th className="py-3 px-4">Slug (URL)</th>
                  <th className="py-3 px-4">Base de Datos Fija</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {restaurants.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      Aún no hay restaurantes registrados en la plataforma.
                    </td>
                  </tr>
                ) : (
                  restaurants.map((rest) => (
                    <tr key={rest.id}>
                      <td className="px-4 text-muted small">
                        {new Date(rest.createdAt).toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 fw-bold text-dark">
                        {rest.name}
                      </td>
                      <td className="px-4 font-monospace small text-primary">
                        /{rest.slug}
                      </td>
                      <td className="px-4 font-monospace small text-muted">
                        {rest.databaseName}
                      </td>
                      <td className="px-4">
                        <span className={`badge ${rest.plan === 'pro' ? 'text-bg-warning' : 'text-bg-secondary'}`}>
                          {rest.plan.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 text-center">
                        <span className={`badge rounded-pill ${rest.status === 'active' ? 'text-bg-success' : 'text-bg-danger'}`}>
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