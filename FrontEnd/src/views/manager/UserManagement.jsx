import { useEffect, useMemo, useState } from "react";
import { createTenantUser, deleteTenantUser, getErrorMessage, listTenantUsers, updateTenantUser } from "../../lib/auth";
import { ROLES } from "../../lib/constants/roles";

const ROLE_OPTIONS = [
  { value: ROLES.CAJERO, label: "Cajero" },
  { value: ROLES.COCINA, label: "Cocina / KDS" },
  { value: ROLES.DESPACHO, label: "Despacho" },
  { value: ROLES.GERENTE, label: "Gerente" },
];

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: ROLES.CAJERO,
};

const roleLabels = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.GERENTE]: "Gerente",
  [ROLES.CAJERO]: "Cajero",
  [ROLES.COCINA]: "Cocina",
  [ROLES.DESPACHO]: "Despacho",
  [ROLES.OPERADOR]: "Operador",
};

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

export const UserManagement = () => {
  const [form, setForm] = useState(initialForm);
  const [employees, setEmployees] = useState([]);
  const [restaurantName, setRestaurantName] = useState("Restaurante");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch = !query
        || employee.name.toLowerCase().includes(query)
        || employee.email.toLowerCase().includes(query)
        || employee.tenantRole.toLowerCase().includes(query);
      const matchesRole = roleFilter === "all" || employee.tenantRole === roleFilter;
      const matchesStatus = statusFilter === "all" || employee.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [employees, roleFilter, searchQuery, statusFilter]);

  const loadUsers = async () => {
    try {
      const data = await listTenantUsers();
      setEmployees(data.users || []);
      setRestaurantName(data.restaurant?.name || "Restaurante");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openCreateModal = () => {
    setForm(initialForm);
    setError("");
    setStatus("");
    setShowCreatePassword(false);
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setForm(initialForm);
    setError("");
    setShowCreatePassword(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    setError("");
    setIsSaving(true);

    try {
      const result = await createTenantUser(form);
      setStatus(`${result.user.name} fue creado para ${restaurantName}.`);
      closeCreateModal();
      await loadUsers();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (employee) => {
    setEditingUser({ ...employee });
    setActiveMenu(null);
  };

  const handleDeleteClick = async (employee) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${employee.name}?`)) {
      try {
        await deleteTenantUser(employee.id);
        setStatus(`${employee.name} fue eliminado.`);
        await loadUsers();
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      }
    }
    setActiveMenu(null);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    try {
      await updateTenantUser(editingUser.id, {
        name: editingUser.name,
        role: editingUser.tenantRole,
        status: editingUser.status
      });
      setStatus(`${editingUser.name} fue actualizado.`);
      setEditingUser(null);
      await loadUsers();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <section className="users-console">
      <header className="users-console-head">
        <div>
          <h2>User Management</h2>
          <p>Manage your restaurant team members, roles, and permissions</p>
        </div>
        <button className="users-primary-action" type="button" onClick={openCreateModal}>
          <span>+</span>
          Add User
        </button>
      </header>

      <div className="users-toolbar">
        <label className="users-local-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m21 21-4.35-4.35M10.8 18a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search users by name, email, or phone..."
          />
        </label>

        <select className="users-filter-select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filtrar por rol">
          <option value="all">All Roles</option>
          {ROLE_OPTIONS.map((role) => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>

        <select className="users-filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar por estado">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="users-management-shell">
        {status && <p className="admin-users-success">{status}</p>}
        {error && <p className="admin-users-error">{error}</p>}

        <div className="users-table-scroll">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Last Active</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className="users-name-cell">
                      <span>{employee.name.slice(0, 2).toUpperCase()}</span>
                      <div>
                        <strong>{employee.name}</strong>
                        <small>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M4 6.5h16v11H4v-11Zm0 0 8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {employee.email}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="users-contact">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M8.5 5.5 6.8 3.8a1.4 1.4 0 0 0-2 .1L3.5 5.5c-.5.6-.6 1.4-.3 2.1 2 4.8 5.8 8.6 10.6 10.6.7.3 1.5.2 2.1-.3l1.6-1.3a1.4 1.4 0 0 0 .1-2l-1.7-1.7a1.4 1.4 0 0 0-1.7-.2l-1.2.7a10.3 10.3 0 0 1-4.4-4.4l.7-1.2a1.4 1.4 0 0 0-.2-1.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {employee.phone || "Sin telefono"}
                    </span>
                  </td>
                  <td>
                    <span className={`users-role-badge role-${employee.tenantRole}`}>
                      {roleLabels[employee.tenantRole] || employee.tenantRole}
                    </span>
                  </td>
                  <td>
                    <span className="users-contact">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {formatDate(employee.createdAt)}
                    </span>
                  </td>
                  <td>
                    <span className="users-status-text">
                      <i aria-hidden="true" />
                      {employee.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ position: "relative" }}>
                      <button
                        className="users-row-menu"
                        type="button"
                        aria-label={`Acciones para ${employee.name}`}
                        onClick={() => setActiveMenu(activeMenu === employee.id ? null : employee.id)}
                      >
                        ⋮
                      </button>
                      {activeMenu === employee.id && (
                        <div style={{ position: "absolute", right: "100%", top: "0", background: "white", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", zIndex: 10, minWidth: "120px", display: "flex", flexDirection: "column", gap: "4px" }}>
                          <button type="button" style={{ textAlign: "left", padding: "6px 12px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "4px", fontSize: "14px" }} onClick={() => handleEditClick(employee)}>Editar</button>
                          <button type="button" style={{ textAlign: "left", padding: "6px 12px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "4px", fontSize: "14px", color: "#ef4444" }} onClick={() => handleDeleteClick(employee)}>Eliminar</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredEmployees.length === 0 && (
                <tr>
                  <td className="users-empty-row" colSpan={6}>
                    No hay empleados que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Crear usuario"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 20px 40px rgba(15, 23, 42, 0.2)",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: 0 }}>Crear usuario</h3>
                <p style={{ margin: "0.35rem 0 0", color: "#64748b", fontSize: "0.9rem" }}>
                  Agrega un nuevo miembro para {restaurantName}.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                style={{ border: "none", background: "transparent", fontSize: "1.2rem", cursor: "pointer" }}
                aria-label="Cerrar"
              >
                x
              </button>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off">
              <div style={{ display: "grid", gap: "0.8rem" }}>
                <label style={{ display: "grid", gap: "0.35rem" }}>
                  <span>Nombre completo</span>
                  <input
                    name="tenant-user-name"
                    type="text"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    required
                    autoComplete="off"
                    autoFocus
                    style={{ border: "1px solid #cbd5e1", borderRadius: "10px", padding: "0.6rem 0.75rem" }}
                  />
                </label>

                <label style={{ display: "grid", gap: "0.35rem" }}>
                  <span>Correo</span>
                  <input
                    name="tenant-user-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    required
                    autoComplete="off"
                    style={{ border: "1px solid #cbd5e1", borderRadius: "10px", padding: "0.6rem 0.75rem" }}
                  />
                </label>

                <label style={{ display: "grid", gap: "0.35rem" }}>
                  <span>Contrasena temporal</span>
                  <div style={{ position: "relative" }}>
                    <input
                      name="tenant-user-password"
                      type={showCreatePassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) => updateField("password", event.target.value)}
                      minLength={8}
                      required
                      autoComplete="new-password"
                      style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "0.6rem 2.9rem 0.6rem 0.75rem" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword((current) => !current)}
                      style={{
                        position: "absolute",
                        right: "0.5rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        border: "none",
                        background: "transparent",
                        color: "#475569",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      aria-label={showCreatePassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showCreatePassword ? "Ocultar" : "Ver"}
                    </button>
                  </div>
                </label>

                <label style={{ display: "grid", gap: "0.35rem" }}>
                  <span>Rol</span>
                  <select
                    value={form.role}
                    onChange={(event) => updateField("role", event.target.value)}
                    required
                    style={{ border: "1px solid #cbd5e1", borderRadius: "10px", padding: "0.6rem 0.75rem" }}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isSaving}
                  style={{ borderRadius: "10px", border: "1px solid #cbd5e1", background: "#fff", padding: "0.55rem 0.9rem", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} style={{ borderRadius: "10px", border: "1px solid #ea580c", background: "#ea580c", color: "#fff", padding: "0.55rem 1rem", fontWeight: 600, cursor: "pointer" }}>
                  {isSaving ? "Guardando..." : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Editar usuario"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 20px 40px rgba(15, 23, 42, 0.2)",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0 }}>Editar usuario</h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                style={{ border: "none", background: "transparent", fontSize: "1.2rem", cursor: "pointer" }}
                aria-label="Cerrar"
              >
                x
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: "grid", gap: "0.8rem" }}>
                <label style={{ display: "grid", gap: "0.35rem" }}>
                  <span>Nombre completo</span>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(event) => setEditingUser((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                </label>

                <label style={{ display: "grid", gap: "0.35rem" }}>
                  <span>Rol</span>
                  <select
                    value={editingUser.tenantRole}
                    onChange={(event) => setEditingUser((current) => ({ ...current, tenantRole: event.target.value }))}
                    required
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "grid", gap: "0.35rem" }}>
                  <span>Estado</span>
                  <select
                    value={editingUser.status}
                    onChange={(event) => setEditingUser((current) => ({ ...current, status: event.target.value }))}
                    required
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setEditingUser(null)}>
                  Cancelar
                </button>
                <button type="submit">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};