import { RefreshCw } from 'lucide-react'

interface HeaderProps {
  isBackendOnline: boolean
  isRefreshing: boolean
  onRefresh: () => void
}

export function Header({
  isBackendOnline,
  isRefreshing,
  onRefresh,
}: HeaderProps) {
  return (
    <header className="top-header">
      <div>
        <h1>Overview</h1>
        <p>Monitor your CI/CD infrastructure and deployments.</p>
      </div>

      <div className="header-actions">
        <div
          className={`status-pill ${isBackendOnline ? 'online' : 'offline'}`}
          title="Backend health is checked from /api/health"
        >
          <span aria-hidden="true" />
          {isBackendOnline ? 'Backend Online' : 'Backend Offline'}
        </div>
        <button
          className="refresh-button"
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh dashboard data"
        >
          <RefreshCw
            className={isRefreshing ? 'spin' : undefined}
            size={16}
            aria-hidden="true"
          />
          <span>{isRefreshing ? 'Refreshing' : 'Refresh'}</span>
        </button>
      </div>
    </header>
  )
}
