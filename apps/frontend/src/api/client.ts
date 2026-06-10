import {
  generateLickRouteApiGenerateLickPost,
  healthcheckHealthGet,
  type GenerateLickRequest,
  type GeneratedLick,
  type HealthcheckHealthGetResponse,
} from './generated'
import { client as generatedClient } from './generated/client.gen'

export type GenerateLickResponse = GeneratedLick
export type HealthResponse = HealthcheckHealthGetResponse
export type { GenerateLickRequest }

const withBaseUrl = (apiBaseUrl: string) => {
  generatedClient.setConfig({ baseUrl: apiBaseUrl })
  return generatedClient
}

export const fetchHealth = async (apiBaseUrl: string): Promise<HealthResponse> => {
  const { data, error } = await healthcheckHealthGet({
    client: withBaseUrl(apiBaseUrl),
  })
  if (error) {
    throw new Error(`Health failed: ${JSON.stringify(error)}`)
  }
  if (!data) {
    throw new Error('Health failed: empty response payload')
  }
  return data
}

export const postGenerateLick = async (
  apiBaseUrl: string,
  payload: GenerateLickRequest,
): Promise<GenerateLickResponse> => {
  const { data, error } = await generateLickRouteApiGenerateLickPost({
    client: withBaseUrl(apiBaseUrl),
    body: payload,
  })
  if (error) {
    throw new Error(`Generate failed: ${JSON.stringify(error)}`)
  }
  if (!data) {
    throw new Error('Generate failed: empty response payload')
  }
  return data
}
