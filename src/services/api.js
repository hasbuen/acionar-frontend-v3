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

  const contentType = response.headers.get('content-type') || '';
  let result = null;

  if (contentType.includes('application/json')) {
    result = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => '');
    result = { message: response.statusText || 'Servidor indisponível temporariamente.' };
  }

  if (!response.ok) {
    throw new Error(result?.message || result?.error || `Erro HTTP ${response.status}`);
  }

  return result;
}

