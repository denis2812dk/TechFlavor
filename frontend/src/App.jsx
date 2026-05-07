import { useEffect, useState } from "react";
import "./App.css";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { getSession } from "./lib/auth";
import { ROLE_HOME_PATHS, ROLES } from "./lib/constants/roles";
import { MenuManagement } from "./views/admin/MenuManagement";
import { UserManagement } from "./views/admin/UserManagement";
import { CashierCatalog } from "./views/cashier/CashierCatalog";
import Login from "./views/shared/Login.jsx";
import { RoleDashboard } from "./views/shared/RoleDashboard";

const ROUTES = {
  "/admin": {
    roles: [ROLES.ADMIN],
    title: "Panel administrador",
    description: "Gestion de usuarios, configuracion general y control del restaurante.",
  },
  "/admin/users": {
    roles: [ROLES.ADMIN],
    title: "Usuarios",
    description: "Creacion de empleados y asignacion de roles por restaurante.",
  },
  "/admin/menu": {
    roles: [ROLES.ADMIN],
    title: "Menu",
    description: "Categorias, productos y combos disponibles para caja.",
  },
  "/cajero": {
    roles: [ROLES.CAJERO, ROLES.ADMIN],
    title: "Panel caja",
    description: "Cobros, cuentas abiertas, cierres de turno y pagos.",
  },
  "/cocina": {
    roles: [ROLES.COCINA, ROLES.ADMIN],
    title: "KDS cocina",
    description: "Pedidos entrantes, preparacion y estados de cocina.",
  },
  "/despacho": {
    roles: [ROLES.DESPACHO, ROLES.ADMIN],
    title: "Panel despacho",
    description: "Ordenes listas, entregas y seguimiento de salida.",
  },
  "/operador": {
    roles: [ROLES.OPERADOR, ROLES.ADMIN],
    title: "Panel operador",
    description: "Operacion diaria del restaurante y atencion de pedidos.",
  },
  "/gerente": {
    roles: [ROLES.GERENTE, ROLES.ADMIN],
    title: "Panel gerente",
    description: "Supervision operativa, equipo y reportes del restaurante.",
  },
  "/gerente/menu": {
    roles: [ROLES.GERENTE, ROLES.ADMIN],
    title: "Menu",
    description: "Categorias, productos y combos disponibles para caja.",
  },
};

function App() {
  const [session, setSession] = useState(null);
  const [path, setPath] = useState(window.location.pathname);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = (nextPath) => {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  };

  const loadSession = async () => {
    try {
      const currentSession = await getSession();
      setSession(currentSession);
      return currentSession;
    } catch (error) {
      console.error("No se pudo cargar la sesion:", error);
      setSession(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    const currentSession = await loadSession();
    const nextPath = ROLE_HOME_PATHS[currentSession?.user?.role] || "/operador";
    navigate(nextPath);
  };

  const handleLogout = () => {
    setSession(null);
    navigate("/login");
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSession();
  }, []);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (isLoading || !session?.user) return;
    if (path !== "/" && path !== "/login") return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    navigate(ROLE_HOME_PATHS[session.user.role] || "/operador");
  }, [isLoading, path, session]);

  if (isLoading) {
    return (
      <main className="tf-empty-page">
        <section className="tf-empty-card">
          <p className="tf-kicker">TechFlavor</p>
          <h1>Cargando sesion...</h1>
        </section>
      </main>
    );
  }

  if (path === "/" || path === "/login") {
    if (session?.user) {
      return null;
    }

    return <Login onLogin={handleLogin} />;
  }

  const route = ROUTES[path];

  if (!route) {
    return (
      <main className="tf-empty-page">
        <section className="tf-empty-card">
          <p className="tf-kicker">Ruta no encontrada</p>
          <h1>Esta pantalla todavia no existe</h1>
          <button type="button" onClick={() => navigate(session?.user ? ROLE_HOME_PATHS[session.user.role] : "/login")}>
            Volver
          </button>
        </section>
      </main>
    );
  }

  return (
    <ProtectedRoute allowedRoles={route.roles} session={session} onLogin={handleLogin}>
      <RoleDashboard
        title={route.title}
        description={route.description}
        session={session}
        onLogout={handleLogout}
        currentPath={path}
        onNavigate={navigate}
      >
        {path === "/admin/users" ? <UserManagement /> : null}
        {path === "/admin/menu" || path === "/gerente/menu" ? <MenuManagement /> : null}
        {path === "/cajero" ? <CashierCatalog /> : null}
      </RoleDashboard>
    </ProtectedRoute>
  );
}

export default App;
