const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

export interface TemplateListItem {
  id: string;
  name: string;
  genre: string;
  description: string;
  playCount: number;
  createdAt: string;
}

export interface TemplateDetail extends TemplateListItem {
  config: {
    cover_emoji?: string;
    characters?: Array<{
      id: string;
      name: string;
      role: string;
      personality: string;
    }>;
    max_turns?: number;
    setting?: {
      background: string;
      tone: string;
      era: string;
    };
  };
}

export interface InstanceData {
  id: string;
  templateId: string;
  status: 'frozen' | 'running' | 'ended';
  currentTurn: number;
  observerCount: number;
  createdAt: string;
  endedAt: string | null;
}

export interface EventData {
  id: number;
  instanceId: string;
  turn: number;
  eventType: 'narration' | 'dialogue' | 'event' | 'ending';
  characterId: string | null;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export async function fetchTemplates(): Promise<TemplateListItem[]> {
  const res = await fetch(`${API_BASE}/api/templates`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
}

export async function fetchTemplate(id: string): Promise<TemplateDetail> {
  const res = await fetch(`${API_BASE}/api/templates/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch template');
  return res.json();
}

export async function fetchInstance(id: string): Promise<InstanceData> {
  const res = await fetch(`${API_BASE}/api/instances/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch instance');
  return res.json();
}

export async function fetchEvents(
  instanceId: string,
  limit = 20,
  offset = 0,
): Promise<EventData[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(
    `${API_BASE}/api/instances/${instanceId}/events?${params}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function createInstance(
  templateId: string,
): Promise<InstanceData> {
  const res = await fetch(`${API_BASE}/api/instances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId }),
  });
  if (!res.ok) throw new Error('Failed to create instance');
  return res.json();
}
