import { useEffect, useState } from "react";
import { getTenantOrders, getErrorMessage } from "../../lib/auth"; // Ajusta la ruta si es necesario

const toMoney = (value) => Number(value || 0).toFixed(2);

export const CashierOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const res = await getTenantOrders();
      setOrders(res.orders || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "in_preparation":
        return <span className="inventory-pill" style={{ background: "#fef08a", color: "#854d0e" }}>En Cocina</span>;
      case "finished":
        return <span className="inventory-pill is-ok">Listo / Para Entregar</span>;
      case "delivered":
        return <span className="inventory-pill" style={{ background: "#e2e8f0", color: "#475569" }}>Entregado</span>;
      case "cancelled":
        return <span className="inventory-pill" style={{ background: "#fee2e2", color: "#b91c1c" }}>Cancelado</span>;
      default:
        return <span className="inventory-pill">{status}</span>;
    }
  };

  const handleEdit = (orderCode) => {
    // Aquí conectaremos la Fase 5
    alert(`Próximamente: Editar orden ${orderCode}`);
  };

  const handleCancel = (orderCode) => {
    // Aquí conectaremos la Fase 4
    if (window.confirm(`¿Estás seguro que deseas CANCELAR la orden ${orderCode}? Se devolverá el dinero y el inventario.`)) {
      alert(`Próximamente: Cancelación en backend para ${orderCode}`);
    }
  };

  return (
    <section className="menu-catalog-page">
      <header className="menu-catalog-head">
        <div>
          <h2>Gestión de Órdenes</h2>
          <p>Revisa el historial de tickets generados, edita pedidos o registra cancelaciones.</p>
        </div>
        <button type="button" className="is-secondary" onClick={loadOrders}>
          Actualizar Lista
        </button>
      </header>

      {error && <p className="admin-users-error mt-2">{error}</p>}

      {isLoading ? (
        <p className="menu-loading">Cargando órdenes...</p>
      ) : orders.length === 0 ? (
        <p className="text-center text-muted p-4">No hay órdenes registradas aún.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px", marginTop: "24px" }}>
          {orders.map((order) => (
            <div key={order.id} className="ticket-preview" style={{ padding: "16px", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fff", cursor: "default" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "16px", margin: "0 0 4px 0" }}>{order.code}</h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Cliente: {order.customerName || "No registrado"}</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div style={{ marginBottom: "16px", fontSize: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "#64748b" }}>Modalidad:</span>
                  <strong>{order.fulfillmentType === "dine_in" ? `Local (${order.tableName || "Mesa"})` : "Para llevar"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "#64748b" }}>Pago vía:</span>
                  <strong style={{ textTransform: "capitalize" }}>{order.paymentMethod === "card" ? "Tarjeta" : order.paymentMethod === "transfer" ? "Transferencia" : "Efectivo"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #e2e8f0", fontSize: "16px" }}>
                  <span>Total:</span>
                  <strong>${toMoney(order.total)}</strong>
                </div>
              </div>

              {/* Botones de Acción (Solo si no está cancelada) */}
              {order.status !== "cancelled" && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    type="button" 
                    style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: "bold", color: "#334155" }}
                    onClick={() => handleEdit(order.code)}
                  >
                    Editar
                  </button>
                  <button 
                    type="button" 
                    style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: "#fee2e2", color: "#b91c1c", cursor: "pointer", fontWeight: "bold" }}
                    onClick={() => handleCancel(order.code)}
                  >
                    Cancelar
                  </button>
                </div>
              )}
              
            </div>
          ))}
        </div>
      )}
    </section>
  );
};