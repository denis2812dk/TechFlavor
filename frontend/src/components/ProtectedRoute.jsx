import Login from "../views/shared/Login";

export const ProtectedRoute = ({ allowedRoles, children, session, onLogin }) => {
  if (!session?.user) {
    return <Login onLogin={onLogin} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(session.user.role)) {
    return (
      <main className="tf-empty-page">
        <section className="tf-empty-card">
          <p className="tf-kicker">Acceso denegado</p>
          <h1>No tienes permiso para ver esta pantalla</h1>
          <p>Tu rol actual es {session.user.role}. Pide acceso a un administrador si necesitas entrar aqui.</p>
        </section>
      </main>
    );
  }

  return children;
};
