import type { Deployment } from '../types'
import { StatusBadge } from './StatusBadge'

interface RecentDeploymentsProps {
  deployments: Deployment[]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function RecentDeployments({ deployments }: RecentDeploymentsProps) {
  const recentDeployments = [...deployments].sort(
    (a, b) =>
      new Date(b.deployed_at).getTime() - new Date(a.deployed_at).getTime(),
  )

  return (
    <section className="panel table-panel">
      <div className="section-heading">
        <h2>Recent Deployments</h2>
      </div>

      {recentDeployments.length === 0 ? (
        <div className="empty-state">No deployments yet</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Version</th>
                <th>Environment</th>
                <th>Status</th>
                <th>Deployed</th>
              </tr>
            </thead>
            <tbody>
              {recentDeployments.map((deployment) => (
                <tr key={deployment.id}>
                  <td>{deployment.version}</td>
                  <td>{deployment.environment}</td>
                  <td>
                    <StatusBadge status={deployment.status} />
                  </td>
                  <td>{formatDate(deployment.deployed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
