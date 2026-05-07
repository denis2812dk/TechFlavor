import { signOut } from "../../lib/auth";

const TWEAK_DEFAULTS = {
  accentColor: "oklch(0.62 0.16 24)",
  sidebarWidth: 268,
  headerHeight: 84,
};

const T = {
  bg: "oklch(0.975 0.01 30)",
  bgTint: "oklch(0.962 0.02 24)",
  surface: "oklch(0.995 0.004 30)",
  surface2: "oklch(0.985 0.008 28)",
  text: "oklch(0.24 0.02 22)",
  muted: "oklch(0.55 0.02 25)",
  line: "oklch(0.9 0.01 25)",
  accent: TWEAK_DEFAULTS.accentColor,
  accentSoft: "oklch(0.94 0.03 24)",
  radius: 24,
  radiusLg: 30,
  shadow: "0 20px 50px rgba(64, 38, 28, 0.08)",
  shadowSoft: "0 10px 30px rgba(64, 38, 28, 0.05)",
  fontSans: "'DM Sans', sans-serif",
  fontDisplay: "'Fraunces', serif",
};

const iconMap = {
  dashboard: (
    <path d="M4 13h7V4H4v9Zm9 7h7v-5h-7v5Zm0-9h7V4h-7v7ZM4 20h7v-5H4v5Z" fill="currentColor" />
  ),
  orders: (
    <path d="M7 5h10m-9 4h8m-8 4h6m-7 6h10a2 2 0 0 0 2-2V7l-3-3H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  tables: (
    <path d="M5 8.5h14M7.5 8.5v8m9-8v8M9 5h6a1 1 0 0 1 1 1v2.5H8V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  menu: (
    <path d="M7 4v8M11 4v8M7 8h4m2 12V4c3.5 0 5 2.4 5 5.1S16.5 14 13 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  inventory: (
    <path d="M12 3 4.5 7v10L12 21l7.5-4V7L12 3Zm0 0v18M4.5 7 12 11l7.5-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
      { label: "Usuarios", icon: "users", path: "/admin/users" },
      { label: "Menu", icon: "menu", path: "/admin/menu" },
      { label: "Reportes", icon: "reports", path: "/admin/reports", disabled: true },
      { label: "Configuracion", icon: "settings", path: "/admin/settings", disabled: true },
    ];
  }

  if (role === "gerente") {
    return [
      { label: "Dashboard", icon: "dashboard", path: "/gerente" },
      { label: "Menu", icon: "menu", path: "/gerente/menu" },
      { label: "Reportes", icon: "reports", path: "/gerente/reports", disabled: true },
    ];
  }

  if (role === "cajero") {
    return [
      { label: "Caja", icon: "dashboard", path: "/cajero" },
      { label: "Ordenes", icon: "orders", path: "/cajero/orders", disabled: true },
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
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 14px",
        border: "none",
        borderRadius: 16,
        background: active ? T.accentSoft : "transparent",
        color: active ? T.text : T.muted,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        fontSize: 15,
        fontWeight: active ? 600 : 500,
        textAlign: "left",
      }}
    >
      <span style={{ width: 18, height: 18, display: "inline-flex", color: active ? T.accent : T.muted }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {iconMap[icon]}
        </svg>
      </span>
      <span>{label}</span>
    </button>
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

  const kpis = [
    { label: "Ventas del dia", value: "$12,480", subtext: "Actualizado hace 8 min", tone: T.accent },
    { label: "Ordenes activas", value: "38", subtext: "12 listas para servir", tone: "oklch(0.69 0.14 145)" },
    { label: "Mesas ocupadas", value: "24 / 32", subtext: "75% de ocupacion actual", tone: "oklch(0.72 0.14 82)" },
    { label: "Ingresos totales", value: "$284,920", subtext: "Acumulado del mes en curso", tone: "oklch(0.58 0.13 285)" },
  ];

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const sidebarItems = getSidebarItems(userRole);

  return (
    <>
      <style>{`
        :root {
          --color-bg: ${T.bg};
          --color-bg-tint: ${T.bgTint};
          --color-surface: ${T.surface};
          --color-text: ${T.text};
          --color-muted: ${T.muted};
          --color-line: ${T.line};
          --color-accent: ${T.accent};
          --color-accent-soft: ${T.accentSoft};
          --radius-base: ${T.radius}px;
          --radius-lg: ${T.radiusLg}px;
          --shadow-soft: ${T.shadowSoft};
          --shadow-main: ${T.shadow};
          --font-sans: ${T.fontSans};
          --font-display: ${T.fontDisplay};
          --header-height: ${TWEAK_DEFAULTS.headerHeight}px;
        }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: var(--font-sans); background: linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-tint) 100%); color: var(--color-text); }
        button, input { font: inherit; }
        .app-shell {
          min-height: 100vh;
          width: 100%;
          background: linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-tint) 100%);
        }
        .app-frame {
          width: 100%;
          min-height: 100vh;
          padding: 0;
        }
        .dashboard-layout {
          min-height: 100vh;
          width: 100%;
          display: grid;
          grid-template-columns: ${TWEAK_DEFAULTS.sidebarWidth}px minmax(0, 1fr);
          gap: 0;
        }
        .dashboard-sidebar {
          min-height: 100vh;
          padding: 24px 18px;
          background: rgba(255,255,255,0.78);
          border-right: 1px solid var(--color-line);
          box-shadow: 12px 0 34px rgba(64, 38, 28, 0.05);
          backdrop-filter: blur(14px);
        }
        .dashboard-main {
          min-width: 0;
          min-height: 100vh;
          display: grid;
          grid-template-rows: auto auto minmax(0, 1fr);
          gap: 22px;
          padding: 24px;
        }
        .top-header {
          min-height: var(--header-height); display: flex; align-items: center; justify-content: space-between; gap: 18px;
          padding: 18px 22px; background: rgba(255,255,255,0.82); border: 1px solid var(--color-line);
          border-radius: 22px; box-shadow: var(--shadow-soft); backdrop-filter: blur(14px);
        }
        .top-header-left { display: flex; align-items: center; gap: 16px; min-width: 0; }
        .location-badge {
          width: 48px; height: 48px; border-radius: 16px; display: grid; place-items: center;
          background: linear-gradient(135deg, var(--color-accent-soft) 0%, rgba(255,255,255,0.98) 100%);
          border: 1px solid var(--color-line); box-shadow: inset 0 1px 0 rgba(255,255,255,0.8); flex-shrink: 0;
        }
        .eyebrow { margin: 0 0 4px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-muted); }
        .location-title { margin: 0; font-family: var(--font-display); font-size: 28px; line-height: 1; color: var(--color-text); }
        .location-subtitle { margin: 6px 0 0; font-size: 14px; color: var(--color-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .top-header-right { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: flex-end; }
        .search-wrap {
          display: flex; align-items: center; gap: 10px; min-width: 260px; height: 48px; padding: 0 16px;
          background: rgba(255,255,255,0.88); border: 1px solid var(--color-line); border-radius: 999px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.86);
        }
        .search-input { border: none; outline: none; background: transparent; width: 100%; color: var(--color-text); font-size: 14px; }
        .icon-button {
          width: 48px; height: 48px; border-radius: 16px; border: 1px solid var(--color-line);
          background: rgba(255,255,255,0.88); color: var(--color-text); display: grid; place-items: center;
          box-shadow: var(--shadow-soft); cursor: pointer; position: relative;
        }
        .notification-dot {
          position: absolute; top: 11px; right: 11px; width: 10px; height: 10px; border-radius: 999px;
          background: var(--color-accent); border: 2px solid var(--color-surface);
        }
        .user-chip {
          display: flex; align-items: center; gap: 12px; padding: 8px 10px 8px 8px;
          background: rgba(255,255,255,0.88); border: 1px solid var(--color-line); border-radius: 999px; box-shadow: var(--shadow-soft);
        }
        .avatar {
          width: 40px; height: 40px; border-radius: 999px; flex-shrink: 0;
          background: linear-gradient(135deg, var(--color-accent) 0%, oklch(0.95 0.02 24) 100%);
          color: white; display: grid; place-items: center; font-weight: 700; font-size: 14px;
        }
        .user-meta { display: flex; flex-direction: column; min-width: 0; }
        .user-name { font-size: 14px; font-weight: 700; color: var(--color-text); white-space: nowrap; }
        .user-role { font-size: 12px; color: var(--color-muted); white-space: nowrap; text-transform: capitalize; }
        .logout-button {
          height: 48px; border: 1px solid var(--color-line); border-radius: 16px; padding: 0 14px;
          background: rgba(255,255,255,0.88); color: var(--color-text); cursor: pointer; box-shadow: var(--shadow-soft); font-weight: 700;
        }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
        .kpi-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 100%);
          border: 1px solid var(--color-line); border-radius: var(--radius-base); box-shadow: var(--shadow-soft); padding: 22px; min-width: 0;
        }
        .kpi-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
        .kpi-label { font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--color-muted); }
        .kpi-tone { width: 12px; height: 12px; border-radius: 999px; flex-shrink: 0; box-shadow: 0 0 0 6px color-mix(in oklab, white 82%, currentColor 18%); }
        .kpi-value { margin: 0; font-size: clamp(30px, 4vw, 40px); line-height: 1; letter-spacing: 0; font-weight: 800; color: var(--color-text); }
        .kpi-subtext { margin: 10px 0 0; font-size: 13px; color: var(--color-muted); }
        .content-panel {
          min-height: 0; background: linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.72) 100%);
          border: 1px solid var(--color-line); border-radius: 22px; box-shadow: var(--shadow-main);
          padding: 28px; display: flex; align-items: stretch; justify-content: stretch;
        }
        .content-placeholder {
          width: 100%; min-height: 100%; border-radius: calc(var(--radius-base) + 2px);
          border: 1.5px dashed color-mix(in oklab, var(--color-line) 82%, var(--color-accent) 18%);
          background: linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(249,241,237,0.92) 100%);
          display: grid; place-items: center; text-align: center; padding: 32px;
        }
        .content-placeholder h2 { margin: 0 0 10px; font-size: 24px; font-family: var(--font-display); color: var(--color-text); }
        .content-placeholder p { margin: 0; font-size: 14px; color: var(--color-muted); max-width: 420px; }
        .admin-users-panel {
          width: 100%; min-height: 100%; text-align: left; background: rgba(255,255,255,0.82);
          border: 1px solid var(--color-line); border-radius: var(--radius-base); padding: 24px; box-shadow: var(--shadow-soft);
        }
        .admin-users-kicker { margin: 0 0 6px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-muted); font-weight: 700; }
        .admin-users-panel h2 { margin: 0 0 8px; font-family: var(--font-display); font-size: 24px; color: var(--color-text); }
        .admin-users-panel p { margin: 0; color: var(--color-muted); font-size: 14px; line-height: 1.5; }
        .admin-users-form { margin-top: 20px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .admin-users-form label { display: grid; gap: 7px; color: var(--color-muted); font-size: 13px; font-weight: 700; }
        .admin-users-form input, .admin-users-form select {
          width: 100%; border: 1px solid var(--color-line); border-radius: 14px; padding: 12px 13px;
          background: white; color: var(--color-text); outline: none;
        }
        .admin-users-form input:focus, .admin-users-form select:focus { border-color: var(--color-accent); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-accent) 20%, transparent); }
        .admin-users-form button {
          align-self: end; border: none; border-radius: 14px; padding: 13px 16px; background: var(--color-accent);
          color: white; font-weight: 800; cursor: pointer;
        }
        .admin-users-form button:disabled { opacity: 0.7; cursor: not-allowed; }
        .admin-users-success, .admin-users-error { margin-top: 14px !important; font-weight: 700; }
        .admin-users-success { color: oklch(0.45 0.14 145) !important; }
        .admin-users-error { color: oklch(0.55 0.20 25) !important; }
        .menu-editor {
          width: 100%;
          display: grid;
          gap: 22px;
          color: var(--color-text);
          font-family: Inter, "Plus Jakarta Sans", var(--font-sans);
        }
        .menu-editor-top {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
        }
        .menu-editor-top h2 {
          margin: 0 0 8px;
          color: var(--color-text);
          font-size: 28px;
          font-weight: 780;
          letter-spacing: 0;
        }
        .menu-editor-top p {
          margin: 0;
          color: var(--color-muted);
          font-size: 14px;
        }
        .menu-stats {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .menu-stats span {
          border: 1px solid color-mix(in oklab, var(--color-line) 70%, transparent);
          border-radius: 999px;
          padding: 7px 10px;
          background: rgba(255,255,255,0.56);
          color: var(--color-muted);
          font-size: 12px;
          font-weight: 750;
        }
        .menu-tabs {
          display: flex;
          gap: 6px;
          width: fit-content;
          padding: 4px;
          border-radius: 999px;
          background: color-mix(in oklab, white 72%, var(--color-accent-soft) 28%);
        }
        .menu-tabs button {
          border: 0;
          border-radius: 999px;
          padding: 9px 14px;
          background: transparent;
          color: var(--color-muted);
          cursor: pointer;
          font-size: 13px;
          font-weight: 760;
          transition: background-color 140ms ease, color 140ms ease, transform 140ms ease, box-shadow 140ms ease;
        }
        .menu-tabs button:hover { color: var(--color-text); transform: translateY(-1px); }
        .menu-tabs button.is-active {
          background: rgba(255,255,255,0.92);
          color: var(--color-text);
          box-shadow: 0 6px 18px rgba(64, 38, 28, 0.06);
        }
        .menu-editor-layout {
          display: grid;
          grid-template-columns: minmax(0, 7fr) minmax(300px, 3fr);
          gap: 28px;
          align-items: start;
        }
        .menu-editor-main {
          display: grid;
          gap: 22px;
          min-width: 0;
        }
        .menu-saas-form, .menu-flat-list {
          display: grid;
          gap: 18px;
          background: rgba(255,255,255,0.52);
          border: 1px solid color-mix(in oklab, var(--color-line) 72%, transparent);
          border-radius: 24px;
          padding: 26px;
          box-shadow: 0 18px 42px rgba(64, 38, 28, 0.035);
        }
        .menu-section-heading {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .menu-section-heading > span {
          display: inline-grid;
          place-items: center;
          width: 30px;
          height: 30px;
          border-radius: 999px;
          background: var(--color-accent-soft);
          color: var(--color-accent);
          font-size: 12px;
          font-weight: 850;
        }
        .menu-section-heading h3 {
          margin: 0;
          color: var(--color-text);
          font-size: 18px;
          font-weight: 780;
        }
        .menu-section-heading p {
          margin: 4px 0 0;
          color: var(--color-muted);
          font-size: 13px;
        }
        .menu-saas-form label {
          display: grid;
          gap: 8px;
        }
        .menu-saas-form label span {
          color: var(--color-muted);
          font-size: 12px;
          font-weight: 780;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .menu-saas-form input,
        .menu-saas-form select,
        .menu-saas-form textarea {
          width: 100%;
          border: 1px solid color-mix(in oklab, var(--color-line) 70%, transparent);
          border-radius: 16px;
          padding: 13px 14px;
          background: rgba(255,255,255,0.74);
          color: var(--color-text);
          outline: none;
          transition: border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
        }
        .menu-saas-form textarea {
          min-height: 100px;
          resize: vertical;
        }
        .menu-saas-form input:focus,
        .menu-saas-form select:focus,
        .menu-saas-form textarea:focus {
          border-color: color-mix(in oklab, var(--color-accent) 58%, white);
          background: white;
          box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-accent) 14%, transparent);
        }
        .menu-two-columns {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .menu-upload {
          min-height: 132px;
          place-items: center;
          text-align: center;
          border: 1px dashed color-mix(in oklab, var(--color-accent) 32%, var(--color-line));
          border-radius: 22px;
          background: linear-gradient(135deg, rgba(255,255,255,0.78), color-mix(in oklab, var(--color-accent-soft) 34%, white));
          cursor: pointer;
          transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
        }
        .menu-upload:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 30px rgba(64, 38, 28, 0.05);
          border-color: var(--color-accent);
        }
        .menu-upload input { display: none; }
        .menu-upload span {
          color: var(--color-text) !important;
          font-size: 14px !important;
          text-transform: none !important;
          letter-spacing: 0 !important;
        }
        .menu-upload small {
          color: var(--color-muted);
          font-size: 12px;
        }
        .menu-primary-action {
          justify-self: start;
          border: 0;
          border-radius: 14px;
          padding: 12px 16px;
          background: var(--color-text);
          color: white;
          cursor: pointer;
          font-weight: 820;
          box-shadow: 0 12px 26px rgba(39, 28, 24, 0.12);
          transition: transform 140ms ease, box-shadow 140ms ease;
        }
        .menu-primary-action:hover { transform: translateY(-1px); box-shadow: 0 16px 32px rgba(39, 28, 24, 0.14); }
        .menu-inline-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto;
          gap: 14px;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid color-mix(in oklab, var(--color-line) 62%, transparent);
        }
        .menu-inline-row:last-child { border-bottom: 0; }
        .menu-inline-row strong {
          display: block;
          color: var(--color-text);
          font-size: 14px;
        }
        .menu-inline-row p {
          margin: 4px 0 0;
          color: var(--color-muted);
          font-size: 12px;
        }
        .menu-inline-row button {
          border: 0;
          border-radius: 999px;
          padding: 8px 11px;
          background: color-mix(in oklab, var(--color-accent-soft) 44%, white);
          color: var(--color-text);
          cursor: pointer;
          font-size: 12px;
          font-weight: 820;
        }
        .menu-status-pill, .menu-category-badge {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          border-radius: 999px;
          padding: 6px 9px;
          background: color-mix(in oklab, var(--color-line) 32%, white);
          color: var(--color-muted);
          font-size: 11px;
          font-weight: 820;
        }
        .menu-status-pill.is-on {
          background: color-mix(in oklab, oklch(0.69 0.14 145) 16%, white);
          color: oklch(0.42 0.12 145);
        }
        .menu-preview-panel {
          position: sticky;
          top: 24px;
          display: grid;
          gap: 14px;
          border-radius: 26px;
          padding: 20px;
          background: rgba(255,255,255,0.58);
          border: 1px solid color-mix(in oklab, var(--color-line) 70%, transparent);
          box-shadow: 0 22px 44px rgba(64, 38, 28, 0.045);
        }
        .menu-pos-card {
          overflow: hidden;
          border-radius: 24px;
          background: white;
          box-shadow: 0 16px 34px rgba(64, 38, 28, 0.055);
        }
        .menu-pos-image {
          height: 178px;
          display: grid;
          place-items: center;
          background:
            linear-gradient(135deg, color-mix(in oklab, var(--color-accent-soft) 65%, white), rgba(255,255,255,0.86)),
            radial-gradient(circle at 20% 20%, var(--color-accent-soft), transparent 46%);
        }
        .menu-pos-image span {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: rgba(255,255,255,0.82);
          color: var(--color-accent);
          font-weight: 900;
        }
        .menu-pos-body {
          display: grid;
          gap: 12px;
          padding: 18px;
        }
        .menu-pos-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .menu-pos-body h3 {
          margin: 0;
          color: var(--color-text);
          font-size: 20px;
          font-weight: 820;
        }
        .menu-pos-body p {
          margin: 0;
          color: var(--color-muted);
          font-size: 13px;
          line-height: 1.5;
        }
        .menu-pos-body strong {
          color: var(--color-accent);
          font-size: 28px;
          letter-spacing: 0;
        }
        .menu-pos-meta {
          display: grid;
          gap: 8px;
        }
        .menu-pos-meta span {
          color: var(--color-muted);
          font-size: 12px;
        }
        .menu-inventory-empty {
          border-radius: 20px;
          padding: 22px;
          background: rgba(255,255,255,0.62);
        }
        .menu-inventory-empty strong {
          display: block;
          color: var(--color-text);
          margin-bottom: 6px;
        }
        @media (max-width: 1180px) {
          .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .top-header { align-items: flex-start; flex-direction: column; }
          .top-header-right { width: 100%; justify-content: flex-start; }
          .menu-editor-layout { grid-template-columns: 1fr; }
          .menu-preview-panel { position: static; }
        }
        @media (max-width: 920px) {
          .dashboard-layout { grid-template-columns: 1fr; }
          .dashboard-sidebar {
            min-height: auto;
            border-right: 0;
            border-bottom: 1px solid var(--color-line);
            padding: 18px;
          }
          .dashboard-sidebar nav {
            display: flex !important;
            gap: 8px;
            overflow-x: auto;
            padding-bottom: 2px;
          }
        }
        @media (max-width: 640px) {
          .dashboard-main { padding: 16px; gap: 16px; }
          .dashboard-layout { min-height: 100vh; }
          .top-header { padding: 16px; border-radius: 22px; }
          .search-wrap { min-width: 100%; width: 100%; }
          .top-header-right { width: 100%; }
          .user-chip { width: 100%; border-radius: 20px; justify-content: flex-start; }
          .kpi-grid { grid-template-columns: 1fr; }
          .content-panel { padding: 16px; min-height: 420px; }
          .location-title { font-size: 24px; }
          .admin-users-form { grid-template-columns: 1fr; }
          .menu-editor-top { align-items: flex-start; flex-direction: column; }
          .menu-tabs { width: 100%; overflow-x: auto; }
          .menu-two-columns { grid-template-columns: 1fr; }
          .menu-saas-form, .menu-flat-list { padding: 18px; border-radius: 20px; }
          .menu-inline-row { grid-template-columns: 1fr; align-items: start; }
        }
      `}</style>

      <div className="app-shell">
        <div className="app-frame">
          <div className="dashboard-layout">
            <aside className="dashboard-sidebar">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, padding: "6px 4px 12px" }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: `linear-gradient(135deg, ${T.accentSoft} 0%, rgba(255,255,255,0.95) 100%)`, border: `1px solid ${T.line}`, display: "grid", placeItems: "center", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M7 6.5h8.5a3.5 3.5 0 1 1 0 7H10" stroke={T.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 10.2h7a3.65 3.65 0 1 1 0 7.3H8.8" stroke={T.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: T.fontDisplay, fontSize: 22, lineHeight: 1, color: T.text }}>TechFlavor</div>
                  <div style={{ marginTop: 4, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted }}>Restaurant OS</div>
                </div>
              </div>

              <nav style={{ display: "grid", gap: 8 }}>
                {sidebarItems.map((item) => (
                  <SidebarItem
                    key={item.path}
                    active={item.path === currentPath}
                    disabled={item.disabled}
                    label={item.label}
                    icon={item.icon}
                    onClick={() => {
                      if (!item.disabled) onNavigate(item.path);
                    }}
                  />
                ))}
              </nav>
            </aside>

            <main className="dashboard-main">
              <header className="top-header">
                <div className="top-header-left">
                  <div className="location-badge" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M12 20s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10Z" stroke={T.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="10" r="2.2" fill={T.accent} />
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
                      <path d="m21 21-4.35-4.35M10.8 18a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4Z" stroke={T.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

              <section className="kpi-grid" aria-label="Metricas principales">
                {kpis.map((item) => (
                  <article className="kpi-card" key={item.label}>
                    <div className="kpi-top">
                      <span className="kpi-label">{item.label}</span>
                      <span className="kpi-tone" style={{ color: item.tone, background: item.tone }} />
                    </div>
                    <p className="kpi-value">{item.value}</p>
                    <p className="kpi-subtext">{item.subtext}</p>
                  </article>
                ))}
              </section>

              <section className="content-panel" aria-label="Contenido futuro del dashboard">
                {children || (
                  <div className="content-placeholder">
                  <div>
                    <h2>Espacio listo para modulos futuros</h2>
                    <p>Aqui insertaremos tablas, graficos operativos, actividad de cocina o desempeno por mesero manteniendo la misma jerarquia visual.</p>
                  </div>
                  </div>
                )}
              </section>
            </main>
          </div>
        </div>
      </div>
    </>
  );
};
