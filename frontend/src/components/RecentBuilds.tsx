import type { Build } from '../types'
import { StatusBadge } from './StatusBadge'

interface RecentBuildsProps {
  builds: Build[]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDuration(duration: number | null) {
  if (duration === null) {
    return 'Pending'
  }

  if (duration < 60) {
    return `${duration}s`
  }

  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
}

function shortCommit(commitHash: string | null) {
  return commitHash ? commitHash.slice(0, 7) : 'Not available'
}

export function RecentBuilds({ builds }: RecentBuildsProps) {
  const recentBuilds = [...builds].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return (
    <section className="panel table-panel">
      <div className="section-heading">
        <h2>Recent Builds</h2>
      </div>

      {recentBuilds.length === 0 ? (
        <div className="empty-state">No builds yet</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Build</th>
                <th>Branch</th>
                <th>Commit</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentBuilds.map((build) => (
                <tr key={build.id}>
                  <td>#{build.build_number}</td>
                  <td>{build.branch}</td>
                  <td className="mono">{shortCommit(build.commit_hash)}</td>
                  <td>
                    <StatusBadge status={build.status} />
                  </td>
                  <td>{formatDuration(build.duration)}</td>
                  <td>{formatDate(build.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
