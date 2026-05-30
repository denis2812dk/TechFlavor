import { useCallback, useEffect, useMemo, useState } from "react";
import { getShiftHistory, getShiftDetails } from "../../lib/cash";
import { getErrorMessage } from "../../lib/auth";

const toMoney = (value) => Number(value || 0).toFixed(2);

export const ShiftHistory = () => {
  const [shifts, setShifts] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Estados para el Modal de Detalles
  const [selectedShift, setSelectedShift] = useState(null);
  const [shiftDetails, setShiftDetails] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getShiftHistory();
      setShifts(res.shifts);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleOpenDetails = async (shift) => {
    setSelectedShift(shift);
    setShiftDetails(null);
    setIsDetailLoading(true);
    try {
      const res = await getShiftDetails(shift.id);
      setShiftDetails(res.data);
    } catch (err) {
      alert(getErrorMessage(err));
      setSelectedShift(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const filteredShifts = useMemo(() => {
    if (timeFilter === "all") return shifts;

    const now = new Date();
    let limitDate;

    if (timeFilter === "today") {
      limitDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else {
      const days = { week: 7, fortnight: 15, month: 30 }[timeFilter] || 0;
      limitDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }

    return shifts.filter(shift => new Date(shift.openedAt) >= limitDate);
  }, [shifts, timeFilter]);

  if (isLoading) return <p className="menu-loading">Cargando historial de turnos...</p>;

  return (
    <section className="menu-catalog-page">
      <header className="menu-catalog-head">
        <div>
          <h2>Auditoría de Cajas</h2>
          <p>Revisa el historial de turnos, ingresos y descuadres de todos los cajeros.</p>
        </div>
        <button type="button" onClick={loadData} className="is-secondary">Actualizar</button>
      </header>

      {error && <p className="admin-users-error">{error}</p>}

      <div className="menu-catalog-toolbar">
        <p>{filteredShifts.length} turnos encontrados</p>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#fff", cursor: "pointer", outline: "none" }}
        >
          <option value="all">Todos</option>
          <option value="today">Hoy</option>
          <option value="week">Últimos 7 días</option>
          <option value="fortnight">Últimos 15 días</option>
          <option value="month">Último mes</option>
        </select>
      </div>

      <section className="inventory-table-card mt-3">
        <div className="inventory-table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Fecha / Turno</th>
                <th>Cajero</th>
                <th>Estado</th>
                <th>Fondo Inicial</th>
                <th>Fondo Declarado (Efectivo)</th>
                <th>Descuadre (Efectivo)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
                {filteredShifts.length === 0 ? (
                  <tr><td colSpan="7" className="text-center text-muted p-4">No hay turnos para el rango seleccionado.</td></tr>
              ) : (
                  filteredShifts.map(shift => {
                  const diff = Number(shift.cashDifference);
                  const isClosed = shift.status === "closed";
                  
                  return (
                    <tr key={shift.id}>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-bold">{new Date(shift.openedAt).toLocaleDateString()}</span>
                          <small className="text-muted">Apertura: {new Date(shift.openedAt).toLocaleTimeString()}</small>
                          {isClosed && <small className="text-muted">Cierre: {new Date(shift.closedAt).toLocaleTimeString()}</small>}
                        </div>
                      </td>
                      <td>{shift.cashierName}</td>
                      <td>
                        <span className={`inventory-pill ${isClosed ? "bg-secondary text-white" : "is-ok"}`}>
                          {isClosed ? "Cerrado" : "En Curso"}
                        </span>
                      </td>
                      <td className="fw-bold text-muted">
                        ${toMoney(shift.initialBalance)}
                      </td>
                      <td className="fw-bold text-muted">
                        {isClosed ? `$${toMoney(shift.declaredCash)}` : <span className="text-muted">-</span>}
                      </td>
                      <td>
                        {isClosed ? (
                          <span className={`fw-bold ${diff < 0 ? "text-danger" : diff > 0 ? "text-primary" : "text-success"}`}>
                            {diff === 0 ? "Cuadrado ($0.00)" : `${diff > 0 ? '+' : ''}$${toMoney(diff)}`}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleOpenDetails(shift)}>
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedShift && (
        <div className="users-modal-backdrop" onClick={() => setSelectedShift(null)} style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="ticket-preview" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", textAlign: "left", padding: "24px" }}>
            
            <div className="d-flex justify-content-between align-items-start mb-3 border-bottom pb-3">
              <div>
                <h3 className="mb-1">Detalle de Turno</h3>
                <p className="text-muted m-0">Cajero: <strong>{selectedShift.cashierName}</strong></p>
                <small className="text-muted">
                  Abierto: {new Date(selectedShift.openedAt).toLocaleString()}
                  {selectedShift.status === "closed" && ` | Cerrado: ${new Date(selectedShift.closedAt).toLocaleString()}`}
                </small>
              </div>
              <span className={`inventory-pill ${selectedShift.status === "closed" ? "bg-secondary text-white" : "is-ok"}`}>
                {selectedShift.status === "closed" ? "Cerrado" : "En Curso"}
              </span>
            </div>

            {isDetailLoading || !shiftDetails ? (
              <p className="text-center text-muted py-4">Calculando matemática del turno...</p>
            ) : (
              <>
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded border">
                      <h4 className="h6 text-muted mb-3">Ingresos (Ventas)</h4>
                      <div className="d-flex justify-content-between mb-1"><span>Fondo Inicial:</span> <strong>${toMoney(shiftDetails.breakdown.initialBalance)}</strong></div>
                      <div className="d-flex justify-content-between mb-1"><span>Ventas Efectivo:</span> <strong className="text-success">+ ${toMoney(shiftDetails.breakdown.salesCash)}</strong></div>
                      <div className="d-flex justify-content-between mb-1"><span>Ventas Tarjeta POS:</span> <strong className="text-success">+ ${toMoney(shiftDetails.breakdown.salesCard)}</strong></div>
                      <div className="d-flex justify-content-between mb-1"><span>Ventas Transferencia:</span> <strong className="text-success">+ ${toMoney(shiftDetails.breakdown.salesTransfer)}</strong></div>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded border h-100">
                      <h4 className="h6 text-muted mb-3">Movimientos (Caja Chica)</h4>
                      <div className="d-flex justify-content-between mb-1"><span>Entradas Manuales:</span> <strong className="text-primary">+ ${toMoney(shiftDetails.breakdown.movementsIn)}</strong></div>
                      <div className="d-flex justify-content-between mb-1"><span>Salidas Manuales:</span> <strong className="text-danger">- ${toMoney(shiftDetails.breakdown.movementsOut)}</strong></div>
                    </div>
                  </div>
                </div>

                {selectedShift.status === "closed" && (
                  <div className="p-3 mb-4 rounded" style={{ background: "#f8fafc", border: "1px solid #cbd5e1" }}>
                    <h4 className="h6 mb-2">Cuadre de Efectivo Físico</h4>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">El sistema esperaba en gaveta:</span>
                      <strong>${toMoney(shiftDetails.expected.cash)}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">El cajero declaró tener:</span>
                      <strong>${toMoney(selectedShift.declaredCash)}</strong>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between fs-5">
                      <span>Diferencia:</span>
                      <strong className={Number(selectedShift.cashDifference) < 0 ? "text-danger" : Number(selectedShift.cashDifference) > 0 ? "text-primary" : "text-success"}>
                        {Number(selectedShift.cashDifference) === 0 ? "CUADRADO EXACTO" : `$${toMoney(selectedShift.cashDifference)}`}
                      </strong>
                    </div>
                    {selectedShift.notes && (
                      <div className="mt-2 p-2 bg-white rounded border small">
                        <strong>Nota del cajero:</strong> {selectedShift.notes}
                      </div>
                    )}
                  </div>
                )}

                <h4 className="h6 mb-3">Detalle de Movimientos Manuales</h4>
                {shiftDetails.movements.length === 0 ? (
                  <p className="text-muted small">No hubo entradas ni salidas manuales en este turno.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm border">
                      <thead className="table-light text-muted small">
                        <tr>
                          <th>Hora</th>
                          <th>Tipo</th>
                          <th>Motivo</th>
                          <th>Responsable</th>
                          <th className="text-end">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="small">
                        {shiftDetails.movements.map(m => (
                          <tr key={m.id}>
                            <td>{new Date(m.createdAt).toLocaleTimeString()}</td>
                            <td>
                              <span className={`badge ${m.type === 'IN' ? 'bg-success' : 'bg-danger'}`}>
                                {m.type === "IN" ? "INGRESO" : "RETIRO"}
                              </span>
                            </td>
                            <td>{m.reason}</td>
                            <td className="text-muted">{m.userName.split(" ")[0]}</td>
                            <td className={`text-end fw-bold ${m.type === "IN" ? "text-success" : "text-danger"}`}>
                              {m.type === "IN" ? "+" : "-"}${toMoney(m.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            <button type="button" className="is-secondary mt-4 w-100" onClick={() => setSelectedShift(null)}>
              Cerrar Detalles
            </button>
          </div>
        </div>
      )}
    </section>
  );
};