// REST API client
// Full implementation in Phase 4

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

export async function fetchTemplates() {
  const res = await fetch(`${API_BASE}/api/templates`);
  return res.json();
}

export async function fetchInstance(id: string) {
  const res = await fetch(`${API_BASE}/api/instances/${id}`);
  return res.json();
}

export async function createInstance(templateId: string) {
  const res = await fetch(`${API_BASE}/api/instances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId }),
  });
  return res.json();
}
