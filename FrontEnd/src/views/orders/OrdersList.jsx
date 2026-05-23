import { useEffect, useMemo, useState } from "react";
import { getErrorMessage, listOrders } from "../../lib/auth";

const statusLabels = {
  in_preparation: "En preparacion",
  finished: "Terminada",
  delivered: "Entregada",
  open: "Abierta",
};

const fulfillmentLabels = {
  takeaway: "Para llevar",
  dine_in: "En mesa",
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

export const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const data = await listOrders();
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
  }, []);

  const filteredOrders = useMemo(() => (
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter)
  ), [orders, statusFilter]);

  const statusOptions = useMemo(() => ([
    { value: "all", label: "Todas", count: orders.length },
    { value: "in_preparation", label: "Cocina", count: orders.filter((order) => order.status === "in_preparation").length },
    { value: "finished", label: "Despacho", count: orders.filter((order) => order.status === "finished").length },
    { value: "delivered", label: "Entregadas", count: orders.filter((order) => order.status === "delivered").length },
  ]), [orders]);

  return (
    <section className="orders-page">
      <header className="orders-head">
        <div>
          <p className="admin-users-kicker">Ordenes</p>
          <h2>Historial de pedidos</h2>
          <p>Consulta tickets, estado operativo, modalidad y responsable de caja.</p>
        </div>
        <button type="button" onClick={loadOrders} disabled={isLoading}>
          {isLoading ? "Actualizando..." : "Actualizar"}
        </button>
      </header>

      <nav className="orders-filters" aria-label="Filtrar ordenes por estado">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={statusFilter === option.value ? "is-active" : ""}
            onClick={() => setStatusFilter(option.value)}
          >
            {option.label}
            <span>{option.count}</span>
          </button>
        ))}
      </nav>

      {error && <p className="admin-users-error">{error}</p>}

      <div className="orders-table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Estado</th>
              <th>Modalidad</th>
              <th>Responsable</th>
              <th>Productos</th>
              <th>Total</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{order.code}</strong>
                </td>
                <td>
                  <span className={`orders-status is-${order.status}`}>{statusLabels[order.status] || order.status}</span>
                </td>
                <td>
                  {fulfillmentLabels[order.fulfillmentType] || order.fulfillmentType}
                  {order.tableName || order.tableId ? <small className="d-block text-muted">Mesa: {order.tableName || order.tableId}</small> : null}
                </td>
                <td>{order.cashierName}</td>
                <td>
                  <div className="orders-items">
                    {order.items.map((item) => (
                      <span key={item.id}>{item.quantity}x {item.name}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <b>${order.total}</b>
                </td>
                <td>{formatDate(order.updatedAt || order.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && !isLoading ? (
          <section className="orders-empty">
            <strong>No hay ordenes para mostrar</strong>
            <p>Cuando caja genere tickets, apareceran aqui.</p>
          </section>
        ) : null}
      </div>
    </section>
  );
};
