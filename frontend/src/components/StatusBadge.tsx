interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase()
  const tone =
    normalizedStatus === 'success'
      ? 'success'
      : normalizedStatus === 'failed'
        ? 'failed'
        : normalizedStatus === 'running'
          ? 'running'
          : 'neutral'

  return <span className={`badge badge-${tone}`}>{status.toUpperCase()}</span>
}
