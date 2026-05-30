import { useEffect, useState } from "react";

export const Navbar = ({ title, description, userName, userRole, initials, onLogout, onNavigate, settings }) => {
  const [tenantSettings, setTenantSettings] = useState(null);
  const localSettings = settings || tenantSettings;

  useEffect(() => {
    if (settings || userRole === "admin") return;

    const fetchSettings = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const res = await fetch(`${API_URL}/api/tenant/settings`, { credentials: "include" });
        const data = await res.json();
        if (data.success) setTenantSettings(data.settings);
      } catch (err) {
        console.error("Error al cargar configuración en Navbar:", err);
      }
    };
    fetchSettings();
  }, [settings, userRole]);

  const accentColor = localSettings?.primaryColor || localSettings?.primary_color || "#E89B8F";
  const restaurantDisplayName = localSettings?.restaurantName || localSettings?.restaurant_name || "TechFlavor";
  const mutedColor = "#6B5D56";

  return (
    <header className="top-header">
      <div className="top-header-left">
        <div className="location-badge" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 20s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10Z" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="2.2" fill={accentColor} />
          </svg>
        </div>
        <div>
          <p className="eyebrow">{title}</p>
          <h1 className="location-title">{restaurantDisplayName}</h1>
          <p className="location-subtitle">{description}</p>
        </div>
      </div>

      <div className="top-header-right">
        <label className="search-wrap" aria-label="Buscar en el dashboard">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m21 21-4.35-4.35M10.8 18a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4Z" stroke={mutedColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input className="search-input" type="search" placeholder="Buscar ordenes, mesas o clientes" />
        </label>

        <button type="button" className="icon-button" aria-label="Notificaciones">
          <span className="notification-dot" />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 17H5.5a1.5 1.5 0 0 1-1.2-2.4l1.4-1.8V9.5a6.3 6.3 0 1 1 12.6 0v3.3l1.4 1.8A1.5 1.5 0 0 1 18.5 17H15Zm0 0a3 3 0 0 1-6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div 
          className="user-chip" 
          onClick={() => onNavigate("/perfil")} 
          style={{ cursor: "pointer" }}
          role="button"
          title="Ver perfil"
        >
          <div 
            className="avatar" 
            style={{ backgroundColor: accentColor, color: '#fff' }}
          >
            {initials || "TF"}
          </div>
          <div className="user-meta">
            <span className="user-name">{userName}</span>
            <span className="user-role">{userRole}</span>
          </div>
        </div>

        <button type="button" className="icon-button" onClick={() => onNavigate("/perfil")} title="Editar Perfil">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button type="button" className="logout-button" onClick={onLogout}>
          Salir
        </button>
      </div>
    </header>
  );
};
