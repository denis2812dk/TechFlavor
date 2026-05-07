import { useEffect, useState } from "react";
import { getErrorMessage, getMenuCatalog } from "../../lib/auth";

export const CashierCatalog = () => {
  const [catalog, setCatalog] = useState({ products: [], combos: [] });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const data = await getMenuCatalog();
        setCatalog(data);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setIsLoading(false);
      }
    };

    loadCatalog();
  }, []);

  return (
    <section className="admin-users-panel menu-admin-panel">
      <div>
        <p className="admin-users-kicker">Caja</p>
        <h2>Catalogo disponible</h2>
        <p>Solo aparecen productos y combos activos para venta.</p>
      </div>

      {isLoading && <p>Cargando catalogo...</p>}
      {error && <p className="admin-users-error">{error}</p>}

      <div className="menu-list-grid">
        <div>
          <h3>Productos</h3>
          {catalog.products.map((product) => (
            <article className="menu-sale-card" key={product.id}>
              <strong>{product.name}</strong>
              <span>{product.categoryName}</span>
              <p>{product.description}</p>
              <b>${product.price}</b>
            </article>
          ))}
        </div>

        <div>
          <h3>Combos</h3>
          {catalog.combos.map((combo) => (
            <article className="menu-sale-card" key={combo.id}>
              <strong>{combo.name}</strong>
              <span>{combo.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ")}</span>
              <p>{combo.description}</p>
              <b>${combo.price}</b>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
