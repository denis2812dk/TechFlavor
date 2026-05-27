import { useEffect, useMemo, useState } from "react";
import {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  setSupplierCatalog,
  listIncidences,
  addIncidence,
  resolveSupplierIncidence
} from "../../lib/suppliers";
import { listIngredients, getErrorMessage } from "../../lib/auth"; // Reutilizamos para el buscador

const TABS = ["Directorio", "Catalogo", "Incidencias"];

const emptySupplier = { name: "", contactName: "", dui: "", nit: "", phone: "", email: "", address: "", isActive: true };
const emptyCatalogItem = { ingredientId: "", ingredientName: "", unitOfMeasure: "", priceReference: "", isPreferred: false, searchText: "", isSearching: false };
const emptyIncidence = { description: "" };
const emptyResolution = { notes: "", action: "SOLO_NOTA", ingredientId: "", quantityToDeduct: "" };

const UNIT_OPTIONS = ["unidad", "libra", "kilo", "gramo", "litro", "mililitro", "onza"];

const formatDui = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 8) return digits;
  return `${digits.slice(0, 8)}-${digits.slice(8, 9)}`;
};

const formatPhone = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}`;
};

export const SupplierManagement = () => {
  const [activeTab, setActiveTab] = useState("Directorio");
  const [suppliers, setSuppliers] = useState([]);
  const [globalIngredients, setGlobalIngredients] = useState([]);
  
  // Estados de formularios
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [catalogItems, setCatalogItems] = useState([]);
  const [incidenceForm, setIncidenceForm] = useState(emptyIncidence);
  const [resolutionForm, setResolutionForm] = useState(emptyResolution);
  
  // Estados de control
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [incidences, setIncidences] = useState([]);
  const [resolvingIncidenceId, setResolvingIncidenceId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [suppData, ingData] = await Promise.all([
        listSuppliers(),
        listIngredients()
      ]);
      setSuppliers(suppData.suppliers || []);
      setGlobalIngredients(ingData.ingredients || []);
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowCreate(false);
    setEditingSupplier(null);
    clearMessages();
  };

  const activeSuppliers = useMemo(() => suppliers.filter(s => s.isActive), [suppliers]);
  const selectedSupplier = useMemo(() => suppliers.find(s => s.id === selectedSupplierId), [suppliers, selectedSupplierId]);

  // ==========================================
  // 1. DIRECTORIO (CRUD)
  // ==========================================
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsSaving(true);
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, supplierForm);
        setStatus("Proveedor actualizado correctamente.");
      } else {
        await createSupplier(supplierForm);
        setStatus("Proveedor registrado correctamente.");
      }
      setSupplierForm(emptySupplier);
      setEditingSupplier(null);
      setShowCreate(false);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm("¿Seguro que deseas desactivar este proveedor?")) return;
    clearMessages();
    try {
      await deleteSupplier(id);
      setStatus("Proveedor desactivado.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // ==========================================
  // 2. CATÁLOGO HÍBRIDO
  // ==========================================
  useEffect(() => {
    if (activeTab === "Catalogo" && selectedSupplier) {
      const items = selectedSupplier.catalog.length > 0 
        ? selectedSupplier.catalog.map(c => ({
            ...emptyCatalogItem,
            ingredientId: c.ingredientId,
            ingredientName: c.ingredientName,
            unitOfMeasure: c.unitOfMeasure,
            priceReference: c.priceReference,
            isPreferred: c.isPreferred,
            searchText: c.ingredientName
          }))
        : [{ ...emptyCatalogItem }];
      setCatalogItems(items);
    }
  }, [activeTab, selectedSupplier]);

  const handleSaveCatalog = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsSaving(true);
    
    // Limpiar items vacíos antes de enviar
    const validItems = catalogItems.filter(item => item.ingredientId || (item.ingredientName && item.unitOfMeasure));
    
    try {
      await setSupplierCatalog(selectedSupplierId, { items: validItems });
      setStatus("Catálogo actualizado. Si agregaste insumos nuevos, ya están en el inventario.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const updateCatalogItem = (index, field, value) => {
    setCatalogItems(items => items.map((it, i) => i === index ? { ...it, [field]: value } : it));
  };

  const handleSelectExistingIngredient = (index, ing) => {
    setCatalogItems(items => items.map((it, i) => {
      if (i === index) {
        return { ...it, ingredientId: ing.id, ingredientName: ing.name, unitOfMeasure: ing.unitOfMeasure, searchText: ing.name, isSearching: false };
      }
      return it;
    }));
  };

  // ==========================================
  // 3. INCIDENCIAS
  // ==========================================
  const loadIncidences = async (suppId) => {
    try {
      const res = await listIncidences(suppId);
      setIncidences(res.incidences || []);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    if (activeTab === "Incidencias" && selectedSupplierId) {
      loadIncidences(selectedSupplierId);
    }
  }, [activeTab, selectedSupplierId]);

  const handleCreateIncidence = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsSaving(true);
    try {
      await addIncidence(selectedSupplierId, incidenceForm);
      setStatus("Incidencia registrada.");
      setIncidenceForm(emptyIncidence);
      setShowCreate(false);
      await loadIncidences(selectedSupplierId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResolveIncidence = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsSaving(true);
    try {
      const payload = {
        notes: resolutionForm.notes,
        action: resolutionForm.action,
        ingredientId: resolutionForm.action === "DEVOLUCION" ? resolutionForm.ingredientId : undefined,
        quantityToDeduct: resolutionForm.action === "DEVOLUCION" ? resolutionForm.quantityToDeduct : undefined
      };
      await resolveSupplierIncidence(selectedSupplierId, resolvingIncidenceId, payload);
      setStatus("Incidencia resuelta. Si hubo devolución, el inventario se ha descontado.");
      setResolvingIncidenceId(null);
      setResolutionForm(emptyResolution);
      await loadIncidences(selectedSupplierId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="menu-catalog-page">
      <header className="menu-catalog-head">
        <div>
          <h2>Gestión de Proveedores</h2>
          <p>Administra tus contactos, negocia precios y gestiona devoluciones.</p>
        </div>
      </header>

      <nav className="menu-catalog-tabs">
        {TABS.map((tab) => (
          <button key={tab} type="button" className={activeTab === tab ? "is-active" : ""} onClick={() => handleTabChange(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      {status && <div className="admin-users-success mb-3">{status}</div>}
      {error && <div className="admin-users-error mb-3">{error}</div>}

      {/* ==========================================
          TAB 1: DIRECTORIO 
      ========================================== */}
      {activeTab === "Directorio" && (
        <>
          <div className="menu-catalog-toolbar">
            <p>{suppliers.length} proveedores registrados ({activeSuppliers.length} activos)</p>
            <button type="button" className="menu-catalog-action" onClick={() => {
              setSupplierForm(emptySupplier); setEditingSupplier(null); setShowCreate(!showCreate);
            }}>
              + Nuevo Proveedor
            </button>
          </div>

          {(showCreate || editingSupplier) && (
            <form
              className="menu-create-panel"
              onSubmit={handleSaveSupplier}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div className="is-wide d-flex justify-content-between align-items-center gap-3">
                <h3 className="h5 mb-0">{editingSupplier ? "Editar Proveedor" : "Crear Proveedor"}</h3>
                {editingSupplier && (
                  <label className="d-flex align-items-center gap-2">
                    <span className="small text-muted">¿Está activo?</span>
                    <input type="checkbox" checked={supplierForm.isActive} onChange={(e) => setSupplierForm(f => ({ ...f, isActive: e.target.checked }))} />
                  </label>
                )}
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                <span>Razón Social / Marca (*)</span>
                <input value={supplierForm.name} onChange={e => setSupplierForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej. Lácteos S.A. de C.V." required />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                <span>DUI del responsable (*)</span>
                <input
                  value={supplierForm.dui}
                  onChange={(e) => setSupplierForm((f) => ({ ...f, dui: formatDui(e.target.value) }))}
                  placeholder="00000000-0"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{8}-[0-9]"
                  title="El DUI debe tener el formato 00000000-0"
                  required
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                <span>Nombre del Vendedor / Contacto</span>
                <input value={supplierForm.contactName} onChange={e => setSupplierForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Ej. Juan Pérez" />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                <span>NIT de la empresa</span>
                <input value={supplierForm.nit} onChange={e => setSupplierForm(f => ({ ...f, nit: e.target.value }))} placeholder="0000-000000-000-0" />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                <span>Teléfono</span>
                <input
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
                  placeholder="Ej. 2222-3333"
                  inputMode="numeric"
                  maxLength={9}
                  pattern="[0-9]{4}-[0-9]{4}"
                  title="El teléfono debe tener el formato 0000-0000"
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                <span>Email</span>
                <input type="email" value={supplierForm.email} onChange={e => setSupplierForm(f => ({ ...f, email: e.target.value }))} placeholder="ventas@lacteos.com" />
              </label>
              <label className="is-wide" style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                <span>Dirección física</span>
                <textarea value={supplierForm.address} onChange={e => setSupplierForm(f => ({ ...f, address: e.target.value }))} placeholder="Dirección completa..." />
              </label>
              <div className="is-wide d-flex gap-2">
                <button type="submit" disabled={isSaving} className="flex-grow-1">{isSaving ? "Guardando..." : "Guardar Proveedor"}</button>
                <button type="button" className="is-secondary" onClick={() => { setShowCreate(false); setEditingSupplier(null); }}>Cancelar</button>
              </div>
            </form>
          )}

          <div className="menu-card-grid">
            {suppliers.map((sup) => (
              <article className="menu-catalog-card" key={sup.id} style={{ opacity: sup.isActive ? 1 : 0.6 }}>
                <div className="menu-card-icon">{sup.name.slice(0, 2).toUpperCase()}</div>
                <h3>{sup.name}</h3>
                <p className="mb-1 text-muted small">{sup.contactName ? `Contacto: ${sup.contactName}` : "Sin contacto específico"}</p>
                <p className="mb-2 text-muted small">{sup.phone || sup.email || "Sin datos de contacto"}</p>
                <div className="menu-card-foot mt-auto pt-3 border-top">
                  <span className={sup.isActive ? "text-success small fw-bold" : "text-danger small fw-bold"}>{sup.isActive ? "Activo" : "Inactivo"}</span>
                  <div className="menu-card-actions">
                    <button type="button" onClick={() => { setEditingSupplier(sup); setSupplierForm(sup); setShowCreate(false); }}>Editar</button>
                    {sup.isActive && <button type="button" onClick={() => handleDeleteSupplier(sup.id)} className="text-danger">Desactivar</button>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* ==========================================
          TAB 2: CATÁLOGO HÍBRIDO 
      ========================================== */}
      {activeTab === "Catalogo" && (
        <div className="inventory-form-stack">
          <div className="inventory-form">
            <div>
              <p className="admin-users-kicker">Catálogo de Compras</p>
              <h3>Asignar insumos a proveedor</h3>
              <p>Mapea qué nos vende cada proveedor. Puedes buscar un insumo existente o crear uno nuevo al vuelo.</p>
            </div>
            
            <label className="is-wide mb-4">
              <span>Selecciona un Proveedor</span>
              <select value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)} className="form-select border p-2 w-100">
                <option value="">-- Elige un proveedor activo --</option>
                {activeSuppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
              </select>
            </label>

            {selectedSupplierId && (
              <form onSubmit={handleSaveCatalog}>
                <div className="menu-combo-items w-100">
                  <div className="menu-combo-items-head">
                    <span>Insumos ofrecidos por {selectedSupplier?.name}</span>
                    <button type="button" onClick={() => setCatalogItems([...catalogItems, { ...emptyCatalogItem }])}>+ Fila</button>
                  </div>
                  
                  {catalogItems.map((item, index) => (
                    <div key={index} className="d-flex flex-wrap gap-2 mb-3 p-3 border rounded bg-light align-items-start">
                      
                      {/* Búsqueda o Nombre Nuevo */}
                      <div style={{ flex: "1 1 250px", position: "relative" }}>
                        <span className="small fw-bold text-muted d-block mb-1">Insumo (Buscar o Crear Nuevo)</span>
                        <input
                          type="text"
                          value={item.searchText}
                          onChange={(e) => {
                            updateCatalogItem(index, "searchText", e.target.value);
                            updateCatalogItem(index, "ingredientName", e.target.value); // Asumimos que quiere crearlo si no hace clic en la lista
                            updateCatalogItem(index, "ingredientId", ""); // Limpiamos ID porque está tipeando
                            updateCatalogItem(index, "isSearching", true);
                          }}
                          onFocus={() => updateCatalogItem(index, "isSearching", true)}
                          onBlur={() => setTimeout(() => updateCatalogItem(index, "isSearching", false), 200)}
                          placeholder="Escribe para buscar o crear..."
                          className="w-100 p-2 border rounded"
                        />
                        {item.isSearching && item.searchText && (
                          <ul className="position-absolute w-100 bg-white border rounded shadow-sm" style={{ zIndex: 10, maxHeight: "150px", overflowY: "auto", listStyle: "none", padding: 0 }}>
                            {globalIngredients.filter(g => g.name.toLowerCase().includes(item.searchText.toLowerCase())).map(ing => (
                              <li key={ing.id} onMouseDown={() => handleSelectExistingIngredient(index, ing)} className="p-2 border-bottom" style={{ cursor: "pointer" }}>
                                {ing.name} <small>({ing.unitOfMeasure})</small>
                              </li>
                            ))}
                            <li className="p-2 text-primary fw-bold" style={{ cursor: "default" }}>
                              <i>O continúa escribiendo para crearlo como nuevo...</i>
                            </li>
                          </ul>
                        )}
                      </div>

                      {/* Unidad (Solo editable si es nuevo) */}
                      <div style={{ width: "120px" }}>
                        <span className="small fw-bold text-muted d-block mb-1">Unidad</span>
                        {item.ingredientId ? (
                          <input type="text" value={item.unitOfMeasure} disabled className="w-100 p-2 border rounded bg-light text-muted" />
                        ) : (
                          <select value={item.unitOfMeasure} onChange={(e) => updateCatalogItem(index, "unitOfMeasure", e.target.value)} className="w-100 p-2 border rounded">
                            <option value="">Seleccionar</option>
                            {UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        )}
                      </div>

                      {/* Precio y Preferencia */}
                      <div style={{ width: "100px" }}>
                        <span className="small fw-bold text-muted d-block mb-1">Precio Ref. $</span>
                        <input type="number" step="0.01" min="0" value={item.priceReference} onChange={(e) => updateCatalogItem(index, "priceReference", e.target.value)} placeholder="0.00" className="w-100 p-2 border rounded" />
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "10px" }}>
                        <button type="button" onClick={() => setCatalogItems(items => items.filter((_, i) => i !== index))} className="btn btn-sm btn-outline-danger">X</button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 border-top pt-3">
                  <button type="submit" disabled={isSaving || catalogItems.length === 0} className="w-100">{isSaving ? "Guardando..." : "Guardar Catálogo"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: INCIDENCIAS 
      ========================================== */}
      {activeTab === "Incidencias" && (
        <div className="inventory-form-stack">
          <div className="inventory-form">
            <div>
              <p className="admin-users-kicker">Reclamos y Devoluciones</p>
              <h3>Bitácora de Proveedor</h3>
              <p>Lleva el registro de productos dañados, retrasos y resoluciones (descuentos en stock).</p>
            </div>
            
            <label className="is-wide mb-4">
              <span>Selecciona un Proveedor</span>
              <select value={selectedSupplierId} onChange={(e) => { setSelectedSupplierId(e.target.value); setShowCreate(false); setResolvingIncidenceId(null); }} className="form-select border p-2 w-100">
                <option value="">-- Elige un proveedor activo --</option>
                {activeSuppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
              </select>
            </label>

            {selectedSupplierId && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="h6 mb-0">Historial de {selectedSupplier?.name}</h4>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => { setShowCreate(!showCreate); setResolvingIncidenceId(null); }}>+ Registrar Incidencia</button>
                </div>

                {showCreate && (
                  <form onSubmit={handleCreateIncidence} className="mb-4 p-3 border rounded bg-light">
                    <label className="is-wide">
                      <span>Descripción del problema</span>
                      <textarea value={incidenceForm.description} onChange={e => setIncidenceForm({ description: e.target.value })} required placeholder="Ej. El pedido de queso llegó derretido..." className="w-100 p-2 border rounded" />
                    </label>
                    <div className="d-flex gap-2 mt-2">
                      <button type="submit" disabled={isSaving} className="flex-grow-1">Guardar</button>
                      <button type="button" onClick={() => setShowCreate(false)} className="is-secondary">Cancelar</button>
                    </div>
                  </form>
                )}

                {resolvingIncidenceId && (
                  <form onSubmit={handleResolveIncidence} className="mb-4 p-3 border border-warning rounded bg-light">
                    <h5 className="h6 text-warning">Resolviendo incidencia</h5>
                    <label className="w-100 mb-2">
                      <span className="small fw-bold">¿Cómo se resolvió? (Notas)</span>
                      <input type="text" value={resolutionForm.notes} onChange={e => setResolutionForm(f => ({ ...f, notes: e.target.value }))} required className="w-100 p-2 border rounded" />
                    </label>
                    
                    <label className="w-100 mb-2">
                      <span className="small fw-bold">Acción de resolución</span>
                      <select value={resolutionForm.action} onChange={e => setResolutionForm(f => ({ ...f, action: e.target.value }))} className="w-100 p-2 border rounded">
                        <option value="SOLO_NOTA">Solo dejar nota (No afecta inventario)</option>
                        <option value="DESCUENTO_FUTURO">Promesa de descuento futuro</option>
                        <option value="DEVOLUCION">Devolución / Desechar producto (Resta Inventario)</option>
                      </select>
                    </label>

                    {resolutionForm.action === "DEVOLUCION" && (
                      <div className="d-flex gap-2 mb-2">
                        <div className="flex-grow-1">
                          <span className="small fw-bold">Insumo a descontar</span>
                          <select value={resolutionForm.ingredientId} onChange={e => setResolutionForm(f => ({ ...f, ingredientId: e.target.value }))} required className="w-100 p-2 border rounded">
                            <option value="">Seleccionar...</option>
                            {selectedSupplier?.catalog.map(c => <option key={c.ingredientId} value={c.ingredientId}>{c.ingredientName}</option>)}
                          </select>
                        </div>
                        <div style={{ width: "120px" }}>
                          <span className="small fw-bold">Cantidad</span>
                          <input type="number" step="0.01" min="0.01" value={resolutionForm.quantityToDeduct} onChange={e => setResolutionForm(f => ({ ...f, quantityToDeduct: e.target.value }))} required className="w-100 p-2 border rounded" />
                        </div>
                      </div>
                    )}

                    <div className="d-flex gap-2 mt-3">
                      <button type="submit" disabled={isSaving} className="flex-grow-1 btn-warning text-dark border-0">Confirmar Resolución</button>
                      <button type="button" onClick={() => setResolvingIncidenceId(null)} className="is-secondary">Cancelar</button>
                    </div>
                  </form>
                )}

                <div className="inventory-table-wrap mt-3">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Descripción</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidences.length === 0 ? (
                        <tr><td colSpan="4" className="text-center text-muted p-3">No hay incidencias registradas.</td></tr>
                      ) : (
                        incidences.map(inc => (
                          <tr key={inc.id}>
                            <td className="small">{new Date(inc.date).toLocaleDateString()}</td>
                            <td className="small">{inc.description}</td>
                            <td>
                              <span className={`inventory-pill ${inc.status === 'ABIERTA' ? 'is-empty' : 'is-ok'}`}>
                                {inc.status}
                              </span>
                            </td>
                            <td>
                              {inc.status === "ABIERTA" && (
                                <button type="button" className="btn btn-sm text-primary p-0 text-decoration-underline" onClick={() => { setResolvingIncidenceId(inc.id); setShowCreate(false); setResolutionForm(emptyResolution); }}>
                                  Resolver
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </section>
  );
};