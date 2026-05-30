import { useEffect, useState } from "react";
import { getErrorMessage } from "../../lib/auth";

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - Dólar" },
  { value: "GTQ", label: "GTQ - Quetzal" },
  { value: "HNL", label: "HNL - Lempira" },
];

export const RestaurantSettings = () => {
  const [form, setForm] = useState({
    restaurantName: "",
    logoBase64: "",
    currency: "USD",
    taxRate: "0",
    primaryColor: "#ea580c",
    notes: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tenant/settings`, { credentials: "include" });
        const data = await res.json();
        if (data.success && data.settings) {
          setForm({
            restaurantName: data.settings.restaurantName || "",
            logoBase64: data.settings.logoBase64 || "",
            currency: data.settings.currency || "USD",
            taxRate: data.settings.taxRate || "0",
            primaryColor: data.settings.primaryColor || "#ea580c",
            notes: data.settings.notes || "",
          });
        }
      } catch (err) {
        setError("No se pudo cargar la configuración.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [API_URL]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen es demasiado grande. El límite es de 5MB para asegurar un buen rendimiento.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, logoBase64: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus("");
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/tenant/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar");

      setStatus("Configuración actualizada correctamente.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p style={{ padding: "40px", textAlign: "center" }}>Cargando configuración...</p>;

  return (
    <div className="users-console" style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <header className="users-console-head">
        <div>
          <p className="users-breadcrumb">Gerencia / Sistema</p>
          <h2>Identidad del Restaurante</h2>
          <p>Configura el nombre, logo y preferencias operativas de tu local.</p>
        </div>
      </header>

      {status && <div className="admin-users-success">{status}</div>}
      {error && <div className="admin-users-error">{error}</div>}

      <form onSubmit={handleSubmit} className="menu-saas-form">
        <div className="menu-two-columns">
          <label>
            <span>Nombre del Restaurante</span>
            <input type="text" required value={form.restaurantName} onChange={(e) => setForm({ ...form, restaurantName: e.target.value })} />
          </label>
          <label>
            <span>Moneda</span>
            <select required value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              <option value="">Seleccionar moneda...</option>
              {CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="menu-section-heading">
          <span>🖼️</span>
          <div>
            <h3>Logo y Marca</h3>
            <p>Este logo aparecerá en tickets y en la interfaz principal.</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "24px", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ width: "120px", height: "120px", border: "2px dashed #ddd", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#f9f9f9" }}>
            {form.logoBase64 ? <img src={form.logoBase64} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: "12px", color: "#999" }}>Sin Logo</span>}
          </div>
          <div style={{ flex: 1 }}>
            <label>
              <span>Subir nuevo logo</span>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              <small style={{ color: "var(--color-muted)", fontSize: "11px", display: "block", marginTop: "4px" }}>Máximo: 5MB. Se recomienda usar formatos optimizados para carga rápida.</small>
            </label>
            <label style={{ marginTop: "12px" }}>
              <span>Color Primario (Hex)</span>
              <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} style={{ height: "40px", padding: "2px" }} />
            </label>
          </div>
        </div>

        <div className="menu-two-columns">
          <label>
            <span>Impuesto (%)</span>
            <input type="number" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
          </label>
        </div>

        <label className="is-wide">
          <span>Notas o Términos del Ticket</span>
          <textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ej: Gracias por su compra. Propina no incluida." />
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
          <button type="submit" className="menu-primary-action" disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar Configuración"}</button>
        </div>
      </form>
    </div>
  );
};