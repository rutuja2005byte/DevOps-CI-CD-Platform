import { useCallback, useEffect, useMemo, useState } from 'react'
import { GitPullRequest, Rocket, Users, Workflow } from 'lucide-react'
import './App.css'
import { BuildOverview } from './components/BuildOverview'
import { Header } from './components/Header'
import { LoadingSkeleton } from './components/LoadingSkeleton'
import { RecentBuilds } from './components/RecentBuilds'
import { RecentDeployments } from './components/RecentDeployments'
import { Sidebar } from './components/Sidebar'
import { StatCard } from './components/StatCard'
import { SystemStatus } from './components/SystemStatus'
import { getBuilds, getDeployments, getHealth, getUsers } from './services/api'
import type { Build, Deployment, User } from './types'

function App() {
  const [builds, setBuilds] = useState<Build[]>([])
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isBackendOnline, setIsBackendOnline] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    setError(null)

    try {
      const [health, usersData, buildsData, deploymentsData] =
        await Promise.all([
          getHealth(),
          getUsers(),
          getBuilds(),
          getDeployments(),
        ])

      setIsBackendOnline(health.status.toLowerCase() === 'ok')
      setUsers(usersData)
      setBuilds(buildsData)
      setDeployments(deploymentsData)
    } catch {
      setIsBackendOnline(false)
      setError('Unable to load dashboard data.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const successfulBuilds = useMemo(
    () =>
      builds.filter((build) => build.status.toLowerCase() === 'success')
        .length,
    [builds],
  )

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="dashboard">
        <Header
          isBackendOnline={isBackendOnline}
          isRefreshing={isRefreshing}
          onRefresh={() => void loadDashboard(true)}
        />

        {error ? (
          <section className="error-card" role="alert">
            <div>
              <strong>{error}</strong>
              <p>Check that the backend is running on http://localhost:5001.</p>
            </div>
            <button type="button" onClick={() => void loadDashboard(true)}>
              Retry
            </button>
          </section>
        ) : null}

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="dashboard-grid">
            <section className="stats-grid" aria-label="Dashboard summary">
              <StatCard
                title="Total Builds"
                value={builds.length}
                icon={Workflow}
                tone="blue"
              />
              <StatCard
                title="Successful Builds"
                value={successfulBuilds}
                icon={GitPullRequest}
                tone="green"
              />
              <StatCard
                title="Deployments"
                value={deployments.length}
                icon={Rocket}
                tone="amber"
              />
              <StatCard
                title="Users"
                value={users.length}
                icon={Users}
                tone="slate"
              />
            </section>

            <BuildOverview builds={builds} />
            <RecentBuilds builds={builds} />
            <RecentDeployments deployments={deployments} />
            <SystemStatus isBackendOnline={isBackendOnline} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
