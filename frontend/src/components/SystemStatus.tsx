import { Database, MonitorCheck, Server } from 'lucide-react'

interface SystemStatusProps {
  isBackendOnline: boolean
}

export function SystemStatus({ isBackendOnline }: SystemStatusProps) {
  return (
    <section className="panel system-status">
      <div className="section-heading">
        <h2>System Status</h2>
      </div>

      <div className="system-grid">
        <div className="system-item">
          <Server size={18} aria-hidden="true" />
          <span>Backend API</span>
          <strong className={isBackendOnline ? 'text-success' : 'text-danger'}>
            {isBackendOnline ? 'Online' : 'Offline'}
          </strong>
        </div>
        <div className="system-item">
          <Database size={18} aria-hidden="true" />
          <span>PostgreSQL</span>
          <strong>Managed by Backend</strong>
        </div>
        <div className="system-item">
          <MonitorCheck size={18} aria-hidden="true" />
          <span>Frontend</span>
          <strong className="text-success">Online</strong>
        </div>
      </div>
    </section>
  )
}
