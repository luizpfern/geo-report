const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data;
}

export function fetchReportTypes() {
  return request('/api/report-types');
}

export function fetchReports(lat, lon, radiusKm = 100) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    radiusKm: String(radiusKm),
  });
  return request(`/api/reports?${params.toString()}`);
}

export function createReport(payload) {
  return request('/api/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
