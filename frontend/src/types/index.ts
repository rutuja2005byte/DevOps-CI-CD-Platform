export interface HealthResponse {
  status: string
  database?: string
}

export interface User {
  id: number
  name?: string
  email?: string
  created_at?: string
}

export interface Build {
  id: number
  build_number: number
  branch: string
  commit_hash: string | null
  status: string
  duration: number | null
  created_at: string
}

export interface Deployment {
  id: number
  version: string
  environment: string
  status: string
  deployed_at: string
}

export interface Pipeline {
  id: number | string
  name?: string
  branch: string
  status: string
  latest_build?: number | null
  duration: number | null
  updated_at?: string
  builds?: Build[]
}

export interface ContainerInfo {
  id: string
  name: string
  image: string
  status: string
  port: string
}

export interface ContainersResponse {
  configured: boolean
  message?: string
  containers: ContainerInfo[]
}

export interface LogEntry {
  message: string
  created_at?: string
}

export interface LogsResponse {
  buildLogs: LogEntry[]
  deploymentLogs: LogEntry[]
}

export interface SettingsResponse {
  backend: {
    port: string
    databaseConfigured: boolean
    databaseOnline: boolean
  }
  integrations: {
    githubActions: { configured: boolean }
    jenkins: { configured: boolean }
    docker: { configured: boolean }
    notifications: { configured: boolean }
  }
}
