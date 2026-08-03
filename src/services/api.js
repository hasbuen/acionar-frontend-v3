const API_BASE = '/api';

export async function apiRequest(endpoint, method = 'GET', data = null, headers = {}) {
  const token = localStorage.getItem('acionar_v3_token');
  const tenantSlug = localStorage.getItem('acionar_v3_slug') || '';

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantSlug ? { 'x-tenant-slug': tenantSlug } : {}),
    ...headers,
  };

  const config = {
    method,
    headers: requestHeaders,
    ...(data ? { body: JSON.stringify(data) } : {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Request failed.');
  }

  return result;
}
