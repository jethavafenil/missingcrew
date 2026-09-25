'use client'

import { mutate } from 'swr'

export class FetchError extends Error {
  constructor(message: string, public readonly status: number, public readonly payload?: unknown) {
    super(message)
    this.name = 'FetchError'
  }
}

export async function swrFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  const payload = await response.json().catch(() => undefined)
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload ? String(payload.error) : `Request failed (${response.status})`
    throw new FetchError(message, response.status, payload)
  }
  return payload as T
}

export async function apiMutation<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  })
  const payload = await response.json().catch(() => undefined)
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload ? String(payload.error) : `Request failed (${response.status})`
    throw new FetchError(message, response.status, payload)
  }
  return payload as T
}

export async function mutateAndRevalidate<T>(key: string, request: Promise<T>): Promise<T> {
  const result = await request
  await mutate(key)
  return result
}
