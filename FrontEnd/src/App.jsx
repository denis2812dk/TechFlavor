import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { getSession, signOut } from "./lib/auth";
import { ROLE_HOME_PATHS, ROLES } from "./lib/constants/roles";
import { RegisterRestaurant } from "./views/public/RegisterRestaurant";
// Vistas del Restaurante
import { InventoryManagement } from "./views/manager/InventoryManagement";
import { MenuManagement } from "./views/manager/MenuManagement";
import { UserManagement } from "./views/manager/UserManagement";
import { PromotionsManagement } from "./views/manager/PromotionsManagement";
import { SalonManagement } from "./views/manager/SalonManagement";
import { CashierCatalog } from "./views/cashier/CashierCatalog";
import { DispatchOrders } from "./views/dispatch/DispatchOrders";
import { KitchenDisplay } from "./views/kitchen/KitchenDisplay";
import { OrdersList } from "./views/orders/OrdersList";
import Login from "./views/shared/Login.jsx";
import { RoleDashboard } from "./views/shared/RoleDashboard";
import { SaaSManagement } from "./views/admin/SaaSManagement";
import { SaaSRestaurants } from "./views/admin/SaaSRestaurants";
import { ProfileEdit } from "./views/shared/ProfileEdit";
import { OperationalOverview } from "./views/shared/OperationalOverview";

const ROUTES = {
  // ==========================================
  // RUTAS DEL CEREBRO CENTRAL (SaaS)
  // ==========================================
  "/admin": {
    roles: [ROLES.ADMIN],
    title: "SaaS Dashboard",
    description: "Gestión de suscripciones, nuevos clientes y estado de la plataforma.",
  },
  "/admin/saas": {
    roles: [ROLES.ADMIN],
    title: "Solicitudes SaaS",
    description: "Aprobación y rechazo de nuevos restaurantes.",
  },
  "/admin/restaurants": {
    roles: [ROLES.ADMIN],
    title: "Restaurantes activos",
    description: "Listado de clientes activos de la plataforma.",
  },
  "/perfil": {
    roles: Object.values(ROLES),
    title: "Mi Perfil",
    description: "Actualiza tu información personal y configuración de cuenta.",
  },

  // ==========================================
  // RUTAS DEL GERENTE (Antes "Manager")
  // ==========================================
  "/gerente": {
    roles: [ROLES.GERENTE],
    title: "Panel gerente",
    description: "Supervisión operativa, equipo y reportes del restaurante.",
  },
  "/gerente/users": {
    roles: [ROLES.GERENTE],
    title: "Usuarios",
    description: "Creación de empleados y asignación de roles.",
  },
  "/gerente/menu": {
    roles: [ROLES.GERENTE],
    title: "Menú",
    description: "Categorías, productos y combos disponibles para caja.",
  },
  "/gerente/inventory": {
    roles: [ROLES.GERENTE],
    title: "Inventario",
    description: "Control de insumos, existencias y registro de merma.",
  },
  "/gerente/salon": {
    roles: [ROLES.GERENTE],
    title: "Salon",
    description: "Configuracion de zonas y mesas del restaurante.",
  },
  "/gerente/promotions": {
    roles: [ROLES.GERENTE],
    title: "Promociones",
    description: "Descuentos temporales y reglas especiales.",
  },
  "/gerente/orders": {
    roles: [ROLES.GERENTE],
    title: "Órdenes",
    description: "Historial de pedidos, tickets y estados operativos.",
  },

  // ==========================================
  // RUTAS OPERATIVAS (Restaurante)
  // ==========================================
  "/cajero": {
    roles: [ROLES.CAJERO],
    title: "Panel caja",
    description: "Cobros, cuentas abiertas, cierres de turno y pagos.",
  },
  "/cajero/orders": {
    roles: [ROLES.CAJERO],
    title: "Órdenes Activas",
    description: "Pedidos generados desde caja y seguimiento del ticket.",
  },
  "/cocina": {
    roles: [ROLES.COCINA],
    title: "KDS cocina",
    description: "Pedidos entrantes, preparación y estados de cocina.",
  },
  "/cocina/orders": {
    roles: [ROLES.COCINA, ROLES.GERENTE],
    title: "Órdenes cocina",
    description: "Lista de órdenes para la cocina.",
  },
  "/despacho": {
    roles: [ROLES.DESPACHO],
    title: "Panel despacho",
    description: "Órdenes listas, entregas y seguimiento de salida.",
  },
  "/operador": {
    roles: [ROLES.OPERADOR],
    title: "Panel operador",
    description: "Operación diaria del restaurante y atención de pedidos.",
  },
};

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

function App() {
  const [session, setSession] = useState(null);
  const [path, setPath] = useState(window.location.pathname);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useCallback((nextPath) => {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  }, []);

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
    const nextPath = currentSession?.user?.role === ROLES.ADMIN
      ? "/admin/restaurants"
      : ROLE_HOME_PATHS[currentSession?.user?.role] || "/operador";
    navigate(nextPath);
  };

  const handleLogout = () => {
    setSession(null);
    navigate("/login");
  };

  const logoutByInactivity = useCallback(async () => {
    await signOut();
    setSession(null);
    navigate("/login");
  }, [navigate]);

  useEffect(() => {
    // Call loadSession inside an async IIFE to avoid setting state
    // synchronously during render/effect initialization.
    (async () => {
      await loadSession();
    })();
  }, []);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (isLoading || !session?.user) return;
    // Si la ruta es pública o la raíz, redirigir según el rol
    if (path === "/" || path === "/login" || path === "/register") {
      const nextPath = session.user.role === ROLES.ADMIN ? "/admin/restaurants" : ROLE_HOME_PATHS[session.user.role] || "/operador";
      const redirectTimeout = window.setTimeout(() => {
        navigate(nextPath);
      }, 0);
      return () => window.clearTimeout(redirectTimeout);
    }
  }, [isLoading, navigate, path, session]);

  useEffect(() => {
    if (!session?.user || path === "/login" || path === "/" || path === "/register") return undefined;

    let timeoutId;
    const resetInactivityTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        logoutByInactivity();
      }, INACTIVITY_TIMEOUT_MS);
    };

    resetInactivityTimer();
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    });

    return () => {
      window.clearTimeout(timeoutId);
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
    };
  }, [logoutByInactivity, path, session?.user]);

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

  // ==========================================
  // RUTAS PÚBLICAS (No requieren sesión)
  // ==========================================
  if (path === "/register") {
    if (session?.user) return null; // El useEffect lo redirigirá
    return <RegisterRestaurant onNavigate={navigate} />;
  }

  if (path === "/" || path === "/login") {
    if (session?.user) return null;
    return <Login onLogin={handleLogin} onRegister={() => navigate("/register")} />;
  }

  // ==========================================
  // RUTAS PROTEGIDAS
  // ==========================================
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
    <ProtectedRoute
      allowedRoles={route.roles}
      session={session}
      onLogin={handleLogin}
      onRegister={() => navigate("/register")}
    >
      <RoleDashboard
        title={route.title}
        description={route.description}
        session={session}
        onLogout={handleLogout}
        currentPath={path}
        onNavigate={navigate}
      >
        {/* VISTAS DEL SAAS ADMIN */}
        {path === "/admin" ? (
          <div className="container py-4">
            <div className="row justify-content-center">
              <div className="col-12 col-lg-10 col-xl-8">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-4 p-md-5">
                    <p className="text-uppercase text-muted fw-semibold small mb-2">Panel admin</p>
                    <h2 className="h3 fw-bold mb-3">Bienvenido al centro de control SaaS</h2>
                    <p className="text-muted mb-4">
                      Desde aquí puedes revisar las solicitudes de nuevos restaurantes y avanzar a la vista de gestión.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      onClick={() => navigate("/admin/saas")}
                    >
                      Abrir vista SaaSManagement
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {path === "/admin/saas" ? <SaaSManagement /> : null}
        {path === "/admin/restaurants" ? <SaaSRestaurants /> : null}

        {/* VISTAS COMPARTIDAS */}
        {path === "/perfil" ? <ProfileEdit session={session} onRefresh={loadSession} /> : null}

        {/* VISTAS DEL GERENTE */}
        {path === "/gerente" ? <OperationalOverview /> : null}
        {path === "/gerente/users" ? <UserManagement /> : null}
        {path === "/gerente/menu" ? <MenuManagement /> : null}
        {path === "/gerente/salon" ? <SalonManagement /> : null}
        {path === "/gerente/inventory" ? <InventoryManagement /> : null}
        {path === "/gerente/promotions" ? <PromotionsManagement /> : null}
        {path === "/gerente/orders" ? <OrdersList /> : null}

        {/* VISTAS OPERATIVAS */}
        {path === "/cajero/orders" ? <OrdersList /> : null}
        {path === "/cajero" ? <CashierCatalog /> : null}
        {path === "/cocina" ? <KitchenDisplay /> : null}
        {path === "/cocina/orders" ? <OrdersList /> : null}
        {path === "/despacho" ? <DispatchOrders /> : null}
        {path === "/operador" ? <OperationalOverview /> : null}
      </RoleDashboard>
    </ProtectedRoute>
  );
}

export default App;