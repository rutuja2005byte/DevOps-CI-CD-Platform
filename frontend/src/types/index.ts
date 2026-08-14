export interface HealthResponse {
  status: string
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
