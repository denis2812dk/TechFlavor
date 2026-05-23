const adminItems = [
  { label: "Dashboard", path: "/admin", icon: "dashboard" },
  { label: "Restaurantes", path: "/admin/restaurants", icon: "users" },
  { label: "Solicitudes SaaS", path: "/admin/saas", icon: "orders" },
];

const iconMap = {
  dashboard: (
    <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  ),
  orders: (
    <path d="M7 5h10m-9 4h8m-8 4h6m-7 6h10a2 2 0 0 0 2-2V7l-3-3H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  users: (
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m12-10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  profile: (
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  )
};

const AdminSidebarItem = ({ label, active, icon, onClick }) => (
  <button
    type="button"
    className={`sidebar-item${active ? " is-active" : ""}`}
    onClick={onClick}
    style={{ cursor: "pointer", opacity: 1 }}
  >
    <span className="sidebar-item-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {iconMap[icon]}
      </svg>
    </span>
    <span>{label}</span>
  </button>
);

export const AdminSidebar = ({ currentPath, onNavigate, userName, userRole, initials }) => {
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 6.5h8.5a3.5 3.5 0 1 1 0 7H10" stroke="#E89B8F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 10.2h7a3.65 3.65 0 1 1 0 7.3H8.8" stroke="#2D1810" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div className="sidebar-brand-title">TechFlavor</div>
          <div className="sidebar-brand-subtitle">Admin SaaS</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navegacion principal del admin">
        {adminItems.map((item) => (
          <AdminSidebarItem
            key={item.path}
            active={item.path === currentPath}
            label={item.label}
            icon={item.icon}
            onClick={() => onNavigate(item.path)}
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
