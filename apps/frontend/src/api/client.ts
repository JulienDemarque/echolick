import {
  generateChorusRouteApiGenerateChorusPost,
  generateLickRouteApiGenerateLickPost,
  listFormBarsRouteApiFormsFormIdBarsGet,
  listFormsRouteApiFormsGet,
  listLicksRouteApiLicksGet,
  healthcheckHealthGet,
} from './generated/sdk.gen'
import type {
  FormBarContext,
  FormSummary,
  GenerateChorusRequest,
  GenerateLickRequest,
  GeneratedChorus,
  GeneratedLick,
  HealthcheckHealthGetResponse,
  StoredLick,
} from './generated/types.gen'
import { client as generatedClient } from './generated/client.gen'

export type GenerateLickResponse = GeneratedLick
export type GenerateChorusResponse = GeneratedChorus
export type HealthResponse = HealthcheckHealthGetResponse
export type FormSummaryResponse = FormSummary
export type FormBarResponse = FormBarContext
export type StoredLickResponse = StoredLick
export type { GenerateChorusRequest, GenerateLickRequest }

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

export const postGenerateChorus = async (
  apiBaseUrl: string,
  payload: GenerateChorusRequest,
): Promise<GenerateChorusResponse> => {
  const { data, error } = await generateChorusRouteApiGenerateChorusPost({
    client: withBaseUrl(apiBaseUrl),
    body: payload,
  })
  if (error) {
    throw new Error(`Generate chorus failed: ${JSON.stringify(error)}`)
  }
  if (!data) {
    throw new Error('Generate chorus failed: empty response payload')
  }
  return data
}

export const fetchForms = async (apiBaseUrl: string): Promise<FormSummaryResponse[]> => {
  const { data, error } = await listFormsRouteApiFormsGet({
    client: withBaseUrl(apiBaseUrl),
  })
  if (error) {
    throw new Error(`Forms fetch failed: ${JSON.stringify(error)}`)
  }
  return data ?? []
}

export const fetchFormBars = async (
  apiBaseUrl: string,
  formId: string,
): Promise<FormBarResponse[]> => {
  const { data, error } = await listFormBarsRouteApiFormsFormIdBarsGet({
    client: withBaseUrl(apiBaseUrl),
    path: { form_id: formId },
  })
  if (error) {
    throw new Error(`Form bars fetch failed: ${JSON.stringify(error)}`)
  }
  return data ?? []
}

export const fetchLicks = async (
  apiBaseUrl: string,
  {
    formId,
    barIndex,
    notePolicy,
    limit = 200,
  }: {
    formId?: string
    barIndex?: number
    notePolicy?: string
    limit?: number
  },
): Promise<StoredLickResponse[]> => {
  const query: {
    form_id?: string
    bar_index?: number
    note_policy?: string
    limit: number
  } = { limit }
  if (formId !== undefined) query.form_id = formId
  if (barIndex !== undefined) query.bar_index = barIndex
  if (notePolicy !== undefined) query.note_policy = notePolicy

  const { data, error } = await listLicksRouteApiLicksGet({
    client: withBaseUrl(apiBaseUrl),
    query,
  })
  if (error) {
    throw new Error(`Licks fetch failed: ${JSON.stringify(error)}`)
  }
  return data ?? []
}
