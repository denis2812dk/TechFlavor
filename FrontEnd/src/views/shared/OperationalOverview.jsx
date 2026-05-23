export const OperationalOverview = () => {
  const activity = [
    ["New order #1247", "Table 12 · 3 items", "2m ago"],
    ["Order #1245 completed", "Delivery · $68.50", "5m ago"],
    ["Table 8 needs attention", "Requested check", "8m ago"],
    ["New order #1246", "Table 5 · 5 items", "12m ago"],
    ["New reservation", "Table 15 · 6 guests", "18m ago"],
  ];

  return (
    <div className="overview-screen">
      <section className="overview-hero">
        <div className="overview-revenue">
          <span>Today's revenue</span>
          <strong>$12,847</strong>
          <small>+18% from yesterday</small>
        </div>
        <div className="overview-stat">
          <span>24</span>
          <small>Active Orders</small>
        </div>
        <div className="overview-stat">
          <span>78%</span>
          <small>Table Occupancy</small>
        </div>
        <div className="overview-stat">
          <span>8 min</span>
          <small>Avg Cook Time</small>
        </div>
        <div className="overview-stat">
          <span>12</span>
          <small>Deliveries Out</small>
        </div>
      </section>

      <section className="overview-grid">
        <article className="overview-panel activity-panel">
          <div className="overview-panel-head">
            <h2>Live Activity</h2>
            <button type="button">View all</button>
          </div>
          {activity.map((item) => (
            <div className="activity-row" key={item[0]}>
              <span className="activity-dot" />
              <div>
                <strong>{item[0]}</strong>
                <p>{item[1]}</p>
              </div>
              <small>{item[2]}</small>
            </div>
          ))}
        </article>

        <article className="overview-panel chart-panel">
          <div className="overview-panel-head">
            <div>
              <h2>Revenue Today</h2>
              <p>Hourly breakdown</p>
            </div>
            <div className="chart-tabs">
              <span>Today</span>
              <span>Week</span>
              <span>Month</span>
            </div>
          </div>
          <div className="soft-chart" aria-hidden="true">
            <svg viewBox="0 0 720 220" preserveAspectRatio="none">
              <path d="M0 190 C80 178 110 150 160 120 C230 78 250 20 320 50 C380 78 390 135 470 140 C560 142 585 62 720 28" fill="none" stroke="oklch(0.72 0.12 32)" strokeWidth="3" />
              <path d="M0 190 C80 178 110 150 160 120 C230 78 250 20 320 50 C380 78 390 135 470 140 C560 142 585 62 720 28 L720 220 L0 220 Z" fill="oklch(0.92 0.04 32 / 0.42)" />
            </svg>
          </div>
        </article>
      </section>

      <section className="overview-panel heatmap-panel">
        <h2>Peak Hours</h2>
        <p>Weekly occupancy heatmap</p>
        <div className="heatmap">
          {["Mon", "Tue", "Wed", "Thu"].map((day) => (
            <div className="heatmap-row" key={day}>
              <span>{day}</span>
              <i />
              <i />
              <i />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
