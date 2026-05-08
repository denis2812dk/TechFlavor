import { useEffect, useState } from "react";
import { deliverDispatchOrder, getErrorMessage, listDispatchOrders } from "../../lib/auth";

const deliveryLabel = (order) => {
  if (order.fulfillmentType === "dine_in") {
    return `Mesa/ID: ${order.tableIdentifier}`;
  }

  return "Pedido para llevar";
};

const elapsedMinutes = (value) => {
  if (!value) return "Ahora";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return "Ahora";
  return `${minutes} min listo`;
};

export const DispatchOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deliveringId, setDeliveringId] = useState("");

  const loadOrders = async () => {
    try {
      const data = await listDispatchOrders();
      setOrders(data.orders || []);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();
    const interval = setInterval(loadOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleDeliver = async (orderId) => {
    setDeliveringId(orderId);
    setError("");

    try {
      await deliverDispatchOrder(orderId);
      setOrders((currentOrders) => currentOrders.filter((order) => order.id !== orderId));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setDeliveringId("");
    }
  };

  return (
    <section className="dispatch-screen">
      <header className="kitchen-head">
        <div>
          <p className="admin-users-kicker">Despacho</p>
          <h2>Pedidos listos para entregar</h2>
          <p>Solo aparecen pedidos marcados como terminados por cocina.</p>
        </div>
        <button type="button" onClick={loadOrders} disabled={isLoading}>
          {isLoading ? "Actualizando..." : "Actualizar"}
        </button>
      </header>

      {error && <p className="admin-users-error">{error}</p>}

      {orders.length === 0 && !isLoading ? (
        <section className="kitchen-empty">
          <strong>No hay pedidos listos</strong>
          <p>Cuando cocina termine un pedido, aparecera aqui hasta que confirmes la entrega.</p>
        </section>
      ) : (
        <div className="dispatch-list">
          {orders.map((order) => (
            <article className="dispatch-order" key={order.id}>
              <div className="dispatch-main">
                <div>
                  <span>{order.code}</span>
                  <h3>{deliveryLabel(order)}</h3>
                  <p>Terminado por cocina - {elapsedMinutes(order.updatedAt)}</p>
                </div>
                <strong>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</strong>
              </div>

              <div className="dispatch-items">
                {order.items.map((item) => (
                  <span key={item.id}>{item.quantity}x {item.name}</span>
                ))}
              </div>

              <button type="button" disabled={deliveringId === order.id} onClick={() => handleDeliver(order.id)}>
                {deliveringId === order.id ? "Confirmando..." : "Confirmar entrega"}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
