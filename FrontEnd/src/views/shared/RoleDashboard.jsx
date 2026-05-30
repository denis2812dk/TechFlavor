import { signOut } from "../../lib/auth";
import "./shared.css";
import { Sidebar } from "../../components/layout/Sidebar";
import { AdminSidebar } from "../../components/layout/AdminSidebar";
import { Navbar } from "../../components/layout/Navbar";
import { OperationalOverview } from "./OperationalOverview";

export const RoleDashboard = ({ title, description, session, settings, onLogout, children, currentPath, onNavigate }) => {
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

  return (
    <div className="app-shell">
      <div className="app-frame">
        <div className="dashboard-layout">
          {userRole === "admin" ? (
            <AdminSidebar
              currentPath={currentPath}
              onNavigate={onNavigate}
              userName={userName}
              userRole={userRole}
              initials={initials}
              settings={settings}
            />
          ) : (
            <Sidebar
              currentPath={currentPath}
              onNavigate={onNavigate}
              userName={userName}
              userRole={userRole}
              initials={initials}
              settings={settings}
            />
          )}

          <main className="dashboard-main">
            <Navbar
              title={title}
              description={description}
              userName={userName}
              userRole={userRole}
              initials={initials}
              onLogout={handleLogout}
              onNavigate={onNavigate}
              settings={settings}
            />

            <section className="content-panel" aria-label="Contenido futuro del dashboard">
              {children || <OperationalOverview />}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};
