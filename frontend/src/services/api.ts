import type {
  Build,
  ContainersResponse,
  Deployment,
  HealthResponse,
  LogsResponse,
  Pipeline,
  SettingsResponse,
  User,
} from '../types'

const API_URL = 'http://localhost:5001/api'

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`)

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

async function post<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { method: 'POST' })

  if (!response.ok) {
    const fallback = `Request failed: ${response.status}`
    try {
      const body = (await response.json()) as { message?: string }
      throw new Error(body.message ?? fallback)
    } catch (error) {
      if (error instanceof Error && error.message !== fallback) {
        throw error
      }
      throw new Error(fallback)
    }
  }

  return response.json() as Promise<T>
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health')
}

export function getUsers(): Promise<User[]> {
  return request<User[]>('/users')
}

export function getBuilds(): Promise<Build[]> {
  return request<Build[]>('/builds')
}

export function getDeployments(): Promise<Deployment[]> {
  return request<Deployment[]>('/deployments')
}

export function getPipelines(): Promise<Pipeline[]> {
  return request<Pipeline[]>('/pipelines')
}

export function getPipeline(id: number | string): Promise<Pipeline> {
  return request<Pipeline>(`/pipelines/${encodeURIComponent(String(id))}`)
}

export function getBuild(id: number): Promise<Build> {
  return request<Build>(`/builds/${id}`)
}

export function getBuildLogs(id: number): Promise<LogsResponse['buildLogs']> {
  return request<LogsResponse['buildLogs']>(`/logs/builds/${id}`)
}

export function getDeployment(id: number): Promise<Deployment> {
  return request<Deployment>(`/deployments/${id}`)
}

export function getDeploymentLogs(
  id: number,
): Promise<LogsResponse['deploymentLogs']> {
  return request<LogsResponse['deploymentLogs']>(`/logs/deployments/${id}`)
}

export function rollbackDeployment(
  id: number,
): Promise<{ configured: boolean; message: string }> {
  return post<{ configured: boolean; message: string }>(
    `/deployments/${id}/rollback`,
  )
}

export function getContainers(): Promise<ContainersResponse> {
  return request<ContainersResponse>('/containers')
}

export function getLogs(): Promise<LogsResponse> {
  return request<LogsResponse>('/logs')
}

export function getSettings(): Promise<SettingsResponse> {
  return request<SettingsResponse>('/settings')
}
