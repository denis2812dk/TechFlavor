const iconMap = {
  dashboard: (
    <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  ),
  orders: (
    <path d="M7 5h10m-9 4h8m-8 4h6m-7 6h10a2 2 0 0 0 2-2V7l-3-3H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  tables: (
    <path d="M5 8.5h14M7.5 8.5v8m9-8v8M9 5h6a1 1 0 0 1 1 1v2.5H8V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  menu: (
    <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  ),
  products: (
    <path d="M12 3 4.8 6.9v10.2L12 21l7.2-3.9V6.9L12 3Zm0 0v8.2M4.8 6.9 12 11.2l7.2-4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  ),
  categories: (
    <path d="M5 5h5v5H5V5Zm9 0h5v5h-5V5ZM5 14h5v5H5v-5Zm9 0h5v5h-5v-5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  ),
  combos: (
    <path d="m12 4 7 3.8-7 3.8-7-3.8L12 4Zm-7 8 7 3.8 7-3.8M5 16.2 12 20l7-3.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  ),
  inventory: (
    <>
      <path d="M12 3.5 5 7.3v9.4l7 3.8 7-3.8V7.3l-7-3.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.2 11.6h5.6M9.2 14.4h5.6M12 7.3v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </>
  ),
  promotions: (
    <path d="M21.5 12.5L12 22l-9.5-9.5V3h9.5l9.5 9.5z M8.5 8.5a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  ),
  reports: (
    <path d="M5 19h14M8 16V9m4 7V5m4 11v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  settings: (
    <>
      <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1.7 1.7 0 1 1-3.4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1.7 1.7 0 1 1 0-3.4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1 1 0 0 0 1.1.2H8.5a1 1 0 0 0 .6-.9V4a1.7 1.7 0 1 1 3.4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6h.2a1.7 1.7 0 1 1 0 3.4h-.2a1 1 0 0 0-.9.7Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  users: (
    <>
      <path d="M16 11.5a3.5 3.5 0 1 0-3.3-4.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 19.5c.7-3 2.4-4.5 5-4.5s4.3 1.5 5 4.5M14.5 15.5c2.5.2 4.1 1.6 4.7 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  profile: (
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  )
};

const getSidebarItems = (role) => {
  if (role === "admin") {
    return [
      { label: "Dashboard", icon: "dashboard", path: "/manager" },
      { label: "Orders", icon: "orders", path: "/manager/orders" },
      { label: "Tables", icon: "tables", path: "/manager/tables", disabled: true },
      { label: "Menu", icon: "menu", path: "/manager/menu" },
      { label: "Inventory", icon: "inventory", path: "/manager/inventory" },
      { label: "Promotions", icon: "promotions", path: "/manager/promotions" },
      { label: "Reports", icon: "reports", path: "/manager/reports", disabled: true },
      { label: "Users", icon: "users", path: "/manager/users" },
      { label: "Mi Perfil", icon: "profile", path: "/perfil" },
      { label: "Settings", icon: "settings", path: "/manager/settings", disabled: true },
    ];
  }

  if (role === "gerente") {
    return [
      { label: "Dashboard", icon: "dashboard", path: "/gerente" },
      { label: "Usuarios", icon: "users", path: "/gerente/users" },
      { label: "Menu", icon: "menu", path: "/gerente/menu" },
      { label: "Salon", icon: "tables", path: "/gerente/salon" },
      { label: "Cocina", icon: "orders", path: "/cocina" },
      { label: "Inventory", icon: "inventory", path: "/gerente/inventory" },
      { label: "Promotions", icon: "promotions", path: "/gerente/promotions" },
      { label: "Mi Perfil", icon: "profile", path: "/perfil" },
      { label: "Reports", icon: "reports", path: "/gerente/reports", disabled: true },
    ];
  }

  if (role === "cajero") {
    return [
      { label: "Caja", icon: "dashboard", path: "/cajero" },
      { label: "Ordenes", icon: "orders", path: "/cajero/orders" },
      { label: "Mi Perfil", icon: "profile", path: "/perfil" },
    ];
  }

  if (role === "cocina") {
    return [
      { label: "KDS", icon: "orders", path: "/cocina" },
      { label: "Órdenes", icon: "orders", path: "/cocina/orders" },
      { label: "Mi Perfil", icon: "profile", path: "/perfil" },
    ];
  }

  if (role === "despacho") {
    return [
      { label: "Despacho", icon: "orders", path: "/despacho" },
      { label: "Mi Perfil", icon: "profile", path: "/perfil" },
    ];
  }

  return [
    { label: "Dashboard", icon: "dashboard", path: "/operador" },
    { label: "Mi Perfil", icon: "profile", path: "/perfil" },
  ];
};

const SidebarItem = ({ label, active = false, icon, disabled = false, onClick }) => {
  return (
    <button
      type="button"
      className={`sidebar-item${active ? " is-active" : ""}`}
      disabled={disabled}
      onClick={onClick}
      style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: 1 }}
    >
      <span className="sidebar-item-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {iconMap[icon]}
        </svg>
      </span>
      <span>{label}</span>
    </button>
  );
};

export const Sidebar = ({ currentPath, onNavigate, userName, userRole, initials }) => {
  const accentColor = "#E89B8F";
  const textColor = "#2D1810";
  const sidebarItems = getSidebarItems(userRole);

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 6.5h8.5a3.5 3.5 0 1 1 0 7H10" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 10.2h7a3.65 3.65 0 1 1 0 7.3H8.8" stroke={textColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div className="sidebar-brand-title">RestaurantOS</div>
          <div className="sidebar-brand-subtitle">Manager dashboard</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navegacion principal">
        {sidebarItems.map((item) => (
          <SidebarItem
            key={item.path}
            active={item.path === currentPath}
            disabled={item.disabled}
            label={item.label}
            icon={item.icon}
            onClick={() => {
              if (!item.disabled) onNavigate(item.targetPath || item.path);
            }}
          />
        ))}
      </nav>

      <div 
        className="sidebar-footer" 
        onClick={() => onNavigate("/perfil")} 
        style={{ cursor: "pointer" }}
        role="button"
        title="Configuración de perfil"
      >
        <div className="avatar">{initials || "TF"}</div>
        <div className="user-meta">
          <span className="user-name">{userName}</span>
          <span className="user-role">{userRole}</span>
        </div>
      </div>
    </aside>
  );
};