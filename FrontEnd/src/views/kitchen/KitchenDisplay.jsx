import { useEffect, useState } from "react";
import { finishKitchenOrder, getErrorMessage, listKitchenOrders } from "../../lib/auth";

const fulfillmentLabel = (order) => {
  if (order.fulfillmentType === "dine_in") {
    return `Comer aqui - ${order.tableIdentifier}`;
  }

  return "Para llevar";
};

const getMinutesPassed = (value) => {
  if (!value) return 0;
  // If the string lacks a timezone offset, JS assumes local time.
  // By appending 'Z' we force it to parse as UTC, or we handle the string safely.
  const dateStr = value.endsWith('Z') ? value : `${value}Z`;
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  
  // Workaround: Restamos 360 minutos (6 horas) por el desfase de zona horaria
  return Math.max(0, minutes - 360);
};

const elapsedMinutes = (value) => {
  const minutes = getMinutesPassed(value);
  if (minutes < 1) return "Ahora";
  return `${minutes} min`;
};

const getTrafficLightClasses = (minutes) => {
  if (minutes < 2) return "bg-success text-white";
  if (minutes <= 4) return "bg-warning text-dark";
  return "bg-danger text-white";
};

export const KitchenDisplay = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [finishingId, setFinishingId] = useState("");
  const [tick, setTick] = useState(0);

  const loadOrders = async () => {
    try {
      const data = await listKitchenOrders();
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
    const loadInterval = setInterval(loadOrders, 8000);
    const tickInterval = setInterval(() => setTick((t) => t + 1), 30000);
    
    return () => {
      clearInterval(loadInterval);
      clearInterval(tickInterval);
    };
  }, []);

  const handleFinish = async (orderId) => {
    setFinishingId(orderId);
    setError("");

    try {
      await finishKitchenOrder(orderId);
      setOrders((currentOrders) => currentOrders.filter((order) => order.id !== orderId));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setFinishingId("");
    }
  };

  return (
    <section className="kitchen-screen">
      <header className="kitchen-head">
        <div>
          <p className="admin-users-kicker">KDS</p>
          <h2>Pedidos en preparacion</h2>
          <p>Solo aparecen pedidos con cobro validado por caja.</p>
        </div>
        <button type="button" onClick={loadOrders} disabled={isLoading}>
          {isLoading ? "Actualizando..." : "Actualizar"}
        </button>
      </header>

      {error && <p className="admin-users-error">{error}</p>}

      {orders.length === 0 && !isLoading ? (
        <section className="kitchen-empty">
          <strong>No hay pedidos pendientes</strong>
          <p>Cuando caja valide un cobro, el pedido aparecera aqui automaticamente.</p>
        </section>
      ) : (
        <div className="kitchen-grid">
          {orders.map((order) => {
            const minutes = getMinutesPassed(order.createdAt);
            return (
              <article className="kitchen-ticket" key={order.id}>
                <header className={getTrafficLightClasses(minutes)}>
                  <div>
                    <span>{order.code}</span>
                    <strong>{fulfillmentLabel(order)}</strong>
                  </div>
                  <em>{elapsedMinutes(order.createdAt)}</em>
                </header>

                <div className="kitchen-items">
                  {order.items.map((item) => (
                    <div className="kitchen-item" key={item.id}>
                      <b>{item.quantity}x</b>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>

                <footer>
                  <span>En preparacion</span>
                  <button type="button" disabled={finishingId === order.id} onClick={() => handleFinish(order.id)}>
                    {finishingId === order.id ? "Terminando..." : "Marcar terminado"}
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
