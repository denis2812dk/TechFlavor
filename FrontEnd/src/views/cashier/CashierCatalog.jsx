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
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [prevCart, setPrevCart] = useState([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [catalogData, promosData] = await Promise.all([
          getMenuCatalog(),
          listActivePromotions(),
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

  const normalizedPromoInput = promoCodeInput.trim().toUpperCase();

  const matchedPromoInRealtime = useMemo(
    () => activePromotions.find((promotion) => promotion.code === normalizedPromoInput),
    [activePromotions, normalizedPromoInput],
  );

  const promoStatusBadge = useMemo(() => {
    if (appliedPromo) {
      return { label: "Aplicada", className: "text-bg-success" };
    }

    if (!promoCodeInput.trim()) return null;

    if (promoError === "No Aplicable") {
      return { label: "No aplicable", className: "text-bg-warning" };
    }

    if (promoError) {
      return { label: "Inválido", className: "text-bg-danger" };
    }

    if (matchedPromoInRealtime) {
      return promoAppliesToCart(matchedPromoInRealtime, cart)
        ? { label: "Válido", className: "text-bg-success" }
        : { label: "No aplicable", className: "text-bg-warning" };
    }

    return { label: "Sin coincidencia", className: "text-bg-secondary" };
  }, [appliedPromo, cart, matchedPromoInRealtime, promoCodeInput, promoError]);

  const addToCart = (item, itemType) => {
    setTicket(null);
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (cartItem) => cartItem.itemId === item.id && cartItem.itemType === itemType,
      );

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

  function promoAppliesToCart(promotion, cartItems) {
    return cartItems.some((item) => (
      promotion.targets.some((target) => (
        target.targetType === "all"
        || (target.targetType === "product" && target.targetId === item.itemId)
        || (target.targetType === "category" && target.targetId === item.categoryId)
      ))
    ));
  }

  const handleApplyPromo = () => {
    setPromoError("");
    if (!promoCodeInput.trim()) return;

    const normalizedInput = promoCodeInput.trim().toUpperCase();
    
    // Buscamos si existe entre las promociones activas bajadas del backend
    const foundPromo = activePromotions.find(p => p.code === normalizedInput);

    if (foundPromo) {
      if (!promoAppliesToCart(foundPromo, cart)) {
        setPromoError("No Aplicable");
        setAppliedPromo(null);
        return;
      }

      setAppliedPromo(foundPromo);
    } else {
      setPromoError("Código inválido o expirado");
      setAppliedPromo(null);
    }
  };

  if (cart !== prevCart) {
    setPrevCart(cart);
    if (appliedPromo && !promoAppliesToCart(appliedPromo, cart)) {
      setAppliedPromo(null);
      setPromoError("No Aplicable");
    }
  }

  const { subtotal, discount, total } = useMemo(() => {
    let sub = 0;
    let disc = 0;

    cart.forEach((item) => {
      const lineSubtotal = item.price * item.quantity;
      let lineDiscount = 0;

      if (appliedPromo) {
        const applies = appliedPromo.targets.some((target) => (
          target.targetType === "all"
          || (target.targetType === "product" && target.targetId === item.itemId)
          || (target.targetType === "category" && target.targetId === item.categoryId)
        ));

        if (applies) {
          if (appliedPromo.discountType === "percentage") {
            lineDiscount = lineSubtotal * (Number(appliedPromo.discountValue) / 100);
          } else if (appliedPromo.discountType === "fixed_amount") {
            lineDiscount = Number(appliedPromo.discountValue) * item.quantity;
          }
        }
      }

      if (lineDiscount > lineSubtotal) lineDiscount = lineSubtotal;

      sub += lineSubtotal;
      disc += lineDiscount;
    });

    return { subtotal: sub, discount: disc, total: sub - disc };
  }, [cart, appliedPromo]);

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
        promoCode: appliedPromo?.code || undefined,
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
      setPromoCodeInput("");
      setAppliedPromo(null);
      setPromoError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="container-fluid py-4">
      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-end gap-3 mb-4 border-bottom pb-3">
        <div>
          <p className="text-uppercase text-muted fw-semibold small mb-1">Caja</p>
          <h2 className="h3 mb-1">Nuevo pedido</h2>
          <p className="text-muted mb-0">Agrega productos o combos, aplica una promocion y genera el ticket antes del pago.</p>
        </div>
        {isLoading && <span className="badge text-bg-light border">Cargando catalogo...</span>}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <main className="col-12 col-xl-8">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <div>
                <h3 className="h5 mb-0">Productos</h3>
                <small className="text-muted">Toca un producto para enviarlo al carrito.</small>
              </div>
              <span className="badge text-bg-light border">{catalog.products.length} disponibles</span>
            </div>
            <div className="card-body">
              <div className="row row-cols-1 row-cols-md-2 row-cols-xxl-3 g-3">
                {catalog.products.map((product) => (
                  <div className="col" key={product.id}>
                    <button
                      className="card h-100 border-0 shadow-sm text-start w-100 btn btn-light p-0"
                      type="button"
                      onClick={() => addToCart(product, "product")}
                    >
                      <div className="card-body d-flex flex-column gap-2">
                        <div className="d-flex justify-content-between gap-2 align-items-start">
                          <div>
                            <h4 className="h6 mb-1">{product.name}</h4>
                            <span className="badge text-bg-primary-subtle text-primary-emphasis">{product.categoryName}</span>
                          </div>
                          <span className="fw-bold text-primary">${toMoney(product.price)}</span>
                        </div>
                        <p className="text-muted small mb-0">{product.description}</p>
                      </div>
                    </button>
                  </div>
                ))}

                {!isLoading && catalog.products.length === 0 && (
                  <div className="col-12">
                    <div className="alert alert-light border mb-0">No hay productos disponibles.</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <div>
                <h3 className="h5 mb-0">Combos</h3>
                <small className="text-muted">Incluye combos listos para la venta.</small>
              </div>
              <span className="badge text-bg-light border">{catalog.combos.length} disponibles</span>
            </div>
            <div className="card-body">
              <div className="row row-cols-1 row-cols-md-2 row-cols-xxl-3 g-3">
                {catalog.combos.map((combo) => (
                  <div className="col" key={combo.id}>
                    <button
                      className="card h-100 border-0 shadow-sm text-start w-100 btn btn-light p-0"
                      type="button"
                      onClick={() => addToCart(combo, "combo")}
                    >
                      <div className="card-body d-flex flex-column gap-2">
                        <div className="d-flex justify-content-between gap-2 align-items-start">
                          <div>
                            <h4 className="h6 mb-1">{combo.name}</h4>
                            <span className="badge text-bg-secondary">Combo</span>
                          </div>
                          <span className="fw-bold text-primary">${toMoney(combo.price)}</span>
                        </div>
                        <p className="text-muted small mb-0">
                          {combo.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ")}
                        </p>
                        <p className="text-muted small mb-0">{combo.description}</p>
                      </div>
                    </button>
                  </div>
                ))}

                {!isLoading && catalog.combos.length === 0 && (
                  <div className="col-12">
                    <div className="alert alert-light border mb-0">No hay combos disponibles.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <aside className="col-12 col-xl-4">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p className="text-uppercase text-muted fw-semibold small mb-1">Carrito editable</p>
                  <h3 className="h5 mb-0">Pedido actual</h3>
                </div>
                <span className="badge text-bg-light border">{cart.length} items</span>
              </div>

              {cart.length === 0 ? (
                <div className="alert alert-light border mb-0">Agrega productos o combos para iniciar el pedido.</div>
              ) : (
                <div className="list-group list-group-flush border rounded-3 overflow-hidden">
                  {cart.map((item) => (
                    <div className="list-group-item d-flex flex-column gap-3" key={item.cartId}>
                      <div className="d-flex justify-content-between gap-3 align-items-start">
                        <div>
                          <strong className="d-block">{item.name}</strong>
                          <small className="text-muted">
                            ${toMoney(item.price)} · {item.itemType === "combo" ? "Combo" : "Producto"}
                          </small>
                        </div>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeItem(item.cartId)}>
                          Eliminar
                        </button>
                      </div>
                      <div className="input-group input-group-sm w-auto">
                        <span className="input-group-text">Cant.</span>
                        <input
                          type="number"
                          min="1"
                          className="form-control"
                          value={item.quantity}
                          onChange={(event) => updateQuantity(item.cartId, event.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body d-grid gap-3">
              <div>
                <p className="text-uppercase text-muted fw-semibold small mb-1">Modalidad</p>
                <h4 className="h6 mb-0">Entrega del pedido</h4>
              </div>

              <div className="btn-group" role="group" aria-label="Modalidad del pedido">
                <button
                  type="button"
                  className={`btn ${fulfillmentType === "takeaway" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => {
                    setFulfillmentType("takeaway");
                    setTableIdentifier("");
                  }}
                >
                  Para llevar
                </button>
                <button
                  type="button"
                  className={`btn ${fulfillmentType === "dine_in" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setFulfillmentType("dine_in")}
                >
                  Consumir aqui
                </button>
              </div>

              {fulfillmentType === "dine_in" && (
                <div>
                  <label className="form-label fw-semibold">Mesa o identificador</label>
                  <input
                    className="form-control"
                    value={tableIdentifier}
                    onChange={(event) => setTableIdentifier(event.target.value)}
                    placeholder="Ej. Mesa 8, Cliente 42, A17"
                  />
                </div>
              )}

              {activePromotions.length > 0 && cart.length > 0 && (
                <div>
                  <label className="form-label fw-semibold">Aplicar promocion</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={promoCodeInput}
                      onChange={(event) => {
                        setPromoCodeInput(event.target.value);
                        setPromoError("");
                      }}
                      placeholder="Escribe el codigo exacto"
                    />
                    <button
                      className="btn btn-outline-primary"
                      type="button"
                      onClick={handleApplyPromo}
                    >
                      Aplicar
                    </button>
                  </div>

                  {promoStatusBadge && (
                    <div className="mt-2 d-flex align-items-center gap-2">
                      <span className="small text-muted">Estado del código:</span>
                      <span className={`badge ${promoStatusBadge.className}`}>{promoStatusBadge.label}</span>
                    </div>
                  )}

                  {promoCodeInput.trim() && (
                    <div className={`mt-2 small ${matchedPromoInRealtime ? "text-success" : "text-muted"}`}>
                      {matchedPromoInRealtime
                        ? `Codigo valido detectado: ${matchedPromoInRealtime.name}`
                        : "Codigo no encontrado entre promociones activas."}
                    </div>
                  )}

                  {promoError && <div className="mt-2 small text-danger">{promoError}</div>}

                  {appliedPromo && (
                    <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
                      <span className="small text-muted">Promocion aplicada:</span>
                      <span className="badge text-bg-success">{appliedPromo.code}</span>
                      <span className="small text-muted">{appliedPromo.name}</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setAppliedPromo(null);
                          setPromoCodeInput("");
                          setPromoError("");
                        }}
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Subtotal</span>
                <strong>${toMoney(subtotal)}</strong>
              </div>
              {discount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Descuento</span>
                  <strong>-${toMoney(discount)}</strong>
                </div>
              )}
              <div className="d-flex justify-content-between border-top pt-2 fs-5">
                <span>Total</span>
                <strong>${toMoney(total)}</strong>
              </div>

              <button
                className="btn btn-success w-100 mt-3"
                type="button"
                disabled={cart.length === 0 || isSaving}
                onClick={handleCreateOrder}
              >
                {isSaving ? "Enviando..." : "Validar cobro y enviar a cocina"}
              </button>
            </div>
          </div>

          {ticket && (
            <div className="card shadow-sm border-0">
              <div className="card-body bg-light">
                <div className="d-flex flex-column gap-2 mb-3">
                  <span className="text-uppercase text-muted fw-semibold small">Ticket generado</span>
                  <strong className="fs-5">{ticket.code}</strong>
                  <span className="text-muted small">
                    {ticket.fulfillmentType === "dine_in"
                      ? `Consumir en el lugar - ${ticket.tableIdentifier}`
                      : "Para llevar"}
                  </span>
                  <small className="text-muted">{new Date(ticket.createdAt).toLocaleString()}</small>
                </div>

                <div className="list-group list-group-flush border rounded-3 overflow-hidden">
                  <div className="list-group-item d-flex justify-content-between">
                    <span>Responsable</span>
                    <strong>{ticket.cashierName}</strong>
                  </div>
                  {ticket.items.map((item) => (
                    <div className="list-group-item d-flex justify-content-between align-items-start" key={`${item.type}-${item.name}`}>
                      <span>{item.quantity}x {item.name}</span>
                      <strong>${toMoney(Number(item.unitPrice) * Number(item.quantity))}</strong>
                    </div>
                  ))}
                  <div className="list-group-item d-flex justify-content-between">
                    <span>Subtotal</span>
                    <strong>${toMoney(ticket.subtotal)}</strong>
                  </div>
                  {Number(ticket.discountTotal) > 0 && (
                    <>
                      <div className="list-group-item d-flex justify-content-between text-muted">
                        <span>Promocion aplicada</span>
                        <strong>{ticket.promotionApplied || "Promocion activa"}</strong>
                      </div>
                      <div className="list-group-item d-flex justify-content-between text-success">
                        <span>Descuento</span>
                        <strong>-${toMoney(ticket.discountTotal)}</strong>
                      </div>
                    </>
                  )}
                  <div className="list-group-item d-flex justify-content-between fw-bold">
                    <span>TOTAL A PAGAR</span>
                    <strong>${toMoney(ticket.total)}</strong>
                  </div>
                </div>

                <p className="text-success mb-0 mt-3">Cobro validado. Pedido enviado a cocina.</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
};