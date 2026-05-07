import { useState } from "react";
import { createTenantUser, getErrorMessage } from "../../lib/auth";
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

export const UserManagement = () => {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    setError("");
    setIsSaving(true);

    try {
      const result = await createTenantUser(form);
      setStatus(`${result.user.name} fue creado para este restaurante.`);
      setForm(initialForm);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="admin-users-panel">
      <div>
        <p className="admin-users-kicker">Administracion de empleados</p>
        <h2>Crear usuario del restaurante</h2>
        <p>
          El empleado queda asociado al mismo restaurante del administrador que lo crea.
        </p>
      </div>

      <form className="admin-users-form" onSubmit={handleSubmit}>
        <label>
          <span>Nombre</span>
          <input
            type="text"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Ej. Mario Lopez"
          />
        </label>

        <label>
          <span>Nombre de acceso</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="empleado@restaurante.com"
          />
        </label>

        <label>
          <span>Contrasena inicial</span>
          <input
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            placeholder="Minimo 8 caracteres"
          />
        </label>

        <label>
          <span>Rol</span>
          <select value={form.role} onChange={(event) => updateField("role", event.target.value)}>
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={isSaving}>
          {isSaving ? "Creando..." : "Crear usuario"}
        </button>
      </form>

      {status && <p className="admin-users-success">{status}</p>}
      {error && <p className="admin-users-error">{error}</p>}
    </section>
  );
};
