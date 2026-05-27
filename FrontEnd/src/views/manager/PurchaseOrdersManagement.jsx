import { useEffect, useMemo, useState } from "react";
import {
  listPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
} from "../../lib/purchases";
import { listSuppliers } from "../../lib/suppliers";
import { getErrorMessage } from "../../lib/auth";

const emptyOrderItem = { ingredientId: "", quantity: "", unitPrice: "" };

const toMoney = (value) => Number(value || 0).toFixed(2);

export const PurchaseOrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  const [showCreate, setShowCreate] = useState(false);
  const [orderForm, setOrderForm] = useState({ supplierId: "", items: [{ ...emptyOrderItem }] });

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ordersData, suppData] = await Promise.all([
        listPurchaseOrders(),
        listSuppliers()
      ]);
      setOrders(ordersData.orders || []);
      // Solo queremos proveedores activos para nuevas compras
      setSuppliers((suppData.suppliers || []).filter(s => s.isActive));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clearMessages = () => {
    setStatus("");
    setError("");
  };

  const selectedSupplier = useMemo(() => {
    return suppliers.find(s => s.id === orderForm.supplierId) || null;
  }, [orderForm.supplierId, suppliers]);

  // ==========================================
  // CREACIÓN DE ORDEN
  // ==========================================

  const addOrderItem = () => {
    setOrderForm(form => ({ ...form, items: [...form.items, { ...emptyOrderItem }] }));
  };

  const removeOrderItem = (index) => {
    setOrderForm(form => ({
      ...form,
      items: form.items.length === 1 ? [{ ...emptyOrderItem }] : form.items.filter((_, i) => i !== index)
    }));
  };

  const updateOrderItem = (index, field, value) => {
    setOrderForm(form => {
      const newItems = [...form.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Si cambia el insumo, intentamos autocompletar el precio con el de referencia del catálogo
      if (field === "ingredientId" && selectedSupplier) {
        const catalogRef = selectedSupplier.catalog.find(c => c.ingredientId === value);
        if (catalogRef && catalogRef.priceReference) {
          newItems[index].unitPrice = catalogRef.priceReference;
        }
      }
      return { ...form, items: newItems };
    });
  };

  const orderTotal = useMemo(() => {
    return orderForm.items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);
  }, [orderForm.items]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    clearMessages();
    
    // Filtrar ítems válidos
    const validItems = orderForm.items.filter(item => item.ingredientId && Number(item.quantity) > 0 && item.unitPrice !== "");

    if (validItems.length === 0) {
      setError("Debes agregar al menos un insumo válido con cantidad mayor a 0 y un precio.");
      return;
    }

    setIsSaving(true);
    try {
      await createPurchaseOrder({ supplierId: orderForm.supplierId, items: validItems });
      setStatus("Orden de compra generada. Está pendiente de recepción.");
      setOrderForm({ supplierId: "", items: [{ ...emptyOrderItem }] });
      setShowCreate(false);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // RECEPCIÓN Y CANCELACIÓN
  // ==========================================

  const handleReceiveOrder = async (orderId) => {
    if (!window.confirm("¿Confirmas que el camión llegó y el producto está en bodega? Esto aumentará tu inventario automáticamente.")) return;
    clearMessages();
    try {
      await receivePurchaseOrder(orderId);
      setStatus("¡Orden recibida! El inventario ha sido actualizado.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("¿Seguro que deseas cancelar esta orden de compra?")) return;
    clearMessages();
    try {
      await cancelPurchaseOrder(orderId);
      setStatus("Orden cancelada correctamente.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <section className="menu-catalog-page">
      <header className="menu-catalog-head">
        <div>
          <p className="admin-users-kicker">Abastecimiento</p>
          <h2>Órdenes de Compra</h2>
          <p>Genera pedidos a tus proveedores y recibe la mercancía para actualizar tu inventario.</p>
        </div>
        <button type="button" onClick={loadData} disabled={isLoading} className="btn btn-outline-secondary">
          {isLoading ? "Actualizando..." : "Actualizar"}
        </button>
      </header>

      {status && <div className="admin-users-success mb-3">{status}</div>}
      {error && <div className="admin-users-error mb-3">{error}</div>}

      <div className="menu-catalog-toolbar">
        <p>{orders.length} órdenes en el historial</p>
        <button type="button" className="menu-catalog-action" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Ver Historial" : "+ Nueva Compra"}
        </button>
      </div>

      {showCreate ? (
        <form className="menu-create-panel" onSubmit={handleCreateOrder}>
          <div className="is-wide mb-3">
            <h3 className="h5 mb-1">Armar Pedido</h3>
            <p className="text-muted small">Selecciona un proveedor para ver los insumos que le compras regularmente.</p>
          </div>

          <label className="is-wide">
            <span>Proveedor</span>
            <select 
              value={orderForm.supplierId} 
              onChange={e => setOrderForm({ supplierId: e.target.value, items: [{ ...emptyOrderItem }] })} 
              required
            >
              <option value="">-- Seleccionar --</option>
              {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
            </select>
          </label>

          {selectedSupplier && (
            <div className="is-wide menu-combo-items mt-3">
              <div className="menu-combo-items-head">
                <span>Insumos a comprar</span>
                <button type="button" onClick={addOrderItem}>+ Agregar fila</button>
              </div>

              {selectedSupplier.catalog.length === 0 ? (
                <div className="alert alert-warning small p-2 mb-3">
                  Este proveedor no tiene insumos mapeados en su catálogo. Ve a la pestaña "Proveedores" para asignarle productos primero.
                </div>
              ) : (
                orderForm.items.map((item, index) => (
                  <div key={index} className="d-flex flex-wrap gap-2 mb-2 p-2 border rounded align-items-center">
                    <div style={{ flex: "1 1 200px" }}>
                      <span className="small text-muted d-block">Insumo</span>
                      <select 
                        value={item.ingredientId} 
                        onChange={(e) => {
                          const selectedVal = e.target.value;
                          // read price from selected option's data-price attribute
                          const price = e.target.options[e.target.selectedIndex]?.dataset?.price;
                          updateOrderItem(index, "ingredientId", selectedVal);
                          if (price !== undefined && price !== null && price !== "") {
                            updateOrderItem(index, "unitPrice", price);
                          }
                        }}
                        className="w-100 p-2 border rounded"
                        required
                      >
                        <option value="">Seleccionar insumo...</option>
                        {selectedSupplier.catalog.map(cat => (
                          <option key={cat.ingredientId} value={cat.ingredientId} data-price={cat.priceReference}>
                            {cat.ingredientName} ({cat.unitOfMeasure})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ width: "100px" }}>
                      <span className="small text-muted d-block">Cantidad</span>
                      <input 
                        type="number" step="0.01" min="0.01" 
                        value={item.quantity} 
                        onChange={(e) => updateOrderItem(index, "quantity", e.target.value)}
                        className="w-100 p-2 border rounded"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div style={{ width: "120px" }}>
                      <span className="small text-muted d-block">Costo Unit. $</span>
                      <input 
                        type="number" step="0.01" min="0" 
                        value={item.unitPrice} 
                        onChange={(e) => updateOrderItem(index, "unitPrice", e.target.value)}
                        className="w-100 p-2 border rounded"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div style={{ width: "100px", textAlign: "right", fontWeight: "bold" }}>
                      <span className="small text-muted d-block">Subtotal</span>
                      ${toMoney(Number(item.quantity || 0) * Number(item.unitPrice || 0))}
                    </div>

                    <div className="mt-4 ms-2">
                      <button type="button" onClick={() => removeOrderItem(index)} className="btn btn-sm btn-outline-danger px-2 py-1">X</button>
                    </div>
                  </div>
                ))
              )}

              <div className="d-flex justify-content-end mt-3 mb-2">
                <h4 className="h5 mb-0">Total Estimado: <span className="text-success">${toMoney(orderTotal)}</span></h4>
              </div>
            </div>
          )}

          <div className="is-wide d-flex gap-2 mt-4">
            <button type="submit" disabled={isSaving || !selectedSupplier || selectedSupplier.catalog.length === 0} className="flex-grow-1">
              {isSaving ? "Enviando..." : "Crear Orden de Compra"}
            </button>
            <button type="button" className="is-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
          </div>
        </form>
      ) : (
        <section className="inventory-table-card mt-3">
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Fecha / ID</th>
                  <th>Proveedor</th>
                  <th>Detalle (Insumos)</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan="6" className="text-center text-muted p-4">No hay historial de compras.</td></tr>
                ) : (
                  orders.map(order => {
                    const totalOrder = order.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
                    
                    let statusPill = "inventory-pill is-empty"; // pending
                    let statusLabel = "Pendiente";
                    if (order.status === "received") {
                      statusPill = "inventory-pill is-ok";
                      statusLabel = "Recibida";
                    } else if (order.status === "cancelled") {
                      statusPill = "inventory-pill bg-secondary text-white";
                      statusLabel = "Cancelada";
                    }

                    return (
                      <tr key={order.id}>
                        <td>
                          <div className="d-flex flex-column">
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            <small className="text-muted">{order.id.slice(0, 8).toUpperCase()}</small>
                          </div>
                        </td>
                        <td className="fw-bold">{order.supplierName}</td>
                        <td className="small">
                          {order.items.slice(0, 2).map(i => (
                            <div key={i.id}>{i.quantity} {i.unitOfMeasure} x {i.ingredientName}</div>
                          ))}
                          {order.items.length > 2 && <div className="text-muted">+ {order.items.length - 2} más...</div>}
                        </td>
                        <td className="fw-bold text-success">${toMoney(totalOrder)}</td>
                        <td>
                          <span className={statusPill}>{statusLabel}</span>
                        </td>
                        <td>
                          {order.status === "pending" && (
                            <div className="d-flex flex-column gap-1">
                              <button type="button" className="btn btn-sm btn-primary py-1 px-2 mb-1" onClick={() => handleReceiveOrder(order.id)}>
                                ✔️ Recibir
                              </button>
                              <button type="button" className="btn btn-sm btn-outline-danger py-1 px-2" onClick={() => handleCancelOrder(order.id)}>
                                ❌ Cancelar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
};