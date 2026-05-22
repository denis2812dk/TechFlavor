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
    loadData();
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
    <div className="container-fluid py-4 px-3 px-lg-4">
      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-end gap-3 mb-4 border-bottom pb-3">
        <div>
          <p className="text-uppercase text-muted fw-semibold small mb-1">Promociones</p>
          <h2 className="h3 mb-1">Gestor de descuentos</h2>
          <p className="text-muted mb-0">Crea promociones con codigo, vigencia y alcance por producto o categoria.</p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="badge text-bg-light border rounded-pill px-3 py-2">
            {activeCount} vigentes o programadas
          </span>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setShowCreate(!showCreate);
              clearMessages();
              if(showCreate) { setForm(emptyPromo); setEditingId(null); }
            }}
          >
            {showCreate ? "Ocultar formulario" : "Nueva promocion"}
          </button>
        </div>
      </div>

      {status && <div className="alert alert-success">{status}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* PESTAÑAS DE NAVEGACIÓN */}
      {!showCreate && (
        <ul className="nav nav-pills mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === "current" ? "active" : ""}`} 
              onClick={() => setActiveTab("current")}
              type="button"
            >
              Vigentes y Programadas
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === "past" ? "active" : ""}`} 
              onClick={() => setActiveTab("past")}
              type="button"
            >
              Historial (Inactivas)
            </button>
          </li>
        </ul>
      )}

      {showCreate && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4 p-lg-5">
            <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-4">
              <div>
                <h3 className="h5 mb-1">{editingId ? "Editar promocion" : "Nueva promocion"}</h3>
                <p className="text-muted mb-0">Registra el codigo que luego validaran los cajeros al aplicar el descuento.</p>
              </div>
              <span className="badge text-bg-primary align-self-start">Codigo promocional</span>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Codigo de promocion</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  maxLength={30}
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: normalizeCode(event.target.value) })}
                  placeholder="Ej. HAPPY10"
                />
                <div className="form-text">Solo letras y numeros, de 3 a 30 caracteres.</div>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Nombre de la promocion</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Ej. Hora Feliz"
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Descripcion breve</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Describe brevemente la promocion"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Tipo de descuento</label>
                <select
                  className="form-select"
                  value={form.discountType}
                  onChange={(event) => setForm({ ...form, discountType: event.target.value })}
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed_amount">Monto fijo ($)</option>
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">
                  {form.discountType === "percentage" ? "Porcentaje de descuento" : "Monto del descuento"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  required
                  value={form.discountValue}
                  onChange={(event) => setForm({ ...form, discountValue: event.target.value })}
                  placeholder={form.discountType === "percentage" ? "Ej. 15" : "Ej. 2.50"}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Fecha y hora de inicio</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  required
                  min={editingId ? "" : getNowMin()}
                  value={form.startDate}
                  onChange={(event) => setForm({ ...form, startDate: event.target.value })}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Fecha y hora de fin</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  required
                  min={form.startDate || getNowMin()}
                  value={form.endDate}
                  onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Alcance de la promocion</label>
                <select
                  className="form-select"
                  value={form.targetType}
                  onChange={(event) => setForm({ ...form, targetType: event.target.value, targetId: "" })}
                >
                  <option value="all">Todo el menu</option>
                  <option value="category">Una categoria especifica</option>
                  <option value="product">Un producto especifico</option>
                </select>
              </div>

              {form.targetType === "category" && (
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Selecciona la categoria</label>
                  <select
                    className="form-select"
                    required
                    value={form.targetId}
                    onChange={(event) => setForm({ ...form, targetId: event.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {catalog.categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.targetType === "product" && (
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Selecciona el producto</label>
                  <select
                    className="form-select"
                    required
                    value={form.targetId}
                    onChange={(event) => setForm({ ...form, targetId: event.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {catalog.products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col-12 d-flex flex-column flex-sm-row justify-content-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setShowCreate(false);
                    clearMessages();
                    setForm(emptyPromo);
                    setEditingId(null);
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  {editingId ? "Actualizar promocion" : "Guardar promocion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!showCreate && (
        isLoading ? (
          <div className="text-center text-muted py-5">Cargando promociones...</div>
        ) : (
          <div className="row g-3">
            {(activeTab === "current" ? currentPromos : pastPromos).map((promotion) => {
              const now = new Date();
              const startDate = new Date(promotion.startDate);
              const endDate = new Date(promotion.endDate);
              
              const isFuture = startDate > now && promotion.isActive;
              const isInProgress = startDate <= now && endDate >= now && promotion.isActive;

              return (
                <div className="col-12 col-md-6 col-xl-4" key={promotion.id}>
                  <div className={`card h-100 shadow-sm border-0 ${!promotion.isActive ? "opacity-75 bg-light" : ""}`}>
                    <div className="card-body d-flex flex-column gap-3">
                      <div className="d-flex align-items-start justify-content-between gap-3">
                        <div>
                          <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                            <span className="badge text-bg-dark">{promotion.code}</span>
                            <span className={`badge ${isInProgress ? "text-bg-success" : isFuture ? "text-bg-primary" : "text-bg-secondary"}`}>
                              {isInProgress ? "En curso" : isFuture ? "Programada" : "Inactiva / Expirada"}
                            </span>
                          </div>
                          <h3 className="h5 mb-1">{promotion.name}</h3>
                          <p className="text-muted mb-0">{promotion.description || "Sin descripcion"}</p>
                        </div>
                        <span className="badge rounded-pill text-bg-primary fs-6">
                          {promotion.discountType === "percentage" ? "%" : "$"}
                        </span>
                      </div>

                      <div className="border-top pt-3 small text-muted d-grid gap-2">
                        <div className="d-flex justify-content-between gap-3">
                          <span>Descuento</span>
                          <strong className="text-dark">
                            {promotion.discountType === "percentage"
                              ? `${promotion.discountValue}%`
                              : `$${promotion.discountValue}`}
                          </strong>
                        </div>
                        <div className="d-flex justify-content-between gap-3">
                          <span>Aplica a</span>
                          <strong className="text-dark text-end">{formatTarget(promotion)}</strong>
                        </div>
                        <div className="d-flex justify-content-between gap-3">
                          <span>Inicio</span>
                          <strong className="text-dark text-end">{formatDateTime(promotion.startDate)}</strong>
                        </div>
                        <div className="d-flex justify-content-between gap-3">
                          <span>Fin</span>
                          <strong className="text-dark text-end">{formatDateTime(promotion.endDate)}</strong>
                        </div>
                      </div>

                      {/* BOTONES DE ACCIÓN (Respetando Inmutabilidad) */}
                      {(isFuture || isInProgress) && (
                        <div className="d-flex gap-2 pt-2 border-top mt-auto">
                          {isFuture && (
                            <button 
                              className="btn btn-sm btn-outline-secondary flex-grow-1"
                              onClick={() => handleEditClick(promotion)}
                            >
                              Editar
                            </button>
                          )}
                          <button 
                            className="btn btn-sm btn-outline-danger flex-grow-1"
                            onClick={() => handleDeleteClick(promotion.id)}
                          >
                            Desactivar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {(activeTab === "current" ? currentPromos : pastPromos).length === 0 && (
              <div className="col-12">
                <div className="alert alert-light border text-center mb-0">
                  {activeTab === "current" 
                    ? "No hay promociones vigentes ni programadas." 
                    : "No hay historial de promociones pasadas."}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};