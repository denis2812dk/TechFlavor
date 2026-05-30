import { useEffect, useState } from "react";
import { getSaasPlans, createSaasPlan } from "../../lib/saas";
import "../shared/shared.css";

export const SaasPlans = () => {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    price: "",
    maxTables: 10,
    maxUsers: 3,
    hasInventory: false,
    hasKitchenDisplay: false,
  });

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const data = await getSaasPlans();
      setPlans(data.plans || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.price) {
      alert("Por favor, completa los campos obligatorios (Nombre, Código, Precio).");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await createSaasPlan({
        ...formData,
        price: Number(formData.price),
        maxTables: Number(formData.maxTables),
        maxUsers: Number(formData.maxUsers)
      });
      
      alert("Plan creado exitosamente");
      // Limpiamos el formulario
      setFormData({
        name: "", code: "", price: "", maxTables: 10, maxUsers: 3, hasInventory: false, hasKitchenDisplay: false
      });
      loadPlans(); // Recargamos la tabla
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="users-console">
      <div className="users-console-head">
        <div>
          <div className="users-breadcrumb">Super Admin</div>
          <h2>Planes de Suscripción</h2>
          <p>Crea y gestiona los paquetes comerciales (Tiers) de tu plataforma SaaS.</p>
        </div>
      </div>

      {error && <div className="admin-users-error">{error}</div>}

      {/* FORMULARIO DE CREACIÓN */}
      <div style={{ background: "#fff", padding: "24px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
        <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "16px" }}>Crear Nuevo Plan</h3>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr 1fr" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "13px", fontWeight: "bold", color: "#475569" }}>Nombre del Plan *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Plan Profesional" style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "13px", fontWeight: "bold", color: "#475569" }}>Código Interno *</label>
            <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="Ej: pro (Sin espacios)" style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", textTransform: "lowercase" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "13px", fontWeight: "bold", color: "#475569" }}>Precio Mensual ($) *</label>
            <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "13px", fontWeight: "bold", color: "#475569" }}>Límite de Mesas</label>
            <input type="number" name="maxTables" value={formData.maxTables} onChange={handleChange} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "13px", fontWeight: "bold", color: "#475569" }}>Límite de Usuarios (Staff)</label>
            <input type="number" name="maxUsers" value={formData.maxUsers} onChange={handleChange} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center", paddingTop: "18px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
              <input type="checkbox" name="hasInventory" checked={formData.hasInventory} onChange={handleChange} />
              Incluye Módulo de Inventario
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
              <input type="checkbox" name="hasKitchenDisplay" checked={formData.hasKitchenDisplay} onChange={handleChange} />
              Incluye KDS (Cocina)
            </label>
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
            <button type="submit" className="users-primary-action" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar Plan"}
            </button>
          </div>
        </form>
      </div>

      {/* TABLA DE PLANES */}
      <div className="users-management-shell">
        <div className="users-table-wrap">
          <div className="users-table-scroll">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Código</th>
                  <th>Precio</th>
                  <th>Límites (Mesas / Usuarios)</th>
                  <th>Módulos Extra</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="users-empty-row">Cargando planes...</td></tr>
                ) : plans.length === 0 ? (
                  <tr><td colSpan="6" className="users-empty-row">No hay planes registrados.</td></tr>
                ) : (
                  plans.map((plan) => (
                    <tr key={plan.id}>
                      <td><strong>{plan.name}</strong></td>
                      <td><code style={{ fontSize: "12px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>{plan.code}</code></td>
                      <td>${Number(plan.price).toFixed(2)} / mes</td>
                      <td>{plan.maxTables} Mesas | {plan.maxUsers} Empleados</td>
                      <td>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {plan.hasInventory && <span className="users-role-badge">Inventario</span>}
                          {plan.hasKitchenDisplay && <span className="users-role-badge">KDS</span>}
                          {!plan.hasInventory && !plan.hasKitchenDisplay && <span style={{ color: "#94a3b8", fontSize: "12px" }}>Ninguno</span>}
                        </div>
                      </td>
                      <td>
                        <span className="users-status-text">
                          <i style={{ background: plan.isActive ? 'oklch(.69 .14 145)' : 'oklch(.55 .2 25)' }}></i>
                          {plan.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};