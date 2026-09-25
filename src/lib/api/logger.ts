type SafeFields = Record<string, string | number | boolean | null | undefined>

export function logInfo(event: string, fields: SafeFields = {}) {
  console.info(JSON.stringify({ level: 'info', event, ...fields }))
}

export function logError(event: string, error: unknown, fields: SafeFields = {}) {
  const errorType = error instanceof Error ? error.name : 'UnknownError'
  console.error(JSON.stringify({ level: 'error', event, errorType, ...fields }))
}
