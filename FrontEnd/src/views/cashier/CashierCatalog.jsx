import { useEffect, useMemo, useState } from "react";
import { createOrder, getErrorMessage, getMenuCatalog, getCatalogStockStatus } from "../../lib/auth"; 
import { listActivePromotions } from "../../lib/promotions";
import { getSalonStatus } from "../../lib/salon";
import { getMyShift } from "../../lib/cash"; 

const toMoney = (value) => Number(value || 0).toFixed(2);

export const CashierCatalog = () => {
  const [catalog, setCatalog] = useState({ products: [], combos: [] });
  const [activePromotions, setActivePromotions] = useState([]);
  const [salonZones, setSalonZones] = useState([]);
  
  const [hasOpenShift, setHasOpenShift] = useState(true); 
  const [stockStatus, setStockStatus] = useState({ productsStock: {}, combosStock: {} }); 
  const [cart, setCart] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState("");
  const [tableId, setTableId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [prevCart, setPrevCart] = useState([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [catalogData, promosData, salonData, shiftData, stockData] = await Promise.all([
          getMenuCatalog(),
          listActivePromotions(),
          getSalonStatus(),
          getMyShift(),
          getCatalogStockStatus() 
        ]);

        setCatalog(catalogData);
        setActivePromotions(promosData.promotions || []);
        setSalonZones(salonData.salon || []);
        setHasOpenShift(shiftData.hasOpenShift);
        setStockStatus(stockData.data || { productsStock: {}, combosStock: {} }); // <-- GUARDAMOS EL MAPA
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const addToCart = (item, itemType) => {
    setTicket(null);
    setCart((currentCart) => {
      const existingItem = currentCart.find((cartItem) => cartItem.itemId === item.id && cartItem.itemType === itemType);
      if (existingItem) {
        return currentCart.map((cartItem) => cartItem.cartId === existingItem.cartId ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem);
      }
      return [...currentCart, { cartId: `${itemType}-${item.id}`, itemId: item.id, itemType, categoryId: item.categoryId || null, name: item.name, price: Number(item.price), quantity: 1 }];
    });
  };

  const updateQuantity = (cartId, quantity) => {
    const nextQuantity = Number(quantity);
    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) return;
    setCart((currentCart) => currentCart.map((item) => item.cartId === cartId ? { ...item, quantity: nextQuantity } : item));
  };

  const removeItem = (cartId) => {
    setCart((currentCart) => currentCart.filter((item) => item.cartId !== cartId));
  };

  function promoAppliesToCart(promotion, cartItems) {
    return cartItems.some((item) => (
      promotion.targets?.some((target) => (
        target.targetType === "all" || (target.targetType === "product" && target.targetId === item.itemId) || (target.targetType === "category" && target.targetId === item.categoryId)
      ))
    ));
  }

  if (cart !== prevCart) {
    setPrevCart(cart);
    if (appliedPromo && !promoAppliesToCart(appliedPromo, cart)) {
      setAppliedPromo(null);
      setPromoError("La promoción se quitó porque ya no aplica al carrito.");
    }
  }

  const { subtotal, discount, total } = useMemo(() => {
    const target = appliedPromo?.targets?.[0];
    const targetType = target?.targetType;
    const targetId = target?.targetId;

    const matchesTarget = (item) => {
      if (!appliedPromo) return false;
      if (!targetType || targetType === "all") return true;
      if (targetType === "product") return targetId === item.itemId;
      if (targetType === "category") return targetId === item.categoryId;
      return false;
    };

    let sub = 0;
    let eligibleSub = 0;

    cart.forEach((item) => {
      const lineSubtotal = item.price * item.quantity;
      sub += lineSubtotal;
      if (matchesTarget(item)) {
        eligibleSub += lineSubtotal;
      }
    });

    let disc = 0;
    if (appliedPromo && eligibleSub > 0) {
      if (appliedPromo.discountType === "percentage") {
        disc = eligibleSub * (Number(appliedPromo.discountValue) / 100);
      } else if (appliedPromo.discountType === "fixed_amount") {
        disc = Math.min(Number(appliedPromo.discountValue), eligibleSub);
      }
    }
    return { subtotal: sub, discount: disc, total: sub - disc };
  }, [cart, appliedPromo]);

  const handlePreCheckout = () => {
    setError("");
    if (!hasOpenShift) {
      setError("Necesitas declarar el dinero inicial y abrir tu turno de caja antes de generar pedidos.");
      return;
    }
    if (!fulfillmentType) {
      setError("Debes elegir si el pedido es para llevar o para consumir en el lugar.");
      return;
    }
    if (fulfillmentType === "dine_in" && !tableId) {
      setError("Debes seleccionar una mesa antes de enviar el pedido.");
      return;
    }
    if (!customerName.trim()) {
      setError("Debes ingresar el nombre del cliente antes de enviar el pedido.");
      return;
    }
    handleCreateOrder();
  };

  const handleCreateOrder = async () => {
    setIsSaving(true);
    setError("");

    try {
      const orderPayload = {
        fulfillmentType,
        customerName: customerName.trim(),
        paymentMethod,
        promoCode: appliedPromo?.code || undefined,
        items: cart.map((item) => ({ itemType: item.itemType, itemId: item.itemId, quantity: item.quantity })),
      };

      if (fulfillmentType === "dine_in") { orderPayload.tableId = tableId; }

      const result = await createOrder(orderPayload);
      setTicket(result.ticket);
      setCart([]);
      setFulfillmentType("");
      setTableId("");
      setCustomerName("");
      setPaymentMethod("cash");
      setAppliedPromo(null);
      setPromoError("");
      
      const stockData = await getCatalogStockStatus();
      setStockStatus(stockData.data || { productsStock: {}, combosStock: {} });
      
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const getTableName = (tId) => {
    for (const zone of salonZones) {
      const table = zone.tables?.find((t) => t.id === tId);
      if (table) return `${zone.name} - ${table.identifier}`;
    }
    return "Mesa no identificada";
  };

  return (
    <section className="cashier-workspace">
      <div style={{ gridColumn: "1 / -1" }}>
        <header className="cashier-header">
          <div>
            <p className="admin-users-kicker">Caja</p>
            <h2>Nuevo pedido</h2>
            <p>Agrega productos o combos, aplica una promocion y genera el ticket antes del pago.</p>
          </div>
          {isLoading && <span className="inventory-pill is-ok">Cargando catálogo...</span>}
        </header>
        {error && <p className="admin-users-error mb-2">{error}</p>}
        
        {!isLoading && !hasOpenShift && (
          <div className="admin-users-error" style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #f87171", fontWeight: "bold" }}>
             CAJA CERRADA: No puedes emitir tickets. Por favor, abre tu turno de caja primero.
          </div>
        )}
      </div>

      <main className="cashier-catalog" style={{ opacity: hasOpenShift ? 1 : 0.5, pointerEvents: hasOpenShift ? "auto" : "none" }}>
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3>Productos</h3>
              <p className="cashier-empty-cart">Toca un producto para enviarlo al carrito.</p>
            </div>
            <span className="inventory-pill is-ok">{catalog.products.length} disponibles</span>
          </div>
          <div className="cashier-item-grid">
            {catalog.products.map((product) => {
              // Verificamos si el producto tiene stock. Si no está en el mapa, es porque no tiene receta (infinito).
              const isAvailable = stockStatus.productsStock[product.id] !== false;

              return (
                <button 
                  className="cashier-sale-item" 
                  type="button" 
                  key={product.id} 
                  onClick={() => addToCart(product, "product")}
                  disabled={!isAvailable}
                  style={{ opacity: isAvailable ? 1 : 0.4, cursor: isAvailable ? "pointer" : "not-allowed", position: "relative" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <strong>{product.name}</strong><b>${toMoney(product.price)}</b>
                  </div>
                  <span>{product.categoryName}</span>
                  <p>{product.description}</p>
                  
                  {!isAvailable && (
                    <div style={{ position: "absolute", bottom: "10px", right: "10px", background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>
                      Agotado
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", marginTop: "16px" }}>
            <div>
              <h3>Combos</h3>
              <p className="cashier-empty-cart">Incluye combos listos para la venta.</p>
            </div>
            <span className="inventory-pill is-ok">{catalog.combos.length} disponibles</span>
          </div>
          <div className="cashier-item-grid">
            {catalog.combos.map((combo) => {
              // Verificamos si el combo tiene stock
              const isAvailable = stockStatus.combosStock[combo.id] !== false;

              return (
                <button 
                  className="cashier-sale-item" 
                  type="button" 
                  key={combo.id} 
                  onClick={() => addToCart(combo, "combo")}
                  disabled={!isAvailable}
                  style={{ opacity: isAvailable ? 1 : 0.4, cursor: isAvailable ? "pointer" : "not-allowed", position: "relative" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <strong>{combo.name}</strong><b>${toMoney(combo.price)}</b>
                  </div>
                  <span>Combo</span>
                  <p style={{ marginBottom: "4px" }}>{combo.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ")}</p>
                  
                  {!isAvailable && (
                    <div style={{ position: "absolute", bottom: "10px", right: "10px", background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>
                      Agotado
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </main>

      <aside className="cashier-cart">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p className="admin-users-kicker">Carrito editable</p>
            <h3>Pedido actual</h3>
          </div>
          <span className="inventory-pill is-ok">{cart.length} items</span>
        </div>

        {cart.length === 0 ? (
          <p className="cashier-empty-cart">Agrega productos o combos para iniciar el pedido.</p>
        ) : (
          <div className="cashier-cart-list">
            {cart.map((item) => (
              <div className="cashier-cart-row" key={item.cartId}>
                <div>
                  <strong>{item.name}</strong>
                  <span>${toMoney(item.price)} · {item.itemType === "combo" ? "Combo" : "Producto"}</span>
                </div>
                <input type="number" min="1" value={item.quantity} onChange={(event) => updateQuantity(item.cartId, event.target.value)} />
                <button type="button" onClick={() => removeItem(item.cartId)}>Quitar</button>
              </div>
            ))}
          </div>
        )}

        <div className="cashier-fulfillment">
          <div style={{ marginBottom: "8px" }}>
            <p className="admin-users-kicker">Modalidad</p>
            <h4>Entrega del pedido</h4>
          </div>
          <div className="cashier-mode-toggle">
            <button type="button" className={fulfillmentType === "takeaway" ? "is-active" : ""} onClick={() => { setFulfillmentType("takeaway"); setTableId(""); }}>Para llevar</button>
            <button type="button" className={fulfillmentType === "dine_in" ? "is-active" : ""} onClick={() => setFulfillmentType("dine_in")}>Consumir aquí</button>
          </div>

          <label className="cashier-table-field" style={{ marginTop: "8px" }}>
            <span>Nombre del cliente</span>
            <input
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Ej: Juan Perez"
              maxLength={100}
              style={{ width: "100%", padding: "11px 12px", borderRadius: "12px", border: "1px solid rgba(45,24,16,.08)", background: "#fff" }}
            />
          </label>

          {fulfillmentType === "dine_in" && (
            <label className="cashier-table-field" style={{ marginTop: "8px" }}>
              <span>Asignar Mesa</span>
              <select value={tableId} onChange={(event) => setTableId(event.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: "12px", border: "1px solid rgba(45,24,16,.08)", background: "#fff" }}>
                <option value="">-- Selecciona una mesa --</option>
                {salonZones.map((zone) => (
                  <optgroup key={zone.id} label={zone.name}>
                    {zone.tables.map((table) => (
                      <option key={table.id} value={table.id} disabled={table.status === "inactive"}>{table.identifier} {table.status === "occupied" ? "(Ocupada)" : `(${table.capacity} pax)`}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          )}

          {cart.length > 0 && (
            <div className="cashier-table-field" style={{ marginTop: "16px" }}>
              <span>Aplicar promoción</span>
              <select value={appliedPromo?.code || ""} onChange={(event) => { setPromoError(""); const promo = activePromotions.find(p => p.code === event.target.value); setAppliedPromo(promo || null); }} style={{ width: "100%", padding: "11px 12px", borderRadius: "12px", border: "1px solid rgba(45,24,16,.08)", background: "#fff" }}>
                <option value="">-- No aplicar ninguna --</option>
                {activePromotions.map((promo) => {
                  const applies = promoAppliesToCart(promo, cart);
                  return <option key={promo.id} value={promo.code} disabled={!applies}>{promo.name} - {promo.discountType === "percentage" ? `${promo.discountValue}%` : `$${promo.discountValue}`} {applies ? "" : "(No aplica)"}</option>
                })}
              </select>
            </div>
          )}

          <div className="cashier-table-field" style={{ marginTop: "16px" }}>
            <span>Método de pago</span>
            <div className="cashier-mode-toggle" role="radiogroup" aria-label="Método de pago">
              <button type="button" className={paymentMethod === "cash" ? "is-active" : ""} onClick={() => setPaymentMethod("cash")}>Efectivo</button>
              <button type="button" className={paymentMethod === "transfer" ? "is-active" : ""} onClick={() => setPaymentMethod("transfer")}>Transferencia</button>
              <button type="button" className={paymentMethod === "card" ? "is-active" : ""} onClick={() => setPaymentMethod("card")}>Tarjeta</button>
            </div>
          </div>
        </div>

        <div className="cashier-total">
          <span>Subtotal</span><strong>${toMoney(subtotal)}</strong>
        </div>
        {discount > 0 && (
          <div className="cashier-total" style={{ paddingTop: 0 }}>
            <span>Descuento</span><strong style={{ color: "oklch(0.45 0.14 145)" }}>-${toMoney(discount)}</strong>
          </div>
        )}
        <div className="cashier-total" style={{ borderTop: "1px solid rgba(45,24,16,.06)", marginTop: "8px", paddingTop: "12px" }}>
          <span>Total</span><strong>${toMoney(total)}</strong>
        </div>

        <button className="cashier-checkout" type="button" disabled={cart.length === 0 || isSaving || !hasOpenShift} onClick={handlePreCheckout}>
          {!hasOpenShift ? "Caja Cerrada" : isSaving ? "Procesando..." : "Cobrar pedido"}
        </button>
      </aside>

      {ticket && (
        <div className="users-modal-backdrop" onClick={() => setTicket(null)}>
          <div className="ticket-preview" onClick={(e) => e.stopPropagation()}>
            <div className="ticket-head">
              <span>Ticket generado</span>
              <strong>{ticket.code}</strong>
              <em>Cliente: {ticket.customerName || "Cliente"}</em>
              <em>{ticket.fulfillmentType === "dine_in" ? `Consumir en el lugar - ${getTableName(ticket.tableId)}` : "Para llevar"}</em>
              <small>{new Date(ticket.createdAt).toLocaleString()}</small>
            </div>
            <div className="ticket-lines" style={{ borderTop: "1px dashed #d8c8be", paddingTop: "10px" }}>
              {ticket.items?.map((item, index) => (
                <div key={`${item.type}-${index}`} className="ticket-line" style={{ alignItems: "flex-start", gap: "10px", marginBottom: "6px" }}>
                  <span style={{ flex: 1 }}>
                    {item.quantity} x {item.name}
                    <small style={{ display: "block", color: "#8c6b5e" }}>
                      {item.type === "combo" ? "Combo" : "Producto"} · ${toMoney(item.unitPrice)} c/u
                    </small>
                  </span>
                  <strong>${toMoney(item.lineTotal)}</strong>
                </div>
              ))}
              <div className="ticket-line"><span>SUBTOTAL</span><strong>${toMoney(ticket.subtotal)}</strong></div>
              {Number(ticket.discountTotal || 0) > 0 && (
                <div className="ticket-line"><span>DESCUENTO</span><strong>-${toMoney(ticket.discountTotal)}</strong></div>
              )}
              <div className="ticket-line"><span>TOTAL</span><strong>${toMoney(ticket.total)}</strong></div>
            </div>
            {ticket.promotionApplied ? <p className="mt-3 text-center text-primary fw-bold">Promoción aplicada: {ticket.promotionApplied}</p> : null}
            <p className="mt-3 text-center text-success fw-bold">Cobrado vía: {ticket.paymentMethod === 'cash' ? 'Efectivo' : ticket.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}</p>
            <button type="button" style={{ width: "100%", height: "36px", borderRadius: "8px", background: "var(--color-text)", color: "#fff", border: "none", fontWeight: "bold", cursor: "pointer", marginTop: "12px" }} onClick={() => setTicket(null)}>
              Cerrar Ticket
            </button>
          </div>
        </div>
      )}
    </section>
  );
};