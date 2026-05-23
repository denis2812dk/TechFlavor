import { useEffect, useState } from "react";
import { getSalonStatus, createZone, createTable, updateTableStatus } from "../../lib/salon";

export const SalonManagement = () => {
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Estados para formularios
  const [newZoneName, setNewZoneName] = useState("");
  const [newTable, setNewTable] = useState({ zoneId: "", identifier: "", capacity: 4 });
  const [activeTab, setActiveTab] = useState("");

  const loadSalon = async () => {
    try {
      setIsLoading(true);
      const data = await getSalonStatus();
      setZones(data.salon || []);
      if (data.salon && data.salon.length > 0 && !activeTab) {
        setActiveTab(data.salon[0].id);
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

  const toggleTableStatus = async (table) => {
    const newStatus = table.status === "inactive" ? "available" : "inactive";
    if (!window.confirm(`¿Cambiar estado de ${table.identifier} a ${newStatus === 'inactive' ? 'Inactiva' : 'Disponible'}?`)) return;
    
    try {
      await updateTableStatus(table.id, newStatus);
      await loadSalon();
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading && zones.length === 0) {
    return <p className="menu-loading" style={{ padding: "40px", textAlign: "center" }}>Cargando configuración del salón...</p>;
  }

  const activeZoneData = zones.find(z => z.id === activeTab) || zones[0];

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
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
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
          <button type="submit" disabled={zones.length === 0}>Crear mesa</button>
        </form>
      </div>

      {/* Mapa del Salón (Tabs) */}
      {zones.length > 0 ? (
        <div className="users-management-shell" style={{ padding: "24px" }}>
          <div className="users-tabs" style={{ marginBottom: "24px", overflowX: "auto", paddingBottom: "8px" }}>
            {zones.map((zone) => (
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
          
          <div style={{ minHeight: "200px" }}>
            {activeZoneData?.tables?.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "16px" }}>
                {activeZoneData.tables.map((table) => (
                  <button 
                    key={table.id}
                    type="button"
                    onClick={() => toggleTableStatus(table)}
                    title="Clic para Activar/Desactivar"
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
          <strong>Aún no has creado ninguna zona.</strong>
          <p>Empieza creando la primera (Ej. "Salón Principal").</p>
        </div>
      )}
    </section>
  );
};