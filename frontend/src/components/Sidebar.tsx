import {
  Boxes,
  Gauge,
  GitBranch,
  Layers3,
  ListTree,
  Rocket,
  ScrollText,
  Settings,
} from 'lucide-react'

const navigation = [
  { label: 'Overview', icon: Gauge, active: true },
  { label: 'Pipelines', icon: GitBranch, active: false },
  { label: 'Builds', icon: Layers3, active: false },
  { label: 'Deployments', icon: Rocket, active: false },
  { label: 'Containers', icon: Boxes, active: false },
  { label: 'Logs', icon: ScrollText, active: false },
  { label: 'Settings', icon: Settings, active: false },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div>
        <div className="brand">
          <div className="brand-mark">
            <ListTree size={20} aria-hidden="true" />
          </div>
          <div>
            <span className="brand-title">DevOps Platform</span>
            <span className="brand-subtitle">CI/CD Control</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {navigation.map(({ label, icon: Icon, active }) => (
            <button
              className={`nav-item${active ? ' is-active' : ''}`}
              type="button"
              key={label}
              aria-current={active ? 'page' : undefined}
              title={active ? `${label} dashboard` : `${label} placeholder`}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="environment-panel">
        <span>Local Environment</span>
        <strong>Development</strong>
      </div>
    </aside>
  )
}
