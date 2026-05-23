import { useState } from "react";
import { submitRestaurantRequest } from "../../lib/public";

const initialForm = {
  restaurantName: "",
  ownerName: "",
  email: "",
  phone: "",
  planRequested: "pro",
  notes: ""
};

export const RegisterRestaurant = ({ onNavigate }) => {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle"); 
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      await submitRestaurantRequest(form);
      setStatus("success");
    } catch (error) {
      setErrorMessage(error.message);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <main className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="card border-0 shadow-sm p-4 p-md-5 text-center" style={{ maxWidth: "500px" }}>
          <div className="mb-4 d-flex justify-content-center">
            <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "80px", height: "80px", fontSize: "2.5rem" }}>
              ✓
            </div>
          </div>
          <h2 className="h3 mb-3 fw-bold text-dark">¡Solicitud Recibida!</h2>
          <p className="text-muted mb-4">
            Hemos recibido los datos de <strong>{form.restaurantName}</strong>. 
            Nuestro equipo revisará tu solicitud y se pondrá en contacto contigo 
            a través de <strong>{form.email}</strong> para la activación de tu cuenta.
          </p>
          <button type="button" className="btn btn-primary btn-lg w-100 fw-semibold" onClick={() => onNavigate("/login")}>
            Volver al Inicio
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-vh-100 row g-0">
      {/* Columna Izquierda: Branding (Oculta en móviles, visible desde lg) */}
      <section className="col-lg-5 d-none d-lg-flex flex-column justify-content-center p-5 text-white" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)" }}>
        <div className="mx-auto" style={{ maxWidth: "480px" }}>
          <h1 className="display-5 fw-bolder mb-4" style={{ color: "#ea580c" }}>TechFlavor</h1>
          <h2 className="h2 fw-bold mb-3">El sistema operativo para tu restaurante.</h2>
          <p className="lead text-light opacity-75 mb-5">
            Lleva el control total de tus ventas, inventarios y cocina en un solo lugar.
          </p>
          
          <ul className="list-unstyled d-flex flex-column gap-3 fs-5">
            <li><span className="text-success fw-bold me-2">✓</span> Punto de venta (POS) súper rápido</li>
            <li><span className="text-success fw-bold me-2">✓</span> KDS en tiempo real</li>
            <li><span className="text-success fw-bold me-2">✓</span> Control de inventarios y recetas exactas</li>
            <li><span className="text-success fw-bold me-2">✓</span> Gestión de roles, cajas y reportes</li>
          </ul>
        </div>
      </section>

      {/* Columna Derecha: Formulario */}
      <section className="col-12 col-lg-7 d-flex align-items-center justify-content-center p-4 p-md-5 bg-light">
        <div className="card border-0 shadow-sm w-100 p-4 p-md-5" style={{ maxWidth: "550px" }}>
          <div className="text-center mb-4">
            <h3 className="fw-bold text-dark mb-2">Solicita tu acceso</h3>
            <p className="text-muted">Déjanos tus datos y te ayudaremos a configurar tu cuenta.</p>
          </div>

          {status === "error" && (
            <div className="alert alert-danger text-center fw-medium" role="alert">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-12">
              <label htmlFor="restaurantName" className="form-label fw-semibold text-secondary small">Nombre del Restaurante *</label>
              <input type="text" className="form-control form-control-lg fs-6" id="restaurantName" name="restaurantName" required value={form.restaurantName} onChange={handleChange} placeholder="Ej. La Pizzería de Juan" />
            </div>

            <div className="col-12">
              <label htmlFor="ownerName" className="form-label fw-semibold text-secondary small">Tu Nombre Completo *</label>
              <input type="text" className="form-control form-control-lg fs-6" id="ownerName" name="ownerName" required value={form.ownerName} onChange={handleChange} placeholder="Ej. Juan Pérez" />
            </div>

            <div className="col-md-6">
              <label htmlFor="email" className="form-label fw-semibold text-secondary small">Correo Electrónico *</label>
              <input type="email" className="form-control form-control-lg fs-6" id="email" name="email" required value={form.email} onChange={handleChange} placeholder="juan@pizzeria.com" />
            </div>

            <div className="col-md-6">
              <label htmlFor="phone" className="form-label fw-semibold text-secondary small">Teléfono / WhatsApp</label>
              <input type="tel" className="form-control form-control-lg fs-6" id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="Ej. 7777-8888" />
            </div>

            <div className="col-12">
              <label htmlFor="planRequested" className="form-label fw-semibold text-secondary small">Plan de Interés</label>
              <select className="form-select form-select-lg fs-6" id="planRequested" name="planRequested" value={form.planRequested} onChange={handleChange}>
                <option value="starter">Starter (Ideal para negocios pequeños)</option>
                <option value="pro">Pro (Ideal para franquicias o sucursales)</option>
              </select>
            </div>

            <div className="col-12">
              <label htmlFor="notes" className="form-label fw-semibold text-secondary small">¿Alguna duda o requerimiento especial?</label>
              <textarea className="form-control form-control-lg fs-6" id="notes" name="notes" rows="2" value={form.notes} onChange={handleChange} placeholder="Ej. Necesito facturación electrónica integrada..." />
            </div>

            <div className="col-12 mt-4">
              <button type="submit" className="btn btn-primary btn-lg w-100 fw-semibold" style={{ backgroundColor: "#ea580c", borderColor: "#ea580c" }} disabled={status === "submitting"}>
                {status === "submitting" ? "Enviando solicitud..." : "Enviar Solicitud"}
              </button>
            </div>
            
            <div className="col-12 text-center mt-3">
              <span className="text-muted small">¿Ya tienes una cuenta? </span>
              <button type="button" className="btn btn-link p-0 text-decoration-none fw-semibold small" style={{ color: "#ea580c" }} onClick={() => onNavigate("/login")}>
                Inicia sesión aquí
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
};