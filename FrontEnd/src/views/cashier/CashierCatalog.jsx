import { useEffect, useMemo, useState } from "react";
import { createOrder, getErrorMessage, getMenuCatalog } from "../../lib/auth";
import { listActivePromotions } from "../../lib/promotions"; 

const toMoney = (value) => Number(value || 0).toFixed(2);

export const CashierCatalog = () => {
  const [catalog, setCatalog] = useState({ products: [], combos: [] });
  const [activePromotions, setActivePromotions] = useState([]); 
  const [cart, setCart] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [fulfillmentType, setFulfillmentType] = useState("");
  const [tableIdentifier, setTableIdentifier] = useState("");
  const [selectedPromotionId, setSelectedPromotionId] = useState(""); 

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [catalogData, promosData] = await Promise.all([
          getMenuCatalog(),
          listActivePromotions()
        ]);
        setCatalog(catalogData);
        setActivePromotions(promosData.promotions || []);
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
        return currentCart.map((cartItem) => (
          cartItem.cartId === existingItem.cartId
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        ));
      }

      return [
        ...currentCart,
        {
          cartId: `${itemType}-${item.id}`,
          itemId: item.id,
          itemType,
          categoryId: item.categoryId || null, 
          name: item.name,
          price: Number(item.price),
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (cartId, quantity) => {
    const nextQuantity = Number(quantity);
    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) return;

    setCart((currentCart) => currentCart.map((item) => (
      item.cartId === cartId ? { ...item, quantity: nextQuantity } : item
    )));
  };

  const removeItem = (cartId) => {
    setCart((currentCart) => currentCart.filter((item) => item.cartId !== cartId));
  };

  const { subtotal, discount, total } = useMemo(() => {
    let sub = 0;
    let disc = 0;
    
    const activePromo = activePromotions.find(p => p.id === selectedPromotionId);

    cart.forEach((item) => {
      const lineSubtotal = item.price * item.quantity;
      let lineDiscount = 0;

      if (activePromo) {
        const applies = activePromo.targets.some(target => 
          target.targetType === 'all' || 
          (target.targetType === 'product' && target.targetId === item.itemId) ||
          (target.targetType === 'category' && target.targetId === item.categoryId)
        );

        if (applies) {
          if (activePromo.discountType === 'percentage') {
            lineDiscount = lineSubtotal * (Number(activePromo.discountValue) / 100);
          } else if (activePromo.discountType === 'fixed_amount') {
            lineDiscount = Number(activePromo.discountValue) * item.quantity;
          }
        }
      }

      if (lineDiscount > lineSubtotal) lineDiscount = lineSubtotal; 

      sub += lineSubtotal;
      disc += lineDiscount;
    });

    return { subtotal: sub, discount: disc, total: sub - disc };
  }, [cart, activePromotions, selectedPromotionId]);

  const handleCreateOrder = async () => {
    setError("");
    setTicket(null);

    if (!fulfillmentType) {
      setError("Debes elegir si el pedido es para llevar o para consumir en el lugar.");
      return;
    }

    if (fulfillmentType === "dine_in" && !tableIdentifier.trim()) {
      setError("Debes ingresar el numero de mesa o identificador antes de cerrar el pedido.");
      return;
    }

    setIsSaving(true);

    try {
      const orderPayload = {
        fulfillmentType,
        promotionId: selectedPromotionId || undefined, // Mandamos la promo al backend
        items: cart.map((item) => ({
          itemType: item.itemType,
          itemId: item.itemId,
          quantity: item.quantity,
        })),
      };

      if (fulfillmentType === "dine_in") {
        orderPayload.tableIdentifier = tableIdentifier.trim();
      }

      const result = await createOrder(orderPayload);
      setTicket(result.ticket);
      setCart([]);
      setFulfillmentType("");
      setTableIdentifier("");
      setSelectedPromotionId("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="cashier-workspace">
      <main className="cashier-catalog">
        <div className="cashier-header">
          <div>
            <p className="admin-users-kicker">Caja</p>
            <h2>Nuevo pedido</h2>
            <p>Agrega productos o combos, edita el carrito y genera ticket antes del pago.</p>
          </div>
          {isLoading && <span>Cargando catalogo...</span>}
        </div>

        {error && <p className="admin-users-error">{error}</p>}

        <section>
          <h3>Productos</h3>
          <div className="cashier-item-grid">
            {catalog.products.map((product) => (
              <button className="cashier-sale-item" type="button" key={product.id} onClick={() => addToCart(product, "product")}>
                <strong>{product.name}</strong>
                <span>{product.categoryName}</span>
                <p>{product.description}</p>
                <b>${product.price}</b>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>Combos</h3>
          <div className="cashier-item-grid">
            {catalog.combos.map((combo) => (
              <button className="cashier-sale-item" type="button" key={combo.id} onClick={() => addToCart(combo, "combo")}>
                <strong>{combo.name}</strong>
                <span>{combo.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ")}</span>
                <p>{combo.description}</p>
                <b>${combo.price}</b>
              </button>
            ))}
          </div>
        </section>
      </main>

      <aside className="cashier-cart">
        <div>
          <p className="admin-users-kicker">Carrito editable</p>
          <h3>Pedido actual</h3>
        </div>

        {cart.length === 0 ? (
          <p className="cashier-empty-cart">Agrega productos o combos para iniciar el pedido.</p>
        ) : (
          <div className="cashier-cart-list">
            {cart.map((item) => (
              <article className="cashier-cart-row" key={item.cartId}>
                <div>
                  <strong>{item.name}</strong>
                  <span>${toMoney(item.price)} · {item.itemType === "combo" ? "Combo" : "Producto"}</span>
                </div>
                <input type="number" min="1" value={item.quantity} onChange={(event) => updateQuantity(item.cartId, event.target.value)} />
                <button type="button" onClick={() => removeItem(item.cartId)}>Eliminar</button>
              </article>
            ))}
          </div>
        )}

        <section className="cashier-fulfillment" aria-label="Modalidad del pedido">
          <div>
            <p className="admin-users-kicker">Modalidad</p>
            <h4>Entrega del pedido</h4>
          </div>

          <div className="cashier-mode-toggle">
            <button
              type="button"
              className={fulfillmentType === "takeaway" ? "is-active" : ""}
              onClick={() => {
                setFulfillmentType("takeaway");
                setTableIdentifier("");
              }}
            >
              Para llevar
            </button>
            <button
              type="button"
              className={fulfillmentType === "dine_in" ? "is-active" : ""}
              onClick={() => setFulfillmentType("dine_in")}
            >
              Consumir aqui
            </button>
          </div>

          {fulfillmentType === "dine_in" && (
            <label className="cashier-table-field">
              <span>Mesa o identificador</span>
              <input
                value={tableIdentifier}
                onChange={(event) => setTableIdentifier(event.target.value)}
                placeholder="Ej. Mesa 8, Cliente 42, A17"
              />
            </label>
          )}

          {/*  SECCIÓN DE PROMOCIONES */}
          {activePromotions.length > 0 && cart.length > 0 && (
            <label className="cashier-table-field" style={{ marginTop: '1rem' }}>
              <span>Aplicar Promoción</span>
              <select 
                value={selectedPromotionId} 
                onChange={(e) => setSelectedPromotionId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">Sin promoción</option>
                {activePromotions.map(promo => (
                  <option key={promo.id} value={promo.id}>
                    {promo.name} ({promo.discountType === 'percentage' ? `-${promo.discountValue}%` : `-$${promo.discountValue}`})
                  </option>
                ))}
              </select>
            </label>
          )}
        </section>

        {/* RESUMEN DE COBROS ACTUALIZADO */}
        <div className="cashier-total-summary" style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
            <span>Subtotal</span>
            <span>${toMoney(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: '500' }}>
              <span>Descuento</span>
              <span>-${toMoney(discount)}</span>
            </div>
          )}
          <div className="cashier-total" style={{ borderTop: '1px solid #eee', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
            <span>Total</span>
            <strong>${toMoney(total)}</strong>
          </div>
        </div>

        <button className="cashier-checkout" type="button" disabled={cart.length === 0 || isSaving} onClick={handleCreateOrder}>
          {isSaving ? "Enviando..." : "Validar cobro y enviar a cocina"}
        </button>

        {ticket && (
          <section className="ticket-preview" aria-label="Ticket generado">
            <div className="ticket-head">
              <span>TechFlavor</span>
              <strong>{ticket.code}</strong>
              <em>
                {ticket.fulfillmentType === "dine_in"
                  ? `Consumir en el lugar - ${ticket.tableIdentifier}`
                  : "Para llevar"}
              </em>
              <small>{new Date(ticket.createdAt).toLocaleString()}</small>
            </div>
            <div className="ticket-lines">
              <div className="ticket-line">
                <span>Responsable</span>
                <b>{ticket.cashierName}</b>
              </div>
              {ticket.items.map((item) => (
                <div className="ticket-line" key={`${item.type}-${item.name}`}>
                  <span>{item.quantity}x {item.name}</span>
                  <b>${item.lineTotal}</b>
                </div>
              ))}
            </div>
            <div className="ticket-total">
              <span>Subtotal</span>
              <b>${ticket.subtotal}</b>
            </div>
            {Number(ticket.discountTotal) > 0 && (
              <div className="ticket-total" style={{ color: '#16a34a' }}>
                <span>Descuento ({ticket.promotionApplied})</span>
                <b>-${ticket.discountTotal}</b>
              </div>
            )}
            <div className="ticket-total" style={{ borderTop: '1px dashed #000', marginTop: '5px', paddingTop: '5px' }}>
              <span>TOTAL A PAGAR</span>
              <strong>${ticket.total}</strong>
            </div>
            <p>Cobro validado. Pedido enviado a cocina.</p>
          </section>
        )}
      </aside>
    </section>
  );
};