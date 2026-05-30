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

  // Estados del Cropper (Recorte interactivo)
  const [tempImage, setTempImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

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
      setTempImage(reader.result);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = null; // Reiniciar el input para permitir subir la misma imagen de nuevo
  };

  // Lógica de arrastre de imagen para el Cropper
  const startDrag = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragging(true);
    setStartPos({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const onDrag = (e) => {
    if (!dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setOffset({ x: clientX - startPos.x, y: clientY - startPos.y });
  };

  const endDrag = () => setDragging(false);

  // Recortar en un lienzo HTML5 invisible y guardar como Base64
  const handleSaveCrop = () => {
    const canvas = document.createElement("canvas");
    const size = 300; // Resolución final (bastante nítida para logos)
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    
    const img = new Image();
    img.src = tempImage;
    img.onload = () => {
      // Calcular la escala para simular "object-fit: cover"
      const coverScale = Math.max(size / img.width, size / img.height);
      const finalScale = coverScale * zoom;
      const drawWidth = img.width * finalScale;
      const drawHeight = img.height * finalScale;
      const x = (size / 2) - (drawWidth / 2) + offset.x;
      const y = (size / 2) - (drawHeight / 2) + offset.y;
      
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      setForm({ ...form, logoBase64: canvas.toDataURL("image/png") });
      setShowCropper(false);
    };
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
          <div style={{ width: "120px", height: "120px", border: "2px dashed #ddd", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#f9f9f9", flexShrink: 0 }}>
            {form.logoBase64 ? <img src={form.logoBase64} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "12px", color: "#999" }}>Sin Logo</span>}
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

      {/* Modal Interactivo de Recorte */}
      {showCropper && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "16px", width: "90%", maxWidth: "400px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "18px", textAlign: "center" }}>Ajustar Logo</h3>
            
            <div style={{ width: "240px", height: "240px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 24px", backgroundColor: "#f8fafc", border: `4px solid ${form.primaryColor || "#ea580c"}`, cursor: dragging ? "grabbing" : "grab" }}>
              <img 
                src={tempImage} 
                alt="Crop preview" 
                draggable={false}
                onMouseDown={startDrag} onMouseMove={onDrag} onMouseUp={endDrag} onMouseLeave={endDrag}
                onTouchStart={startDrag} onTouchMove={onDrag} onTouchEnd={endDrag}
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
                  transformOrigin: "center"
                }} 
              />
            </div>
  
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px", color: "#64748b" }}>
                <span>Zoom</span><span>{Math.round(zoom * 100)}%</span>
              </label>
              <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
  
            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" onClick={() => setShowCropper(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>Cancelar</button>
              <button type="button" onClick={handleSaveCrop} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: form.primaryColor || "#ea580c", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>Aplicar y Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};