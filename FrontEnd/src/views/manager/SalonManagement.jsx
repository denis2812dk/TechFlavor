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
    loadSalon();
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
    return <div className="p-5 text-center text-muted">Cargando configuración del salón...</div>;
  }

  const activeZoneData = zones.find(z => z.id === activeTab) || zones[0];

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      <div className="mb-4 border-bottom pb-3">
        <h2 className="h3 mb-1">Configuración de Salón</h2>
        <p className="text-muted mb-0">Define las zonas de tu restaurante y agrega las mesas físicas.</p>
      </div>

      {error && <div className="alert alert-danger shadow-sm border-0">{error}</div>}

      <div className="row mb-4 g-4">
        {/* Crear Zona */}
        <div className="col-md-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="card-title fw-bold mb-3">1. Crear Nueva Zona</h5>
              <form onSubmit={handleCreateZone} className="d-flex gap-2">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej. Terraza, Piso 1..." 
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  required 
                />
                <button type="submit" className="btn btn-primary fw-semibold" style={{ backgroundColor: "#ea580c", borderColor: "#ea580c" }}>Agregar</button>
              </form>
            </div>
          </div>
        </div>

        {/* Crear Mesa */}
        <div className="col-md-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="card-title fw-bold mb-3">2. Agregar Mesa</h5>
              <form onSubmit={handleCreateTable} className="row g-2">
                <div className="col-sm-4">
                  <select 
                    className="form-select" 
                    value={newTable.zoneId}
                    onChange={(e) => setNewTable({ ...newTable, zoneId: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar Zona...</option>
                    {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
                <div className="col-sm-3">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="ID (Ej. T-1)" 
                    value={newTable.identifier}
                    onChange={(e) => setNewTable({ ...newTable, identifier: e.target.value })}
                    required 
                  />
                </div>
                <div className="col-sm-3">
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="Sillas" 
                    min="1"
                    value={newTable.capacity}
                    onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                    required 
                  />
                </div>
                <div className="col-sm-2">
                  <button type="submit" className="btn btn-dark w-100 fw-semibold" disabled={zones.length === 0}>Crear</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa del Salón (Tabs) */}
      {zones.length > 0 ? (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
            <ul className="nav nav-tabs">
              {zones.map((zone) => (
                <li className="nav-item" key={zone.id}>
                  <button 
                    className={`nav-link fw-semibold text-dark ${activeTab === zone.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(zone.id)}
                    style={activeTab === zone.id ? { borderTop: "3px solid #ea580c" } : {}}
                  >
                    {zone.name} <span className="badge bg-secondary ms-2">{zone.tables?.length || 0}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="card-body bg-light rounded-bottom p-4">
            {activeZoneData?.tables?.length > 0 ? (
              <div className="row row-cols-2 row-cols-md-4 row-cols-lg-6 g-3">
                {activeZoneData.tables.map((table) => (
                  <div className="col" key={table.id}>
                    <div 
                      className={`card text-center h-100 border-0 shadow-sm cursor-pointer ${table.status === 'inactive' ? 'opacity-50 bg-secondary text-white' : 'bg-white'}`}
                      onClick={() => toggleTableStatus(table)}
                      style={{ cursor: "pointer", transition: "all 0.2s" }}
                      title="Clic para Activar/Desactivar"
                    >
                      <div className="card-body p-3">
                        <h5 className="fw-bold mb-1">{table.identifier}</h5>
                        <p className="small mb-0 opacity-75">{table.capacity} sillas</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 text-muted">
                No hay mesas en esta zona. Usa el formulario de arriba para agregarlas.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-5 text-muted border border-dashed rounded bg-light">
          Aún no has creado ninguna zona. Empieza creando la primera (Ej. "Salón Principal").
        </div>
      )}
    </div>
  );
};