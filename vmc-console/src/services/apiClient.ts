/**
 * Base HTTP client for VMware regional datacenter APIs.
 *
 * Tokens: The VMware Cloud API uses OAuth2 bearer tokens obtained from
 * https://console.cloud.vmware.com/csp/gateway/am/api/auth/api-tokens/authorize
 * For vCenter REST API, session tokens are obtained via POST /api/session.
 *
 * This client automatically attaches the bearer token from the auth store and
 * falls back to mock data when USE_MOCK_API=true (the default for local dev).
 */

import { USE_MOCK_API } from './apiConfig';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  /** Auth token (VMC API bearer or vCenter session token) */
  token?: string;
}

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, token } = options;

  const allHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...headers,
  };

  if (token) {
    allHeaders['Authorization'] = `Bearer ${token}`;
    allHeaders['vmware-api-session-id'] = token;
  }

  const response = await fetch(url, {
    method,
    headers: allHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, text);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

/** vCenter REST API client (per-region) */
export function vcenterClient(baseUrl: string, sessionToken?: string) {
  const call = <T>(path: string, opts?: RequestOptions) =>
    request<T>(`${baseUrl}${path}`, { ...opts, token: sessionToken });

  return {
    get:    <T>(path: string)                   => call<T>(path),
    post:   <T>(path: string, body: unknown)    => call<T>(path, { method: 'POST', body }),
    put:    <T>(path: string, body: unknown)    => call<T>(path, { method: 'PUT',  body }),
    patch:  <T>(path: string, body: unknown)    => call<T>(path, { method: 'PATCH', body }),
    delete: <T>(path: string)                   => call<T>(path, { method: 'DELETE' }),
  };
}

/** NSX-T Manager API client (per-region) */
export function nsxClient(baseUrl: string, token?: string) {
  const call = <T>(path: string, opts?: RequestOptions) =>
    request<T>(`${baseUrl}${path}`, { ...opts, token });

  return {
    get:    <T>(path: string)                   => call<T>(path),
    post:   <T>(path: string, body: unknown)    => call<T>(path, { method: 'POST', body }),
    put:    <T>(path: string, body: unknown)    => call<T>(path, { method: 'PUT',  body }),
    delete: <T>(path: string)                   => call<T>(path, { method: 'DELETE' }),
  };
}

/** VMC Management API client (global — not region-specific) */
export function vmcClient(baseUrl: string, token?: string) {
  const call = <T>(path: string, opts?: RequestOptions) =>
    request<T>(`${baseUrl}${path}`, { ...opts, token });

  return {
    get:  <T>(path: string)                => call<T>(path),
    post: <T>(path: string, body: unknown) => call<T>(path, { method: 'POST', body }),
  };
}

export { USE_MOCK_API };
