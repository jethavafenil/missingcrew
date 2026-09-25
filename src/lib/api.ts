import { env } from '@/lib/env'
/**
 * Utility function to make API calls with absolute URLs
 * @param endpoint The API endpoint (e.g., '/api/projects')
 * @param options Fetch options
 * @returns Response from the API call
 */
export async function apiFetch(endpoint: string, options?: RequestInit) {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

  // Use the environment variable for the base URL
  const baseUrl = env.NEXT_PUBLIC_API_BASE_URL || '';

  // Ensure proper URL formatting - remove trailing slash from baseUrl if present
  // and ensure there's exactly one slash between baseUrl and endpoint
  const formattedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const url = `${formattedBaseUrl}/${cleanEndpoint}`;

  // Make the API call with the absolute URL
  return fetch(url, options);
}
