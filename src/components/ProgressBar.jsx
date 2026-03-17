export function ProgressBar({ value, label, tone = 'amber' }) {
  return (
    <div className="progress-block">
      {label ? <div className="progress-label">{label}</div> : null}
      <div className="progress-shell">
        <div className={`progress-fill progress-fill--${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
