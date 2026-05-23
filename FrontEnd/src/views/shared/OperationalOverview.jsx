import { useEffect, useMemo, useState } from "react";
import { listOrders, getErrorMessage } from "../../lib/auth";
import { getSalonStatus } from "../../lib/salon";

const toMoney = (value) => Number(value || 0).toFixed(2);

const getFixedDate = (dateString) => {
  if (!dateString) return new Date();
  const d = new Date(dateString);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() + offset);
};

export const OperationalOverview = () => {
  const [orders, setOrders] = useState([]);
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  // Refrescar datos cada 10 segundos
  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersData, salonData] = await Promise.all([
          listOrders(),
          getSalonStatus().catch(() => ({ salon: [] })) // Fallback si no hay salón configurado
        ]);
        setOrders(ordersData.orders || []);
        setZones(salonData.salon || []);
        setError("");
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    const intervalId = setInterval(loadData, 10000);
    return () => clearInterval(intervalId);
  }, []);

  // Reloj interno para recalcular minutos en tiempo real (cada minuto)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // === CÁLCULOS DINÁMICOS ===
  const stats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Filtrar órdenes de hoy
    const todayOrders = orders.filter(o => getFixedDate(o.createdAt) >= todayStart);
    
    // 1. Ingresos
    const revenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);

    // 2. Órdenes Activas
    const activeOrders = orders.filter(o => o.status === "in_preparation" || o.status === "finished");
    const inKitchen = activeOrders.filter(o => o.status === "in_preparation");
    const inDispatch = activeOrders.filter(o => o.status === "finished");

    // 3. Ocupación de Mesas
    const allTables = zones.flatMap(z => z.tables || []);
    const totalTables = allTables.filter(t => t.status !== "inactive").length;
    const occupiedTables = allTables.filter(t => t.status === "occupied").length;
    const occupancyRate = totalTables ? Math.round((occupiedTables / totalTables) * 100) : 0;

    // 4. Órdenes Retrasadas (> 10 mins en cocina)
    const delayedOrders = inKitchen.filter(o => {
      const diff = now - getFixedDate(o.createdAt).getTime();
      return Math.floor(diff / 60000) >= 10;
    }).sort((a, b) => getFixedDate(a.createdAt) - getFixedDate(b.createdAt));

    // 5. Ventas por hora (Para el gráfico)
    const salesByHour = Array(24).fill(0);
    todayOrders.forEach(o => {
      const h = getFixedDate(o.createdAt).getHours();
      salesByHour[h] += Number(o.total);
    });
    
    // Ajustar el inicio del gráfico si hay ventas antes de las 8am
    const firstOrderHour = todayOrders.length > 0 ? Math.min(...todayOrders.map(o => getFixedDate(o.createdAt).getHours())) : 8;
    const startHour = Math.min(8, firstOrderHour);
    
    const chartData = salesByHour.map((total, hour) => ({ hour, total })).filter(d => d.hour >= startHour && d.hour <= 23);
    const maxSales = Math.max(...chartData.map(d => d.total), 1);

    return {
      revenue,
      activeCount: activeOrders.length,
      inKitchen,
      inDispatch,
      totalTables,
      occupiedTables,
      occupancyRate,
      delayedOrders,
      chartData,
      maxSales,
      todayOrdersCount: todayOrders.length
    };
  }, [orders, zones, now]);

  if (isLoading) {
    return <div className="p-5 text-center text-muted">Cargando centro de mando...</div>;
  }

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      {error && <div className="alert alert-danger">{error}</div>}

      {/* KPIs SUPERIORES */}
      <section className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: "#2D1810", color: "white" }}>
            <div className="card-body">
              <span className="text-uppercase small opacity-75 fw-semibold d-block mb-1">Ingresos Hoy</span>
              <strong className="fs-2 d-block mb-2" style={{ color: "#E89B8F" }}>${toMoney(stats.revenue)}</strong>
              <small className="opacity-75">{stats.todayOrdersCount} órdenes generadas hoy</small>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100 bg-white">
            <div className="card-body">
              <span className="text-uppercase text-muted small fw-semibold d-block mb-1">Órdenes en Curso</span>
              <strong className="fs-2 d-block text-dark mb-2">{stats.activeCount}</strong>
              <small className="text-muted">Tickets sin entregar</small>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100 bg-white">
            <div className="card-body">
              <span className="text-uppercase text-muted small fw-semibold d-block mb-1">Ocupación de Mesas</span>
              <strong className="fs-2 d-block text-dark mb-2">{stats.occupancyRate}%</strong>
              <small className="text-muted">{stats.occupiedTables} de {stats.totalTables} mesas ocupadas</small>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className={`card border-0 shadow-sm h-100 ${stats.delayedOrders.length > 0 ? "bg-danger text-white" : "bg-white"}`}>
            <div className="card-body">
              <span className={`text-uppercase small fw-semibold d-block mb-1 ${stats.delayedOrders.length > 0 ? "opacity-75" : "text-muted"}`}>Atención Requerida</span>
              <strong className={`fs-2 d-block mb-2 ${stats.delayedOrders.length > 0 ? "" : "text-dark"}`}>{stats.delayedOrders.length}</strong>
              <small className={stats.delayedOrders.length > 0 ? "" : "text-muted"}>Pedidos retrasados en cocina</small>
            </div>
          </div>
        </div>
      </section>

      <div className="row g-4">
        {/* PIPELINE OPERATIVO & ALERTA DE RETRASOS */}
        <div className="col-12 col-lg-5 col-xl-4 d-flex flex-column gap-4">
          
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
              <h3 className="h6 fw-bold mb-0">Flujo Operativo</h3>
              <p className="text-muted small">¿Dónde está el cuello de botella?</p>
            </div>
            <div className="card-body pt-2">
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="small fw-semibold text-warning">1. Cocina (Preparando)</span>
                  <span className="small fw-bold">{stats.inKitchen.length}</span>
                </div>
                <div className="progress" style={{ height: "8px" }}>
                  <div className="progress-bar bg-warning" style={{ width: `${(stats.inKitchen.length / (stats.activeCount || 1)) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="small fw-semibold text-primary">2. Despacho (Esperando Mesero)</span>
                  <span className="small fw-bold">{stats.inDispatch.length}</span>
                </div>
                <div className="progress" style={{ height: "8px" }}>
                  <div className="progress-bar bg-primary" style={{ width: `${(stats.inDispatch.length / (stats.activeCount || 1)) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {stats.delayedOrders.length > 0 && (
            <div className="card border-danger shadow-sm border-2">
              <div className="card-header bg-danger text-white">
                <h3 className="h6 fw-bold mb-0">¡Alerta! Pedidos Retrasados</h3>
                <small className="opacity-75">Más de 10 min en cocina</small>
              </div>
              <div className="list-group list-group-flush">
                {stats.delayedOrders.map(order => (
                  <div className="list-group-item d-flex justify-content-between align-items-center" key={order.id}>
                    <div>
                      <strong className="d-block">{order.code}</strong>
                      <small className="text-muted">{order.tableName || order.tableId ? `Mesa: ${order.tableName || order.tableId}` : "Para llevar"}</small>
                    </div>
                    <span className="badge bg-danger rounded-pill px-3 py-2">
                      {Math.floor((now - getFixedDate(order.createdAt).getTime()) / 60000)} min
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* GRÁFICO DE VENTAS */}
        <div className="col-12 col-lg-7 col-xl-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex flex-column">
              <h3 className="h6 fw-bold mb-0">Ventas por Hora (Hoy)</h3>
              <p className="text-muted small mb-4">Ingresos generados desde las 8:00 AM</p>
              
              <div className="d-flex align-items-end flex-grow-1 gap-1 gap-md-2" style={{ height: "200px", minHeight: "200px" }}>
                {stats.chartData.map((data) => (
                  <div key={data.hour} className="d-flex flex-column align-items-center flex-grow-1 h-100 justify-content-end" title={`$${toMoney(data.total)} a las ${data.hour}:00`}>
                    <span className="small text-muted mb-1" style={{ fontSize: "10px" }}>{data.total > 0 ? `$${Math.round(data.total)}` : ""}</span>
                    <div 
                      style={{ width: "100%", backgroundColor: "#E89B8F", borderRadius: "4px 4px 0 0", transition: "height 0.5s ease", height: `${(data.total / stats.maxSales) * 100}%`, minHeight: "1px" }} 
                    />
                    <span className="small text-muted mt-2 fw-semibold" style={{ fontSize: "11px" }}>{data.hour}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
