import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  tone: 'blue' | 'green' | 'amber' | 'slate'
}

export function StatCard({ title, value, icon: Icon, tone }: StatCardProps) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
      <div className="stat-icon">
        <Icon size={20} aria-hidden="true" />
      </div>
    </article>
  )
}
