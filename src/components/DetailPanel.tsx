import { useState, useCallback } from 'react';
import { CopilotEvent } from '@/types/copilot';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Check } from 'lucide-react';

interface DetailPanelProps {
  event: CopilotEvent | null;
}

function truncateStrings(obj: unknown, maxLen = 500): unknown {
  if (typeof obj === 'string') {
    return obj.length > maxLen ? obj.slice(0, maxLen) + '…[truncated]' : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => truncateStrings(item, maxLen));
  }
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = truncateStrings(value, maxLen);
    }
    return result;
  }
  return obj;
}

export function DetailPanel({ event }: DetailPanelProps) {
  const [truncate, setTruncate] = useState(true);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  const copyJson = useCallback(async () => {
    if (!event) return;
    const { _rawLine, _parsedDate, _index, ...clean } = event;
    await navigator.clipboard.writeText(JSON.stringify(clean, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  }, [event]);

  const copyRaw = useCallback(async () => {
    if (!event?._rawLine) return;
    await navigator.clipboard.writeText(event._rawLine);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  }, [event]);

  const getDisplayJson = () => {
    if (!event) return '';
    const { _rawLine, _parsedDate, _index, ...clean } = event;
    const toDisplay = truncate ? truncateStrings(clean) : clean;
    return JSON.stringify(toDisplay, null, 2);
  };

  // Render formatted content based on event type
  const renderPrettyView = () => {
    if (!event) return null;

    const { type, data } = event;

    if (type === 'user.message') {
      const content = (data as { content?: string }).content || '';
      return (
        <div className="p-4 border-b border-border">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            User Message
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>
      );
    }

    if (type === 'assistant.message') {
      const d = data as { content?: string; toolRequests?: { name: string; arguments: Record<string, unknown> }[] };
      return (
        <div className="p-4 border-b border-border space-y-4">
          {d.content && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Response
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {d.content}
              </div>
            </div>
          )}
          {d.toolRequests && d.toolRequests.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Tool Calls ({d.toolRequests.length})
              </div>
              <div className="space-y-2">
                {d.toolRequests.map((tool, i) => (
                  <div key={i} className="tool-block">
                    <div className="tool-header">
                      <span className="tool-name">{tool.name}</span>
                    </div>
                    <div className="p-3 font-mono text-xs overflow-auto max-h-[200px]">
                      {JSON.stringify(tool.arguments, null, 2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (type === 'tool.execution_complete') {
      const d = data as { toolName?: string; success?: boolean; result?: { content: string } };
      return (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tool Result
            </div>
            <span className={`text-xs px-2 py-0.5 rounded ${d.success ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
              {d.success ? 'Success' : 'Failed'}
            </span>
          </div>
          <div className="text-sm font-mono text-muted-foreground mb-2">
            {d.toolName}
          </div>
          {d.result?.content && (
            <div className="tool-block">
              <pre className="p-3 text-xs overflow-auto max-h-[300px] whitespace-pre-wrap">
                {truncate && d.result.content.length > 2000 
                  ? d.result.content.slice(0, 2000) + '\n…[truncated]' 
                  : d.result.content}
              </pre>
            </div>
          )}
        </div>
      );
    }

    if (type === 'session.info') {
      const d = data as { infoType?: string; message?: string };
      return (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-info">{d.infoType || 'info'}</span>
          </div>
          <div className="text-sm leading-relaxed">
            {d.message}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <aside className="panel flex flex-col min-h-[560px] lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-bold text-sm truncate mb-2">
          {event ? event.type : 'Select an event'}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyJson}
            disabled={!event}
          >
            {copiedJson ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            Copy JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copyRaw}
            disabled={!event}
          >
            {copiedRaw ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            Copy raw line
          </Button>
          <div className="flex items-center gap-2">
            <Checkbox
              id="truncate"
              checked={truncate}
              onCheckedChange={(checked) => setTruncate(!!checked)}
            />
            <label htmlFor="truncate" className="text-xs text-muted-foreground cursor-pointer">
              Truncate long strings
            </label>
          </div>
        </div>
      </div>

      {/* Pretty view */}
      {renderPrettyView()}

      {/* JSON toggle label */}
      <div className="px-4 py-2 border-b border-border bg-secondary/30 text-xs text-muted-foreground font-medium">
        Raw JSON
      </div>

      {/* JSON view */}
      <pre className="flex-1 overflow-auto p-4 json-view">
        {event ? getDisplayJson() : 'Load a file to get started.'}
      </pre>
    </aside>
  );
}
