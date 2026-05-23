import { useEffect, useMemo, useState } from "react";
import { getErrorMessage, getMenuCatalog } from "../../lib/auth";
import {
  createPromotion,
  deletePromotion,
  listAllPromotions,
  updatePromotion,
} from "../../lib/promotions";

const emptyPromo = {
  code: "",
  name: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  startDate: "",
  endDate: "",
  targetType: "all",
  targetId: "",
};

const getNowMin = () => {
  const now = new Date();
  now.setSeconds(0, 0);
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 16);
};

const parseLocal = (value) => {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

const formatForInput = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date - offset).toISOString().slice(0, 16);
};

const normalizeCode = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");

const formatDateTime = (value) =>
  new Date(value).toLocaleString("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatTarget = (promotion) => {
  if (!promotion.targets || promotion.targets.length === 0) {
    return "Sin restricciones";
  }

  return promotion.targets
    .map((target) => {
      if (target.targetType === "all") return "Todo el menu";
      return target.targetType === "category" ? "Categoria" : "Producto";
    })
    .join(", ");
};

export const PromotionsManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [catalog, setCatalog] = useState({ products: [], categories: [] });
  
  const [form, setForm] = useState(emptyPromo);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("current"); // "current" o "past"
  
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadData = async () => {
    try {
      const [promosData, catalogData] = await Promise.all([
        listAllPromotions(),
        getMenuCatalog(),
      ]);

      setPromotions(promosData.promotions || []);
      setCatalog(catalogData);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await loadData();
    };

    fetchData();
  }, []);

  const clearMessages = () => {
    setStatus("");
    setError("");
  };

  // Clasificación de promociones para las pestañas
  const { currentPromos, pastPromos } = useMemo(() => {
    const now = new Date();
    const current = [];
    const past = [];

    promotions.forEach((promo) => {
      const isExpired = new Date(promo.endDate) < now;
      if (!promo.isActive || isExpired) {
        past.push(promo);
      } else {
        current.push(promo);
      }
    });

    return { currentPromos: current, pastPromos: past };
  }, [promotions]);

  const handleEditClick = (promo) => {
    clearMessages();
    const target = promo.targets && promo.targets[0] ? promo.targets[0] : { targetType: "all", targetId: "" };
    
    setForm({
      code: promo.code,
      name: promo.name,
      description: promo.description || "",
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      startDate: formatForInput(promo.startDate),
      endDate: formatForInput(promo.endDate),
      targetType: target.targetType,
      targetId: target.targetId || ""
    });
    setEditingId(promo.id);
    setShowCreate(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = async (promoId) => {
    if (!window.confirm("¿Estás seguro de que deseas desactivar esta promocion? Los clientes no podran usar el codigo.")) {
      return;
    }
    
    clearMessages();
    try {
      await deletePromotion(promoId);
      setStatus("Promocion desactivada correctamente.");
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const handleCreateOrUpdate = async (event) => {
    event.preventDefault();
    clearMessages();

    const code = normalizeCode(form.code.trim());
    if (code.length < 3) {
      setError("El codigo debe tener al menos 3 caracteres alfanumericos.");
      return;
    }

    const now = new Date();
    const start = parseLocal(form.startDate);
    const end = parseLocal(form.endDate);

    if (!start || !end) {
      setError("Debes completar la fecha de inicio y la fecha de fin.");
      return;
    }

    if (!editingId && start < now) {
      setError("La fecha y hora de inicio no pueden estar en el pasado.");
      return;
    }

    if (start >= end) {
      setError("La fecha de fin debe ser mayor a la fecha de inicio.");
      return;
    }

    if (form.targetType !== "all" && !form.targetId) {
      setError("Selecciona un producto o una categoria para aplicar la promocion.");
      return;
    }

    try {
      const payload = {
        code,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        isActive: true,
        targets: [
          {
            targetType: form.targetType,
            targetId: form.targetType === "all" ? null : form.targetId,
          },
        ],
      };

      if (editingId) {
        await updatePromotion(editingId, payload);
        setStatus("Promocion actualizada correctamente.");
      } else {
        await createPromotion(payload);
        setStatus("Promocion creada y programada correctamente.");
      }

      setForm(emptyPromo);
      setEditingId(null);
      setShowCreate(false);
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const activeCount = currentPromos.length;

  return (
    <section className="menu-catalog-page">
      <header className="menu-catalog-head">
        <div>
          <p className="admin-users-kicker">Promociones</p>
          <h2>Gestor de descuentos</h2>
          <p>Crea promociones con codigo, vigencia y alcance por producto o categoria.</p>
        </div>
      </header>

      <div className="menu-catalog-toolbar">
        <p>{activeCount} vigentes o programadas</p>
        <button
          type="button"
          className="menu-catalog-action"
          onClick={() => {
            setShowCreate(!showCreate);
            clearMessages();
            if(showCreate) { setForm(emptyPromo); setEditingId(null); }
          }}
        >
          <span>{showCreate ? "−" : "+"}</span>
          {showCreate ? "Ocultar formulario" : "Nueva promocion"}
        </button>
      </div>

      {status && <p className="admin-users-success">{status}</p>}
      {error && <p className="admin-users-error">{error}</p>}

      {/* PESTAÑAS DE NAVEGACIÓN */}
      {!showCreate && (
        <nav className="menu-catalog-tabs" aria-label="Secciones de promociones">
          <button 
            className={activeTab === "current" ? "is-active" : ""} 
            onClick={() => setActiveTab("current")}
            type="button"
          >
            Vigentes y Programadas
          </button>
          <button 
            className={activeTab === "past" ? "is-active" : ""} 
            onClick={() => setActiveTab("past")}
            type="button"
          >
            Historial (Inactivas)
          </button>
        </nav>
      )}

      {showCreate && (
        <form onSubmit={handleCreateOrUpdate} className="menu-create-panel">
          <div className="is-wide" style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "18px", color: "var(--color-text)" }}>{editingId ? "Editar promocion" : "Nueva promocion"}</h3>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)" }}>Registra el codigo que luego validaran los cajeros al aplicar el descuento.</p>
            </div>
            <span className="inventory-pill is-ok">Codigo promocional</span>
          </div>

          <label>
            <span>Codigo de promocion</span>
            <input
              type="text"
              required
              maxLength={30}
              value={form.code}
              onChange={(event) => setForm({ ...form, code: normalizeCode(event.target.value) })}
              placeholder="Ej. HAPPY10"
            />
            <small style={{ color: "var(--color-muted)", fontSize: "11px", marginTop: "4px" }}>Solo letras y numeros, de 3 a 30 caracteres.</small>
          </label>

          <label>
            <span>Nombre de la promocion</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Ej. Hora Feliz"
            />
          </label>

          <label className="is-wide">
            <span>Descripcion breve</span>
            <input
              type="text"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Describe brevemente la promocion"
            />
          </label>

          <label>
            <span>Tipo de descuento</span>
            <select
              value={form.discountType}
              onChange={(event) => setForm({ ...form, discountType: event.target.value })}
            >
              <option value="percentage">Porcentaje (%)</option>
              <option value="fixed_amount">Monto fijo ($)</option>
            </select>
          </label>

          <label>
            <span>{form.discountType === "percentage" ? "Porcentaje de descuento" : "Monto del descuento"}</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.discountValue}
              onChange={(event) => setForm({ ...form, discountValue: event.target.value })}
              placeholder={form.discountType === "percentage" ? "Ej. 15" : "Ej. 2.50"}
            />
          </label>

          <label>
            <span>Fecha y hora de inicio</span>
            <input
              type="datetime-local"
              required
              min={editingId ? "" : getNowMin()}
              value={form.startDate}
              onChange={(event) => setForm({ ...form, startDate: event.target.value })}
            />
          </label>

          <label>
            <span>Fecha y hora de fin</span>
            <input
              type="datetime-local"
              required
              min={form.startDate || getNowMin()}
              value={form.endDate}
              onChange={(event) => setForm({ ...form, endDate: event.target.value })}
            />
          </label>

          <label>
            <span>Alcance de la promocion</span>
            <select
              value={form.targetType}
              onChange={(event) => setForm({ ...form, targetType: event.target.value, targetId: "" })}
            >
              <option value="all">Todo el menu</option>
              <option value="category">Una categoria especifica</option>
              <option value="product">Un producto especifico</option>
            </select>
          </label>

          {form.targetType === "category" && (
            <label>
              <span>Selecciona la categoria</span>
              <select
                required
                value={form.targetId}
                onChange={(event) => setForm({ ...form, targetId: event.target.value })}
              >
                <option value="">Seleccionar...</option>
                {catalog.categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
          )}

          {form.targetType === "product" && (
            <label>
              <span>Selecciona el producto</span>
              <select
                required
                value={form.targetId}
                onChange={(event) => setForm({ ...form, targetId: event.target.value })}
              >
                <option value="">Seleccionar...</option>
                {catalog.products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </label>
          )}

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                clearMessages();
                setForm(emptyPromo);
                setEditingId(null);
              }}
              style={{ background: "rgba(255,255,255,.72)", color: "var(--color-text)", border: "1px solid rgba(45,24,16,.08)", height: "40px", borderRadius: "10px", padding: "0 16px", fontWeight: "760" }}
            >
              Cancelar
            </button>
            <button type="submit">
              {editingId ? "Actualizar promocion" : "Guardar promocion"}
            </button>
          </div>
        </form>
      )}

      {!showCreate && (
        isLoading ? (
          <p className="menu-loading" style={{ textAlign: "center", padding: "40px" }}>Cargando promociones...</p>
        ) : (
          <>
            <div className="menu-card-grid">
              {(activeTab === "current" ? currentPromos : pastPromos).map((promotion) => {
                const now = new Date();
                const startDate = new Date(promotion.startDate);
                const endDate = new Date(promotion.endDate);
                
                const isFuture = startDate > now && promotion.isActive;
                const isInProgress = startDate <= now && endDate >= now && promotion.isActive;

                return (
                  <article className={`menu-catalog-card ${!promotion.isActive ? "opacity-75" : ""}`} key={promotion.id} style={{ minHeight: "auto" }}>
                    <div className="menu-card-icon" style={{ backgroundColor: isInProgress ? "var(--color-accent)" : isFuture ? "var(--color-olive)" : "var(--color-line)" }}>
                      {promotion.discountType === "percentage" ? "%" : "$"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                      <span className="menu-category-badge" style={{ backgroundColor: "var(--color-text)", color: "#fff" }}>{promotion.code}</span>
                      <span className={`menu-status-pill ${isInProgress ? "is-on" : ""}`}>
                        {isInProgress ? "En curso" : isFuture ? "Programada" : "Inactiva / Expirada"}
                      </span>
                    </div>
                    <h3 style={{ alignSelf: "start", marginTop: "8px" }}>{promotion.name}</h3>
                    <p>{promotion.description || "Sin descripcion"}</p>
                    
                    <div className="menu-card-foot" style={{ flexDirection: "column", alignItems: "stretch", gap: "8px", paddingTop: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ border: "none", padding: 0, background: "transparent", color: "var(--color-muted)" }}>Descuento</span>
                        <strong style={{ color: "var(--color-text)" }}>
                          {promotion.discountType === "percentage"
                            ? `${promotion.discountValue}%`
                            : `$${promotion.discountValue}`}
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ border: "none", padding: 0, background: "transparent", color: "var(--color-muted)" }}>Aplica a</span>
                        <strong style={{ color: "var(--color-text)" }}>{formatTarget(promotion)}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ border: "none", padding: 0, background: "transparent", color: "var(--color-muted)" }}>Inicio</span>
                        <strong style={{ color: "var(--color-text)" }}>{formatDateTime(promotion.startDate)}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ border: "none", padding: 0, background: "transparent", color: "var(--color-muted)" }}>Fin</span>
                        <strong style={{ color: "var(--color-text)" }}>{formatDateTime(promotion.endDate)}</strong>
                      </div>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    {(isFuture || isInProgress) && (
                      <div className="menu-card-actions" style={{ justifyContent: "flex-end", marginTop: "16px", borderTop: "1px solid rgba(45,24,16,.055)", paddingTop: "16px" }}>
                        {isFuture && (
                          <button 
                            type="button"
                            onClick={() => handleEditClick(promotion)}
                          >
                            Editar
                          </button>
                        )}
                        <button 
                          type="button"
                          style={{ color: "#dc2626", borderColor: "rgba(220,38,38,.2)", background: "rgba(220,38,38,.05)" }}
                          onClick={() => handleDeleteClick(promotion.id)}
                        >
                          Desactivar
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {!isLoading && (activeTab === "current" ? currentPromos : pastPromos).length === 0 && (
              <div className="inventory-empty" style={{ border: "1px dashed rgba(45,24,16,.15)", borderRadius: "20px" }}>
                <strong>No hay promociones.</strong>
                <p>{activeTab === "current" 
                  ? "No hay promociones vigentes ni programadas." 
                  : "No hay historial de promociones pasadas."}</p>
              </div>
            )}
          </>
        )
      )}
    </section>
  );
};