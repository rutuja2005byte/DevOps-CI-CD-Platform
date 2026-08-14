import type { Build } from '../types'

interface BuildOverviewProps {
  builds: Build[]
}

export function BuildOverview({ builds }: BuildOverviewProps) {
  const total = builds.length
  const successful = builds.filter(
    (build) => build.status.toLowerCase() === 'success',
  ).length
  const failed = builds.filter(
    (build) => build.status.toLowerCase() === 'failed',
  ).length
  const successRate = total > 0 ? Math.round((successful / total) * 100) : 0

  return (
    <section className="panel build-overview">
      <div className="section-heading">
        <h2>Build Overview</h2>
      </div>

      <div className="build-metrics">
        <div>
          <span>Total Builds</span>
          <strong>{total}</strong>
        </div>
        <div>
          <span>Successful</span>
          <strong>{successful}</strong>
        </div>
        <div>
          <span>Failed</span>
          <strong>{failed}</strong>
        </div>
        <div>
          <span>Success Rate</span>
          <strong>{successRate}%</strong>
        </div>
      </div>

      <div className="progress-track" aria-label={`Build success rate ${successRate}%`}>
        <span style={{ width: `${successRate}%` }} />
      </div>
    </section>
  )
}
