import { signOut } from "../../lib/auth";
import "./RoleDashboard.css";

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
};

const getSidebarItems = (role) => {
  if (role === "admin") {
    return [
      { label: "Dashboard", icon: "dashboard", path: "/admin" },
      { label: "Orders", icon: "orders", path: "/admin/orders" },
      { label: "Tables", icon: "tables", path: "/admin/tables", disabled: true },
      { label: "Menu", icon: "menu", path: "/admin/menu" },
      { label: "Inventory", icon: "inventory", path: "/admin/inventory", disabled: true },
      { label: "Reports", icon: "reports", path: "/admin/reports", disabled: true },
      { label: "Users", icon: "users", path: "/admin/users" },
      { label: "Settings", icon: "settings", path: "/admin/settings", disabled: true },
    ];
  }

  if (role === "gerente") {
    return [
      { label: "Dashboard", icon: "dashboard", path: "/gerente" },
      { label: "Menu", icon: "menu", path: "/gerente/menu" },
      { label: "Inventory", icon: "inventory", path: "/gerente/inventory", disabled: true },
      { label: "Reports", icon: "reports", path: "/gerente/reports", disabled: true },
    ];
  }

  if (role === "cajero") {
    return [
      { label: "Caja", icon: "dashboard", path: "/cajero" },
      { label: "Ordenes", icon: "orders", path: "/cajero/orders" },
    ];
  }

  if (role === "cocina") {
    return [
      { label: "KDS", icon: "orders", path: "/cocina" },
    ];
  }

  if (role === "despacho") {
    return [
      { label: "Despacho", icon: "orders", path: "/despacho" },
    ];
  }

  return [
    { label: "Dashboard", icon: "dashboard", path: "/operador" },
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

const OperationalOverview = () => {
  const activity = [
    ["New order #1247", "Table 12 · 3 items", "2m ago"],
    ["Order #1245 completed", "Delivery · $68.50", "5m ago"],
    ["Table 8 needs attention", "Requested check", "8m ago"],
    ["New order #1246", "Table 5 · 5 items", "12m ago"],
    ["New reservation", "Table 15 · 6 guests", "18m ago"],
  ];

  return (
    <div className="overview-screen">
      <section className="overview-hero">
        <div className="overview-revenue">
          <span>Today's revenue</span>
          <strong>$12,847</strong>
          <small>+18% from yesterday</small>
        </div>
        <div className="overview-stat">
          <span>24</span>
          <small>Active Orders</small>
        </div>
        <div className="overview-stat">
          <span>78%</span>
          <small>Table Occupancy</small>
        </div>
        <div className="overview-stat">
          <span>8 min</span>
          <small>Avg Cook Time</small>
        </div>
        <div className="overview-stat">
          <span>12</span>
          <small>Deliveries Out</small>
        </div>
      </section>

      <section className="overview-grid">
        <article className="overview-panel activity-panel">
          <div className="overview-panel-head">
            <h2>Live Activity</h2>
            <button type="button">View all</button>
          </div>
          {activity.map((item) => (
            <div className="activity-row" key={item[0]}>
              <span className="activity-dot" />
              <div>
                <strong>{item[0]}</strong>
                <p>{item[1]}</p>
              </div>
              <small>{item[2]}</small>
            </div>
          ))}
        </article>

        <article className="overview-panel chart-panel">
          <div className="overview-panel-head">
            <div>
              <h2>Revenue Today</h2>
              <p>Hourly breakdown</p>
            </div>
            <div className="chart-tabs">
              <span>Today</span>
              <span>Week</span>
              <span>Month</span>
            </div>
          </div>
          <div className="soft-chart" aria-hidden="true">
            <svg viewBox="0 0 720 220" preserveAspectRatio="none">
              <path d="M0 190 C80 178 110 150 160 120 C230 78 250 20 320 50 C380 78 390 135 470 140 C560 142 585 62 720 28" fill="none" stroke="oklch(0.72 0.12 32)" strokeWidth="3" />
              <path d="M0 190 C80 178 110 150 160 120 C230 78 250 20 320 50 C380 78 390 135 470 140 C560 142 585 62 720 28 L720 220 L0 220 Z" fill="oklch(0.92 0.04 32 / 0.42)" />
            </svg>
          </div>
        </article>
      </section>

      <section className="overview-panel heatmap-panel">
        <h2>Peak Hours</h2>
        <p>Weekly occupancy heatmap</p>
        <div className="heatmap">
          {["Mon", "Tue", "Wed", "Thu"].map((day) => (
            <div className="heatmap-row" key={day}>
              <span>{day}</span>
              <i />
              <i />
              <i />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export const RoleDashboard = ({ title, description, session, onLogout, children, currentPath, onNavigate }) => {
  const userName = session?.user?.name || "Usuario";
  const userRole = session?.user?.role || "operador";
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const sidebarItems = getSidebarItems(userRole);

  // These two color values are still used inline because they reference
  // JS constants and are applied to SVG stroke attributes directly.
  const accentColor = "#E89B8F";
  const textColor = "#2D1810";
  const mutedColor = "#6B5D56";

  return (
    <div className="app-shell">
      <div className="app-frame">
        <div className="dashboard-layout">
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
                <div className="sidebar-brand-subtitle">Admin dashboard</div>
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

            <div className="sidebar-footer">
              <div className="avatar">{initials || "TF"}</div>
              <div className="user-meta">
                <span className="user-name">{userName}</span>
                <span className="user-role">{userRole}</span>
              </div>
            </div>
          </aside>

          <main className="dashboard-main">
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
                  <h1 className="location-title">Brasa Norte · Polanco</h1>
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

                <div className="user-chip">
                  <div className="avatar">{initials || "TF"}</div>
                  <div className="user-meta">
                    <span className="user-name">{userName}</span>
                    <span className="user-role">{userRole}</span>
                  </div>
                </div>

                <button type="button" className="logout-button" onClick={handleLogout}>
                  Salir
                </button>
              </div>
            </header>

            <section className="content-panel" aria-label="Contenido futuro del dashboard">
              {children || <OperationalOverview />}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};