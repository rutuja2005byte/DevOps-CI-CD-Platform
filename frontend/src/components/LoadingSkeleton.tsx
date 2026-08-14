export function LoadingSkeleton() {
  return (
    <div className="skeleton-layout" aria-label="Loading dashboard data">
      <div className="skeleton-card wide" />
      <div className="skeleton-grid">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
      <div className="skeleton-card tall" />
      <div className="skeleton-card tall" />
    </div>
  )
}
