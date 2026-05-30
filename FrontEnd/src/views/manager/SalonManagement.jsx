import { useEffect, useState } from "react";
import { getSalonStatus, createZone, createTable, updateTableStatus, editTable, editZone, updateZoneStatus } from "../../lib/salon";

export const SalonManagement = () => {
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Estados para formularios
  const [newZoneName, setNewZoneName] = useState("");
  const [newTable, setNewTable] = useState({ zoneId: "", identifier: "", capacity: 4 });
  const [activeTab, setActiveTab] = useState("");

  // Estado para edición
  const [editingTable, setEditingTable] = useState(null);
  const [editingZone, setEditingZone] = useState(null);

  const loadSalon = async () => {
    try {
      setIsLoading(true);
      const data = await getSalonStatus();
      setZones(data.salon || []);
      
      const activeZones = (data.salon || []).filter(z => z.isActive);
      
      // Si la pestaña activa actual ya no existe o está inactiva, volvemos a la primera activa
      if (activeZones.length > 0 && (!activeTab || !activeZones.find(z => z.id === activeTab))) {
        setActiveTab(activeZones[0].id);
      } else if (activeZones.length === 0) {
        setActiveTab("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchSalon = async () => {
      await loadSalon();
    };
    fetchSalon();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateZone = async (e) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    try {
      await createZone(newZoneName);
      setNewZoneName("");
      await loadSalon();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditZoneModal = (zone) => {
    setEditingZone({ ...zone });
  };

  const handleEditZoneSubmit = async (e) => {
    e.preventDefault();
    if (!editingZone.name.trim()) return;
    try {
      await editZone(editingZone.id, editingZone.name);
      setEditingZone(null);
      await loadSalon();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleModalZoneStatus = async () => {
    if (!window.confirm(`¿Estás seguro de desactivar la zona "${editingZone.name}"? Esto también desactivará TODAS las mesas dentro de esta zona.`)) return;
    
    try {
      await updateZoneStatus(editingZone.id, false);
      setEditingZone(null);
      await loadSalon();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReactivateZone = async (zone) => {
    if (!window.confirm(`¿Deseas reactivar la zona "${zone.name}"?`)) return;
    
    try {
      await updateZoneStatus(zone.id, true);
      await loadSalon();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!newTable.zoneId || !newTable.identifier.trim()) return;
    try {
      await createTable(newTable.zoneId, newTable.identifier, newTable.capacity);
      setNewTable({ ...newTable, identifier: "" }); // Limpiamos solo el nombre para poder crear varias en la misma zona
      await loadSalon();
      setActiveTab(newTable.zoneId); // Saltamos a la pestaña donde se creó la mesa
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditModal = (table) => {
    setEditingTable({ ...table });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTable.zoneId || !editingTable.identifier.trim()) return;
    try {
      await editTable(editingTable.id, editingTable.zoneId, editingTable.identifier, editingTable.capacity);
      setEditingTable(null);
      await loadSalon();
      setActiveTab(editingTable.zoneId);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleModalTableStatus = async () => {
    const newStatus = editingTable.status === "inactive" ? "available" : "inactive";
    if (!window.confirm(`¿Cambiar estado de ${editingTable.identifier} a ${newStatus === 'inactive' ? 'Inactiva' : 'Disponible'}?`)) return;
    
    try {
      await updateTableStatus(editingTable.id, newStatus);
      setEditingTable(prev => ({ ...prev, status: newStatus }));
      await loadSalon();
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading && zones.length === 0) {
    return <p className="menu-loading" style={{ padding: "40px", textAlign: "center" }}>Cargando configuración del salón...</p>;
  }

  const activeZones = zones.filter(z => z.isActive);
  const inactiveZones = zones.filter(z => !z.isActive);
  const activeZoneData = activeZones.find(z => z.id === activeTab) || activeZones[0];

  return (
    <section className="users-console">
      <header className="users-console-head">
        <div>
          <p className="admin-users-kicker">Configuración</p>
          <h2>Salón y Mesas</h2>
          <p>Define las zonas de tu restaurante y agrega las mesas físicas.</p>
        </div>
      </header>

      {error && <p className="admin-users-error">{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px", marginBottom: "32px", alignItems: "start" }}>
        {/* Crear Zona */}
        <form className="inventory-form" onSubmit={handleCreateZone}>
          <div style={{ marginBottom: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>1. Crear Nueva Zona</h3>
          </div>
          <label>
            <span>Nombre de zona</span>
            <input 
              type="text" 
              placeholder="Ej. Terraza, Piso 1..." 
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              required 
            />
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
            <button type="submit" style={{ background: "var(--color-accent)", color: "#fff" }}>Agregar zona</button>
          </div>
        </form>

        {/* Crear Mesa */}
        <form className="menu-create-panel" onSubmit={handleCreateTable}>
          <h3 style={{ gridColumn: "1 / -1", margin: "0 0 8px 0", color: "var(--color-text)", fontSize: "18px", fontWeight: "760" }}>
            2. Agregar Mesa
          </h3>
          <label>
            <span>Zona</span>
            <select 
              value={newTable.zoneId}
              onChange={(e) => setNewTable({ ...newTable, zoneId: e.target.value })}
              required
            >
              <option value="">Seleccionar...</option>
              {activeZones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </label>
          <label>
            <span>ID</span>
            <input 
              type="text" 
              placeholder="Ej. T-1" 
              value={newTable.identifier}
              onChange={(e) => setNewTable({ ...newTable, identifier: e.target.value })}
              required 
            />
          </label>
          <label>
            <span>Sillas</span>
            <input 
              type="number" 
              placeholder="4" 
              min="1"
              value={newTable.capacity}
              onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
              required 
            />
          </label>
          <button type="submit" disabled={activeZones.length === 0}>Crear mesa</button>
        </form>
      </div>

      {/* Zonas Activas */}
      {activeZones.length > 0 ? (
        <div className="users-management-shell" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
            <div className="users-tabs" style={{ overflowX: "auto", paddingBottom: "8px", flex: 1 }}>
              {activeZones.map((zone) => (
                <span 
                  key={zone.id}
                  className={activeTab === zone.id ? "is-active" : ""}
                  onClick={() => setActiveTab(zone.id)}
                  style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  {zone.name}
                  <strong style={{ 
                    background: activeTab === zone.id ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.04)", 
                    padding: "2px 8px", 
                    borderRadius: "12px", 
                    fontSize: "11px",
                    marginLeft: "4px" 
                  }}>
                    {zone.tables?.length || 0}
                  </strong>
                </span>
              ))}
            </div>
            {activeZoneData && (
              <button 
                type="button"
                onClick={() => openEditZoneModal(activeZoneData)}
                className="users-secondary-action"
                style={{ padding: "0 16px", borderRadius: "10px", marginLeft: "16px", flexShrink: 0, height: "38px", cursor: "pointer", fontWeight: "600" }}
              >
                Editar Zona
              </button>
            )}
          </div>
          
          <div style={{ minHeight: "200px" }}>
            {activeZoneData?.tables?.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "16px" }}>
                {activeZoneData.tables.map((table) => (
                  <button 
                    key={table.id}
                    type="button"
                    onClick={() => openEditModal(table)}
                    title="Clic para Editar"
                    style={{
                      background: table.status === 'inactive' ? "rgba(45,24,16,.04)" : "#fff",
                      border: "1px solid rgba(45,24,16,.08)",
                      borderRadius: "16px",
                      padding: "24px 16px",
                      textAlign: "center",
                      cursor: "pointer",
                      opacity: table.status === 'inactive' ? 0.65 : 1,
                      transition: "transform 140ms, box-shadow 140ms, border-color 140ms",
                      boxShadow: "0 8px 18px rgba(45,24,16,.03)"
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.transform = "translateY(-2px)"; 
                      e.currentTarget.style.boxShadow = "0 12px 24px rgba(45,24,16,.06)";
                      e.currentTarget.style.borderColor = "var(--color-accent)";
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.transform = "none"; 
                      e.currentTarget.style.boxShadow = "0 8px 18px rgba(45,24,16,.03)";
                      e.currentTarget.style.borderColor = "rgba(45,24,16,.08)";
                    }}
                  >
                    <h5 style={{ margin: "0 0 6px", fontSize: "22px", color: "var(--color-text)", fontWeight: "820" }}>{table.identifier}</h5>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)", fontWeight: "650" }}>{table.capacity} sillas</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="inventory-empty">
                <strong>No hay mesas en esta zona.</strong>
                <p>Usa el formulario de arriba para agregarlas.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="inventory-empty" style={{ border: "1px dashed rgba(45,24,16,.15)", borderRadius: "20px" }}>
          <strong>No tienes zonas activas.</strong>
          <p>Crea una nueva zona o reactiva una zona inactiva.</p>
        </div>
      )}

      {/* Zonas Inactivas */}
      {inactiveZones.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <h3 style={{ fontSize: "18px", color: "var(--color-text)", marginBottom: "16px", fontWeight: "760" }}>Zonas Inactivas</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {inactiveZones.map(zone => (
              <div 
                key={zone.id} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  background: "rgba(45,24,16,.03)", 
                  border: "1px solid rgba(45,24,16,.08)", 
                  borderRadius: "14px", 
                  padding: "16px 20px" 
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "16px", color: "var(--color-text)", opacity: 0.7 }}>{zone.name}</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--color-muted)" }}>{zone.tables?.length || 0} mesas inactivas</p>
                </div>
                <button 
                  onClick={() => handleReactivateZone(zone)}
                  className="users-secondary-action"
                  style={{ 
                    padding: "6px 12px", 
                    borderRadius: "8px", 
                    cursor: "pointer", 
                    fontWeight: "600",
                    fontSize: "13px",
                    background: "#10b981 !important",
                    color: "white !important",
                    border: "none !important"
                  }}
                >
                  Reactivar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Edición de Mesa */}
      {editingTable && (
        <div className="users-modal-backdrop">
          <div className="users-modal" style={{ maxWidth: "450px" }}>
            <div className="users-modal-head">
              <div>
                <h3>Editar Mesa</h3>
                <p>Modifica la información o estado de la mesa.</p>
              </div>
              <button onClick={() => setEditingTable(null)}>×</button>
            </div>
            <form className="users-create-modal-form inventory-form" onSubmit={handleEditSubmit} style={{ gap: "16px", display: "flex", flexDirection: "column" }}>
              <label>
                <span>Zona</span>
                <select 
                  value={editingTable.zoneId}
                  onChange={(e) => setEditingTable({ ...editingTable, zoneId: e.target.value })}
                  required
                >
                  {activeZones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </label>
              <label>
                <span>ID / Nombre de la Mesa</span>
                <input 
                  type="text" 
                  value={editingTable.identifier}
                  onChange={(e) => setEditingTable({ ...editingTable, identifier: e.target.value })}
                  required 
                />
              </label>
              <label>
                <span>Sillas (Capacidad)</span>
                <input 
                  type="number" 
                  min="1"
                  value={editingTable.capacity}
                  onChange={(e) => setEditingTable({ ...editingTable, capacity: e.target.value })}
                  required 
                />
              </label>
              <div className="users-modal-actions" style={{ justifyContent: "space-between", marginTop: "16px", alignItems: "center" }}>
                <button 
                  type="button" 
                  onClick={toggleModalTableStatus}
                  className="users-secondary-action"
                  style={{ 
                    background: editingTable.status === "inactive" ? "#10b981 !important" : "#ef4444 !important", 
                    color: "white !important", 
                    borderColor: "transparent !important"
                  }}
                >
                  {editingTable.status === "inactive" ? "Activar Mesa" : "Desactivar Mesa"}
                </button>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button 
                    type="button" 
                    onClick={() => setEditingTable(null)}
                    className="users-secondary-action"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    style={{
                      background: "var(--color-accent)",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600"
                    }}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edición de Zona */}
      {editingZone && (
        <div className="users-modal-backdrop">
          <div className="users-modal" style={{ maxWidth: "450px" }}>
            <div className="users-modal-head">
              <div>
                <h3>Editar Zona</h3>
                <p>Modifica el nombre o desactiva esta zona.</p>
              </div>
              <button onClick={() => setEditingZone(null)}>×</button>
            </div>
            <form className="users-create-modal-form inventory-form" onSubmit={handleEditZoneSubmit} style={{ gap: "16px", display: "flex", flexDirection: "column" }}>
              <label>
                <span>Nombre de zona</span>
                <input 
                  type="text" 
                  value={editingZone.name}
                  onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                  required 
                />
              </label>
              
              <div className="users-modal-actions" style={{ justifyContent: "space-between", marginTop: "16px", alignItems: "center" }}>
                <button 
                  type="button" 
                  onClick={toggleModalZoneStatus}
                  className="users-secondary-action"
                  style={{ 
                    background: "#ef4444 !important", 
                    color: "white !important", 
                    borderColor: "transparent !important"
                  }}
                >
                  Desactivar Zona
                </button>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button 
                    type="button" 
                    onClick={() => setEditingZone(null)}
                    className="users-secondary-action"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    style={{
                      background: "var(--color-accent)",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600"
                    }}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};