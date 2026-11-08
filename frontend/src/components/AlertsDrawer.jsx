const TYPE_COLORS = {
  FLOOD: '#3b82f6',
  FIRE: '#ef4444',
  EARTHQUAKE: '#c2410c',
  BLOCKED_ROAD: '#f59e0b',
  TREE_FALL: '#22c55e',
};

function formatDistance(km) {
  if (km == null || Number.isNaN(Number(km))) return '';
  const value = Number(km);
  if (value < 1) return `${Math.round(value * 1000)} m`;
  return `${value.toFixed(1)} km`;
}

export default function AlertsDrawer({ open, onClose, reports, selectedId, onSelect }) {
  if (!open) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="alerts-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="alerts-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-header">
          <div>
            <p className="drawer-kicker">Próximos de você</p>
            <h2 id="alerts-drawer-title">Alertas</h2>
          </div>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="drawer-list">
          {reports.length === 0 && (
            <p className="drawer-empty">Nenhum alerta neste raio.</p>
          )}

          {reports.map((report) => {
            const color = TYPE_COLORS[report.report_type_code] || '#94a3b8';
            const active = report.id === selectedId;

            return (
              <button
                key={report.id}
                type="button"
                className={`drawer-item${active ? ' active' : ''}`}
                onClick={() => onSelect(report)}
              >
                <span className="drawer-dot" style={{ background: color }} />
                <span className="drawer-item-body">
                  <strong>{report.report_type_name || report.report_type_code}</strong>
                  <span className="drawer-desc">
                    {report.description || 'Sem descrição'}
                  </span>
                  <span className="drawer-meta">
                    {formatDistance(report.distance_km)}
                    {report.distance_km != null ? ' · ' : ''}
                    {new Date(report.created_at).toLocaleString('pt-BR')}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
