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
  { label: 'Overview', icon: Gauge },
  { label: 'Pipelines', icon: GitBranch },
  { label: 'Builds', icon: Layers3 },
  { label: 'Deployments', icon: Rocket },
  { label: 'Containers', icon: Boxes },
  { label: 'Logs', icon: ScrollText },
  { label: 'Settings', icon: Settings },
]

export type DashboardPage = (typeof navigation)[number]['label']

interface SidebarProps {
  activePage: DashboardPage
  onNavigate: (page: DashboardPage) => void
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
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
          {navigation.map(({ label, icon: Icon }) => {
            const active = label === activePage

            return (
            <button
              className={`nav-item${active ? ' is-active' : ''}`}
              type="button"
              key={label}
              aria-current={active ? 'page' : undefined}
              title={`${label} dashboard`}
              onClick={() => onNavigate(label)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </button>
            )
          })}
        </nav>
      </div>

      <div className="environment-panel">
        <span>Local Environment</span>
        <strong>Development</strong>
      </div>
    </aside>
  )
}
