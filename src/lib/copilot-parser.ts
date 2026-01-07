import { CopilotEvent } from '@/types/copilot';

export function parseJsonl(content: string): CopilotEvent[] {
  const lines = content.trim().split('\n').filter(line => line.trim());
  const events: CopilotEvent[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const parsed = JSON.parse(line) as CopilotEvent;
      parsed._rawLine = line;
      parsed._parsedDate = new Date(parsed.timestamp);
      parsed._index = i;
      events.push(parsed);
    } catch (error) {
      console.warn(`Failed to parse line ${i + 1}:`, error);
    }
  }

  return events.sort((a, b) => 
    (a._parsedDate?.getTime() || 0) - (b._parsedDate?.getTime() || 0)
  );
}

export function getEventTypeCategory(type: string): string {
  if (type.startsWith('session.')) return 'session';
  if (type.startsWith('user.')) return 'user';
  if (type.startsWith('assistant.')) return 'assistant';
  if (type.startsWith('tool.')) return 'tool';
  return 'other';
}

export function getBadgeClass(type: string): string {
  const category = getEventTypeCategory(type);
  switch (category) {
    case 'user': return 'badge-user';
    case 'assistant': return 'badge-assistant';
    case 'session': return 'badge-session';
    case 'tool': return 'badge-tool';
    default: return 'badge-info';
  }
}

export function formatTimestamp(date: Date | undefined, tzMode: 'local' | 'utc'): string {
  if (!date || isNaN(date.getTime())) return '-';
  
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const pad3 = (n: number) => String(n).padStart(3, '0');

  if (tzMode === 'utc') {
    return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())} ` +
      `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}:${pad2(date.getUTCSeconds())}.` +
      `${pad3(date.getUTCMilliseconds())}Z`;
  }

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const offsetStr = `${sign}${pad2(Math.floor(absOffset / 60))}:${pad2(absOffset % 60)}`;

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ` +
    `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}.` +
    `${pad3(date.getMilliseconds())} ${offsetStr}`;
}

export function getDayKey(date: Date | undefined, tzMode: 'local' | 'utc'): string {
  if (!date || isNaN(date.getTime())) return '-';
  
  const pad2 = (n: number) => String(n).padStart(2, '0');

  if (tzMode === 'utc') {
    return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
  }
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function formatDelta(ms: number): string {
  if (!Number.isFinite(ms)) return '';
  
  const abs = Math.abs(ms);
  const sign = ms < 0 ? '-' : '+';
  
  if (abs < 1000) return `${sign}${Math.round(abs)}ms`;
  if (abs < 60_000) return `${sign}${(abs / 1000).toFixed(abs < 10_000 ? 2 : 1)}s`;
  if (abs < 3_600_000) {
    const m = Math.floor(abs / 60_000);
    const s = Math.floor((abs % 60_000) / 1000);
    return `${sign}${m}m ${String(s).padStart(2, '0')}s`;
  }
  if (abs < 86_400_000) {
    const h = Math.floor(abs / 3_600_000);
    const m = Math.floor((abs % 3_600_000) / 60_000);
    return `${sign}${h}h ${m}m`;
  }
  const d = Math.floor(abs / 86_400_000);
  const h = Math.floor((abs % 86_400_000) / 3_600_000);
  return `${sign}${d}d ${h}h`;
}

export function summarizeEvent(event: CopilotEvent): string {
  const { type, data } = event;
  const maxLen = 260;

  const normalize = (text: string) => {
    const singleLine = text.replace(/\s+/g, ' ').trim();
    return singleLine.length <= maxLen ? singleLine : singleLine.slice(0, maxLen - 1) + '…';
  };

  switch (type) {
    case 'session.start': {
      const d = data as { copilotVersion?: string; producer?: string };
      return normalize(`Session started - ${d.producer || 'copilot'} v${d.copilotVersion || '?'}`);
    }
    case 'session.info': {
      const d = data as { infoType?: string; message?: string };
      return normalize(`[${d.infoType || 'info'}] ${d.message || ''}`);
    }
    case 'session.end':
      return 'Session ended';
    case 'session.truncation': {
      const d = data as { tokensRemovedDuringTruncation?: number };
      return normalize(`Truncation: ${d.tokensRemovedDuringTruncation || 0} tokens removed`);
    }
    case 'user.message': {
      const d = data as { content?: string };
      return normalize(`User: ${d.content || ''}`);
    }
    case 'assistant.message': {
      const d = data as { content?: string; toolRequests?: { name: string }[] };
      if (d.toolRequests && d.toolRequests.length > 0) {
        const tools = d.toolRequests.map(t => t.name).join(', ');
        return normalize(`Assistant calls: ${tools}`);
      }
      return normalize(`Assistant: ${d.content || '(no content)'}`);
    }
    case 'assistant.turn_start': {
      const d = data as { turnId?: string };
      return `Turn ${d.turnId || '?'} started`;
    }
    case 'assistant.turn_end': {
      const d = data as { turnId?: string };
      return `Turn ${d.turnId || '?'} ended`;
    }
    case 'tool.execution_start': {
      const d = data as { toolName?: string; arguments?: Record<string, unknown> };
      const args = d.arguments || {};
      const preview = Object.keys(args).slice(0, 2).map(k => `${k}=...`).join(', ');
      return normalize(`⚡ ${d.toolName || 'tool'}(${preview})`);
    }
    case 'tool.execution_complete': {
      const d = data as { toolName?: string; success?: boolean };
      const status = d.success ? '✓' : '✗';
      return normalize(`${status} ${d.toolName || 'tool'} completed`);
    }
    default:
      return normalize(type);
  }
}

export function getUniqueTypes(events: CopilotEvent[]): string[] {
  const types = new Set<string>();
  events.forEach(e => types.add(e.type));
  return Array.from(types).sort();
}

export function filterEvents(
  events: CopilotEvent[],
  filters: { query: string; type: string; hideToolDetails: boolean }
): CopilotEvent[] {
  return events.filter(event => {
    // Type filter
    if (filters.type !== 'all' && event.type !== filters.type) {
      return false;
    }

    // Hide tool details (turn start/end, truncation)
    if (filters.hideToolDetails) {
      const hiddenTypes = ['assistant.turn_start', 'assistant.turn_end', 'session.truncation'];
      if (hiddenTypes.includes(event.type)) {
        return false;
      }
    }

    // Search query
    if (filters.query) {
      const searchLower = filters.query.toLowerCase();
      const jsonStr = JSON.stringify(event).toLowerCase();
      if (!jsonStr.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });
}

export function compressToUrl(content: string): string {
  try {
    const base64 = btoa(unescape(encodeURIComponent(content)));
    return base64;
  } catch {
    return '';
  }
}

export function decompressFromUrl(compressed: string): string {
  try {
    const decoded = decodeURIComponent(escape(atob(compressed)));
    return decoded;
  } catch {
    return '';
  }
}
