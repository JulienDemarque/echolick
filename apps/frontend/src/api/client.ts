import type { Degree } from '../music/progression'

export type HealthResponse = {
  status: string
}

export type GenerateLickResponse = {
  key: string
  degree: Degree
  chord: string
  flavor: 'minor' | 'major'
  tempo: number
  timeSignature: '4/4'
  notes: Array<{
    midi: number
    noteName: string
    start: number
    duration: number
    velocity: number
    technique?: string
  }>
}

type GenerateLickRequest = {
  key: 'A'
  degree: Degree
  chord: string
  flavor: 'minor' | 'major'
  tempo: number
}

const readError = async (response: Response): Promise<string> => {
  const body = await response.text()
  return body ? `${response.status}: ${body}` : `HTTP ${response.status}`
}

export const fetchHealth = async (apiBaseUrl: string): Promise<HealthResponse> => {
  const response = await fetch(`${apiBaseUrl}/health`)
  if (!response.ok) {
    throw new Error(`Health failed: ${await readError(response)}`)
  }
  return (await response.json()) as HealthResponse
}

export const postGenerateLick = async (
  apiBaseUrl: string,
  payload: GenerateLickRequest,
): Promise<GenerateLickResponse> => {
  const response = await fetch(`${apiBaseUrl}/api/generate-lick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`Generate failed: ${await readError(response)}`)
  }
  return (await response.json()) as GenerateLickResponse
}
