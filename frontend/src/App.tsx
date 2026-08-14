import { useCallback, useEffect, useMemo, useState } from 'react'
import type React from 'react'
import {
  GitPullRequest,
  Rocket,
  Users,
  Workflow,
} from 'lucide-react'
import './App.css'
import { BuildOverview } from './components/BuildOverview'
import { Header } from './components/Header'
import { LoadingSkeleton } from './components/LoadingSkeleton'
import { RecentBuilds } from './components/RecentBuilds'
import { RecentDeployments } from './components/RecentDeployments'
import { Sidebar, type DashboardPage } from './components/Sidebar'
import { StatCard } from './components/StatCard'
import { StatusBadge } from './components/StatusBadge'
import { SystemStatus } from './components/SystemStatus'
import {
  getBuildLogs,
  getBuilds,
  getContainers,
  getDeployments,
  getDeploymentLogs,
  getHealth,
  getLogs,
  getPipelines,
  getPipeline,
  getSettings,
  getUsers,
  rollbackDeployment,
} from './services/api'
import type {
  Build,
  ContainerInfo,
  Deployment,
  LogEntry,
  LogsResponse,
  Pipeline,
  SettingsResponse,
  User,
} from './types'

function formatDate(value?: string) {
  if (!value) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDuration(duration: number | null | undefined) {
  if (duration === null || duration === undefined) {
    return 'Pending'
  }

  if (duration < 60) {
    return `${duration}s`
  }

  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
}

function EmptyState({ message }: { message: string }) {
  return <div className="empty-state">{message}</div>
}

function LogList({ logs }: { logs: LogEntry[] }) {
  if (logs.length === 0) {
    return <EmptyState message="No logs available" />
  }

  return (
    <div className="log-list">
      {logs.map((log, index) => (
        <div className="log-line" key={`${log.created_at ?? 'log'}-${index}`}>
          <span>{log.created_at ? formatDate(log.created_at) : 'Log'}</span>
          <code>{log.message}</code>
        </div>
      ))}
    </div>
  )
}

function App() {
  const [activePage, setActivePage] = useState<DashboardPage>('Overview')
  const [builds, setBuilds] = useState<Build[]>([])
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [containers, setContainers] = useState<ContainerInfo[]>([])
  const [containersConfigured, setContainersConfigured] = useState(false)
  const [logs, setLogs] = useState<LogsResponse>({
    buildLogs: [],
    deploymentLogs: [],
  })
  const [settings, setSettings] = useState<SettingsResponse | null>(null)
  const [databaseOnline, setDatabaseOnline] = useState(false)
  const [isBackendOnline, setIsBackendOnline] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailTitle, setDetailTitle] = useState<string | null>(null)
  const [detailBody, setDetailBody] = useState<React.ReactNode>(null)
  const [rollbackMessage, setRollbackMessage] = useState<string | null>(null)

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    setError(null)

    try {
      const [
        health,
        usersData,
        buildsData,
        deploymentsData,
        pipelinesData,
        containersData,
        logsData,
        settingsData,
      ] = await Promise.all([
          getHealth(),
          getUsers(),
          getBuilds(),
          getDeployments(),
          getPipelines(),
          getContainers(),
          getLogs(),
          getSettings(),
        ])

      setIsBackendOnline(health.status.toLowerCase() === 'ok')
      setDatabaseOnline(health.database === 'online')
      setUsers(usersData)
      setBuilds(buildsData)
      setDeployments(deploymentsData)
      setPipelines(pipelinesData)
      setContainers(containersData.containers)
      setContainersConfigured(containersData.configured)
      setLogs(logsData)
      setSettings(settingsData)
    } catch {
      setIsBackendOnline(false)
      setDatabaseOnline(false)
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

  const showBuildDetails = async (build: Build) => {
    setDetailTitle(`Build #${build.build_number}`)
    setDetailBody(<LoadingSkeleton />)
    const buildLogs = await getBuildLogs(build.id)
    setDetailBody(
      <div className="detail-grid">
        <div className="detail-row"><span>Branch</span><strong>{build.branch}</strong></div>
        <div className="detail-row"><span>Commit</span><strong>{build.commit_hash ?? 'Not available'}</strong></div>
        <div className="detail-row"><span>Status</span><StatusBadge status={build.status} /></div>
        <div className="detail-row"><span>Duration</span><strong>{formatDuration(build.duration)}</strong></div>
        <div className="detail-row"><span>Created</span><strong>{formatDate(build.created_at)}</strong></div>
        <h3>Logs</h3>
        <LogList logs={buildLogs} />
      </div>,
    )
  }

  const showDeploymentDetails = async (deployment: Deployment) => {
    setRollbackMessage(null)
    setDetailTitle(`Deployment ${deployment.version}`)
    setDetailBody(<LoadingSkeleton />)
    const deploymentLogs = await getDeploymentLogs(deployment.id)
    setDetailBody(
      <div className="detail-grid">
        <div className="detail-row"><span>Environment</span><strong>{deployment.environment}</strong></div>
        <div className="detail-row"><span>Status</span><StatusBadge status={deployment.status} /></div>
        <div className="detail-row"><span>Deployed</span><strong>{formatDate(deployment.deployed_at)}</strong></div>
        <button
          className="action-button"
          type="button"
          onClick={() => void handleRollback(deployment.id)}
        >
          Rollback
        </button>
        {rollbackMessage ? <p className="notice">{rollbackMessage}</p> : null}
        <h3>Logs</h3>
        <LogList logs={deploymentLogs} />
      </div>,
    )
  }

  const showPipelineDetails = async (pipeline: Pipeline) => {
    setDetailTitle(`Pipeline ${pipeline.name ?? pipeline.branch}`)
    setDetailBody(<LoadingSkeleton />)
    const pipelineDetails = await getPipeline(pipeline.id)
    setDetailBody(
      <div className="detail-grid">
        <div className="detail-row"><span>Branch</span><strong>{pipelineDetails.branch}</strong></div>
        <div className="detail-row"><span>Status</span><StatusBadge status={pipelineDetails.status} /></div>
        <div className="detail-row"><span>Latest Build</span><strong>{pipelineDetails.latest_build ?? 'None'}</strong></div>
        <div className="detail-row"><span>Duration</span><strong>{formatDuration(pipelineDetails.duration)}</strong></div>
        <h3>Recent Builds</h3>
        {pipelineDetails.builds && pipelineDetails.builds.length > 0 ? (
          <div className="compact-list">
            {pipelineDetails.builds.map((build) => (
              <button type="button" key={build.id} onClick={() => void showBuildDetails(build)}>
                #{build.build_number} <StatusBadge status={build.status} />
              </button>
            ))}
          </div>
        ) : (
          <EmptyState message="No builds for this pipeline" />
        )}
      </div>,
    )
  }

  const handleRollback = async (deploymentId: number) => {
    try {
      const result = await rollbackDeployment(deploymentId)
      setRollbackMessage(result.message)
    } catch (rollbackError) {
      setRollbackMessage(
        rollbackError instanceof Error
          ? rollbackError.message
          : 'Rollback failed',
      )
    }
  }

  const renderPage = () => {
    if (activePage === 'Overview') {
      return (
        <div className="dashboard-grid">
          <section className="stats-grid" aria-label="Dashboard summary">
            <StatCard title="Total Builds" value={builds.length} icon={Workflow} tone="blue" />
            <StatCard title="Successful Builds" value={successfulBuilds} icon={GitPullRequest} tone="green" />
            <StatCard title="Deployments" value={deployments.length} icon={Rocket} tone="amber" />
            <StatCard title="Users" value={users.length} icon={Users} tone="slate" />
          </section>
          <BuildOverview builds={builds} />
          <RecentBuilds builds={builds} />
          <RecentDeployments deployments={deployments} />
          <SystemStatus isBackendOnline={isBackendOnline} databaseOnline={databaseOnline} />
        </div>
      )
    }

    if (activePage === 'Pipelines') {
      return <DataTable title="Pipelines" empty="No pipelines yet" rows={pipelines} onRowClick={showPipelineDetails} columns={[
        ['Pipeline', (row) => row.name ?? row.branch],
        ['Status', (row) => <StatusBadge status={row.status} />],
        ['Latest Build', (row) => row.latest_build ? `#${row.latest_build}` : 'None'],
        ['Branch', (row) => row.branch],
        ['Duration', (row) => formatDuration(row.duration)],
      ]} />
    }

    if (activePage === 'Builds') {
      return <DataTable title="Builds" empty="No builds yet" rows={builds} onRowClick={showBuildDetails} columns={[
        ['Build', (row) => `#${row.build_number}`],
        ['Branch', (row) => row.branch],
        ['Commit', (row) => row.commit_hash?.slice(0, 7) ?? 'Not available'],
        ['Status', (row) => <StatusBadge status={row.status} />],
        ['Duration', (row) => formatDuration(row.duration)],
        ['Date', (row) => formatDate(row.created_at)],
      ]} />
    }

    if (activePage === 'Deployments') {
      return <DataTable title="Deployments" empty="No deployments yet" rows={deployments} onRowClick={showDeploymentDetails} columns={[
        ['Version', (row) => row.version],
        ['Environment', (row) => row.environment],
        ['Status', (row) => <StatusBadge status={row.status} />],
        ['Deployment Time', (row) => formatDate(row.deployed_at)],
      ]} />
    }

    if (activePage === 'Containers') {
      return (
        <section className="panel table-panel">
          <div className="section-heading"><h2>Containers</h2></div>
          {!containersConfigured ? <EmptyState message="Docker is Not configured" /> : null}
          {containersConfigured ? <DataTable title="" empty="No containers found" rows={containers} columns={[
            ['Name', (row) => row.name],
            ['Image', (row) => row.image],
            ['Status', (row) => row.status],
            ['Port', (row) => row.port],
          ]} /> : null}
        </section>
      )
    }

    if (activePage === 'Logs') {
      return (
        <section className="panel">
          <div className="section-heading"><h2>Logs</h2></div>
          <h3>Build Logs</h3>
          <LogList logs={logs.buildLogs} />
          <h3>Deployment Logs</h3>
          <LogList logs={logs.deploymentLogs} />
        </section>
      )
    }

    return (
      <section className="panel settings-panel">
        <div className="section-heading"><h2>Settings</h2></div>
        {settings ? (
          <div className="settings-grid">
            <Setting label="Backend Port" value={settings.backend.port} />
            <Setting label="Database" value={settings.backend.databaseOnline ? 'Online' : 'Offline'} />
            <Setting label="GitHub Actions" value={settings.integrations.githubActions.configured ? 'Configured' : 'Not configured'} />
            <Setting label="Jenkins" value={settings.integrations.jenkins.configured ? 'Configured' : 'Not configured'} />
            <Setting label="Docker" value={settings.integrations.docker.configured ? 'Configured' : 'Not configured'} />
            <Setting label="Notifications" value={settings.integrations.notifications.configured ? 'Configured' : 'Not configured'} />
          </div>
        ) : <EmptyState message="Settings unavailable" />}
      </section>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

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
          renderPage()
        )}
      </main>

      {detailTitle ? (
        <div className="drawer-backdrop" role="presentation" onClick={() => setDetailTitle(null)}>
          <aside className="detail-drawer" aria-label={detailTitle} onClick={(event) => event.stopPropagation()}>
            <div className="drawer-header">
              <h2>{detailTitle}</h2>
              <button type="button" onClick={() => setDetailTitle(null)}>Close</button>
            </div>
            {detailBody}
          </aside>
        </div>
      ) : null}
    </div>
  )
}

type Column<T> = [string, (row: T) => React.ReactNode]

function DataTable<T extends { id?: number | string }>({
  title,
  empty,
  rows,
  columns,
  onRowClick,
}: {
  title: string
  empty: string
  rows: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void | Promise<void>
}) {
  return (
    <section className={title ? 'panel table-panel' : 'table-panel nested-table'}>
      {title ? <div className="section-heading"><h2>{title}</h2></div> : null}
      {rows.length === 0 ? (
        <EmptyState message={empty} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>{columns.map(([label]) => <th key={label}>{label}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  className={onRowClick ? 'clickable-row' : undefined}
                  key={row.id ?? index}
                  onClick={() => void onRowClick?.(row)}
                >
                  {columns.map(([label, render]) => <td key={label}>{render(row)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div className="setting-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default App
