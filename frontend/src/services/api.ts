import type { Build, Deployment, HealthResponse, User } from '../types'

const API_URL = 'http://localhost:5001/api'

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`)

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
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
