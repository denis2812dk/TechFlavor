import { signOut } from "../../lib/auth";
import "./shared.css";
import { Sidebar } from "../../components/layout/Sidebar";
import { Navbar } from "../../components/layout/Navbar";
import { OperationalOverview } from "./OperationalOverview";

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

  return (
    <div className="app-shell">
      <div className="app-frame">
        <div className="dashboard-layout">
          <Sidebar
            currentPath={currentPath}
            onNavigate={onNavigate}
            userName={userName}
            userRole={userRole}
            initials={initials}
          />

          <main className="dashboard-main">
            <Navbar
              title={title}
              description={description}
              userName={userName}
              userRole={userRole}
              initials={initials}
              onLogout={handleLogout}
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
