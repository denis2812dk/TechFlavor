import { useEffect, useState } from "react";
import { deliverDispatchOrder, getErrorMessage, listDispatchOrders } from "../../lib/auth";

const deliveryLabel = (order) => {
  if (order.fulfillmentType === "dine_in") {
    return `Comer aquí - Mesa: ${order.tableName || order.tableId || "Sin asignar"}`;
  }

  return "Pedido para llevar";
};

const elapsedMinutes = (value, referenceTime) => {
  if (!value) return "Recién listo";
  const dateValue = new Date(value).getTime();
  if (isNaN(dateValue)) return "Recién listo";
  
  const refTime = referenceTime ? new Date(referenceTime).getTime() : Date.now();
  const diff = Math.max(0, refTime - dateValue);
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return "Menos de 1 min listo";
  return `${minutes} min listo`;
};

export const DispatchOrders = () => {
  const [orders, setOrders] = useState([]);
  const [serverTime, setServerTime] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deliveringId, setDeliveringId] = useState("");

  const loadOrders = async () => {
    try {
      const data = await listDispatchOrders();
      setOrders(data.orders || []);
      setServerTime(data.serverTime);
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
                  <p>Cliente: {order.customerName || "Cliente"}</p>
                  <p>Terminado por cocina - {elapsedMinutes(order.updatedAt, serverTime)}</p>
                </div>
                <strong>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</strong>
              </div>

              <div className="dispatch-items">
                {order.items.map((item) => (
                  <span key={item.id} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    {(item.imageBase64 || item.categoryImageBase64) && (
                      <span style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", background: "#f8fafc", flexShrink: 0 }}>
                        <img src={item.imageBase64 || item.categoryImageBase64} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </span>
                    )}
                    <span>{item.quantity}x {item.name}</span>
                  </span>
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
