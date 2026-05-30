import { useEffect, useState } from "react";
import { getMyShift, openMyShift, addMovement, getMovements, closeMyShift } from "../../lib/cash";
import { getErrorMessage } from "../../lib/auth";

const toMoney = (value) => Number(value || 0).toFixed(2);

export const CashierShift = () => {
  const [shiftData, setShiftData] = useState(null);
  const [movements, setMovements] = useState([]);
  
  const [initialBalance, setInitialBalance] = useState("");
  const [movForm, setMovForm] = useState({ type: "OUT", amount: "", reason: "" });
  const [closeForm, setCloseForm] = useState({ declaredCash: "", declaredCard: "", declaredTransfer: "", notes: "" });
  
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState("OPERATE"); // "OPERATE" o "CLOSE"

  const loadShift = async () => {
    try {
      setIsLoading(true);
      const res = await getMyShift();
      if (res.hasOpenShift) {
        setShiftData(res.shift);
        const movs = await getMovements(res.shift.shiftDetails.id);
        setMovements(movs.movements);
      } else {
        setShiftData(null);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadShift(); }, []);

  const clearMessages = () => { setStatus(""); setError(""); };

  const handleOpenShift = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsSaving(true);
    try {
      await openMyShift({ initialBalance });
      setStatus("¡Turno abierto con éxito!");
      await loadShift();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setIsSaving(false); }
  };

  const handleAddMovement = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsSaving(true);
    try {
      await addMovement(shiftData.shiftDetails.id, movForm);
      setStatus("Movimiento registrado correctamente.");
      setMovForm({ type: "OUT", amount: "", reason: "" });
      await loadShift();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setIsSaving(false); }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    if(!window.confirm("¿Estás seguro que deseas cerrar la caja? Esta acción es irreversible.")) return;
    clearMessages();
    setIsSaving(true);
    try {
      const res = await closeMyShift(shiftData.shiftDetails.id, closeForm);
      const diff = Number(res.differenceCash);
      alert(`Turno cerrado. Descuadre en efectivo: $${diff.toFixed(2)} ${diff < 0 ? '(Faltante)' : diff > 0 ? '(Sobrante)' : '(Caja Cuadrada)'}`);
      await loadShift();
      setView("OPERATE");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setIsSaving(false); }
  };

  if (isLoading) return <p className="menu-loading">Cargando estado de la caja...</p>;

  if (!shiftData) {
    return (
      <section className="menu-catalog-page">
        <div className="menu-catalog-head">
          <div>
            <h2>Apertura de Turno</h2>
            <p>Debes declarar tu fondo inicial para comenzar a cobrar.</p>
          </div>
        </div>
        {error && <p className="admin-users-error">{error}</p>}
        <form className="menu-create-panel" onSubmit={handleOpenShift}>
          <label className="is-wide">
            <span>Fondo Inicial (Monedas y billetes en gaveta) $</span>
            <input type="number" step="0.01" min="0" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} required placeholder="Ej. 50.00" />
          </label>
          <button type="submit" disabled={isSaving || initialBalance === ""}>Abrir Caja</button>
        </form>
      </section>
    );
  }

  // --- PANTALLA 2: OPERAR Y CERRAR CAJA ---
  return (
    <section className="menu-catalog-page">
      <div className="menu-catalog-head">
        <div>
          <h2>Control de Caja</h2>
          <p>Turno actual de: {shiftData.shiftDetails.cashierName}</p>
        </div>
        <button type="button" onClick={() => setView(view === "OPERATE" ? "CLOSE" : "OPERATE")} className={view === "OPERATE" ? "is-secondary" : ""}>
          {view === "OPERATE" ? "Ir al Cierre de Caja" : "Volver a Operaciones"}
        </button>
      </div>

      {status && <p className="admin-users-success">{status}</p>}
      {error && <p className="admin-users-error">{error}</p>}

      {view === "OPERATE" && (
        <div className="inventory-layout">
          <div className="inventory-form-stack">
            <form className="inventory-form" onSubmit={handleAddMovement}>
              <div>
                <h3>Caja Chica</h3>
                <p>Registra cualquier entrada o salida de dinero físico de la gaveta (Ej. Pago de agua, cambio).</p>
              </div>
              <label>
                <span>Tipo de movimiento</span>
                <select value={movForm.type} onChange={e => setMovForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="OUT">Salida (Gasto / Retiro)</option>
                  <option value="IN">Entrada (Ingreso extra)</option>
                </select>
              </label>
              <label>
                <span>Monto $</span>
                <input type="number" step="0.01" min="0.01" value={movForm.amount} onChange={e => setMovForm(f => ({ ...f, amount: e.target.value }))} required />
              </label>
              <label className="is-wide">
                <span>Motivo / Justificación</span>
                <input type="text" value={movForm.reason} onChange={e => setMovForm(f => ({ ...f, reason: e.target.value }))} required placeholder="Ej. Compra de hielo a proveedor" />
              </label>
              <button type="submit" disabled={isSaving}>Registrar Movimiento</button>
            </form>
          </div>

          <div className="inventory-table-card">
            <div className="inventory-table-head">
              <div>
                <h3>Historial del Turno</h3>
                <p>Abierto a las {new Date(shiftData.shiftDetails.openedAt).toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="inventory-table-wrap">
              <table className="inventory-table">
                <thead><tr><th>Hora</th><th>Tipo</th><th>Motivo</th><th>Monto</th></tr></thead>
                <tbody>
                  {movements.length === 0 ? <tr><td colSpan="4" className="text-center text-muted">No hay movimientos.</td></tr> : movements.map(m => (
                    <tr key={m.id}>
                      <td>{new Date(m.createdAt).toLocaleTimeString()}</td>
                      <td><span className={`inventory-pill ${m.type === 'IN' ? 'is-ok' : 'is-empty'}`}>{m.type === "IN" ? "ENTRADA" : "SALIDA"}</span></td>
                      <td>{m.reason}</td>
                      <td className={m.type === "IN" ? "text-success" : "text-danger"}>
                        {m.type === "IN" ? "+" : "-"}${toMoney(m.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === "CLOSE" && (
        <form className="menu-create-panel" onSubmit={handleCloseShift}>
          <div className="is-wide">
            <h3>Declaración de Cierre</h3>
            <p className="text-muted">Cuenta el dinero físico y revisa los vouchers de tu POS. Ingresa los montos reales a continuación.</p>
          </div>
          
          <label>
            <span>Efectivo Físico en Gaveta $</span>
            <input type="number" step="0.01" min="0" value={closeForm.declaredCash} onChange={e => setCloseForm(f => ({ ...f, declaredCash: e.target.value }))} required />
          </label>
          <label>
            <span>Total en Voucher POS (Tarjetas) $</span>
            <input type="number" step="0.01" min="0" value={closeForm.declaredCard} onChange={e => setCloseForm(f => ({ ...f, declaredCard: e.target.value }))} required />
          </label>
          <label className="is-wide">
            <span>Total Transferencias / Apps $</span>
            <input type="number" step="0.01" min="0" value={closeForm.declaredTransfer} onChange={e => setCloseForm(f => ({ ...f, declaredTransfer: e.target.value }))} required />
          </label>
          <label className="is-wide">
            <span>Notas de Cierre (Opcional)</span>
            <textarea value={closeForm.notes} onChange={e => setCloseForm(f => ({ ...f, notes: e.target.value }))} placeholder="Si hay algún descuadre, justifícalo aquí..." />
          </label>
          
          <div className="is-wide">
            <button type="submit" disabled={isSaving || closeForm.declaredCash === "" || closeForm.declaredCard === ""} className="w-100">Cerrar Turno de Forma Irreversible</button>
          </div>
        </form>
      )}
    </section>
  );
};