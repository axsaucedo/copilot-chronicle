import { useState, useCallback, useEffect } from 'react';
import { CopilotEvent } from '@/types/copilot';
import { parseJsonl, filterEvents, getUniqueTypes } from '@/lib/copilot-parser';
import { InputPanel } from '@/components/InputPanel';
import { FilterPanel } from '@/components/FilterPanel';
import { EventList } from '@/components/EventList';
import { DetailPanel } from '@/components/DetailPanel';
import { Button } from '@/components/ui/button';
import { Share2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Filters {
  query: string;
  type: string;
  hideToolDetails: boolean;
}

const Index = () => {
  const [events, setEvents] = useState<CopilotEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CopilotEvent | null>(null);
  const [tzMode, setTzMode] = useState<'local' | 'utc'>('local');
  const [filters, setFilters] = useState<Filters>({
    query: '',
    type: 'all',
    hideToolDetails: false,
  });
  const [status, setStatus] = useState<{ message: string; type: 'good' | 'error' | 'warn' } | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);

  // Load from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const params = new URLSearchParams(hash);
    
    // Restore filters from URL
    const tz = params.get('tz');
    if (tz === 'utc' || tz === 'local') setTzMode(tz);
    
    const q = params.get('q');
    if (q) setFilters(f => ({ ...f, query: q }));
    
    const type = params.get('type');
    if (type) setFilters(f => ({ ...f, type }));
    
    const hide = params.get('hide');
    if (hide === '1') setFilters(f => ({ ...f, hideToolDetails: true }));

    // Load content from URL if present
    const content = params.get('content');
    if (content) {
      try {
        const decoded = decodeURIComponent(escape(atob(content)));
        handleLoad(decoded, 'shared URL');
      } catch (e) {
        console.error('Failed to decode content from URL:', e);
      }
    }
  }, []);

  // Sync state to URL
  const syncToUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set('tz', tzMode);
    if (filters.query) params.set('q', filters.query);
    if (filters.type !== 'all') params.set('type', filters.type);
    if (filters.hideToolDetails) params.set('hide', '1');
    
    window.history.replaceState(null, '', `#${params.toString()}`);
  }, [tzMode, filters]);

  useEffect(() => {
    syncToUrl();
  }, [syncToUrl]);

  const handleLoad = useCallback((content: string, source: string) => {
    try {
      const parsed = parseJsonl(content);
      if (parsed.length === 0) {
        setStatus({ message: 'No valid events found in the file.', type: 'warn' });
        return;
      }
      setEvents(parsed);
      setSourceLabel(source);
      setSelectedEvent(null);
      setStatus({ message: `Loaded ${parsed.length} events from ${source}`, type: 'good' });
      
      // Clear status after 3 seconds
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error('Failed to parse content:', error);
      setStatus({ message: 'Failed to parse JSONL content. Check console for details.', type: 'error' });
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (events.length === 0) {
      toast.error('No events to share');
      return;
    }

    // Build share URL with current filters
    const params = new URLSearchParams();
    params.set('tz', tzMode);
    if (filters.query) params.set('q', filters.query);
    if (filters.type !== 'all') params.set('type', filters.type);
    if (filters.hideToolDetails) params.set('hide', '1');

    // For large files, just share filters (not content)
    const content = events.map(e => e._rawLine).join('\n');
    if (content.length < 50000) {
      try {
        const encoded = btoa(unescape(encodeURIComponent(content)));
        params.set('content', encoded);
      } catch {
        console.warn('Content too large to encode in URL');
      }
    }

    const url = `${window.location.origin}${window.location.pathname}#${params.toString()}`;
    
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Share URL copied to clipboard!');
    } catch {
      toast.error('Failed to copy URL');
    }
  }, [events, tzMode, filters]);

  const handleShowPrompts = useCallback(() => {
    const userMessages = events
      .filter(e => e.type === 'user.message')
      .map(e => {
        const content = (e.data as { content?: string }).content || '';
        return content;
      })
      .join('\n\n---\n\n');

    if (!userMessages) {
      toast.info('No user messages found');
      return;
    }

    navigator.clipboard.writeText(userMessages);
    toast.success('User prompts copied to clipboard!');
  }, [events]);

  const filteredEvents = filterEvents(events, filters);
  const availableTypes = getUniqueTypes(events);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <header className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            Copilot CLI Timeline Viewer
          </h1>
          <p className="text-muted-foreground max-w-[70ch] leading-relaxed">
            Open a GitHub Copilot CLI session <code className="text-xs bg-muted px-1.5 py-0.5 rounded">.jsonl</code> file 
            and explore it as an interactive timeline. Times are shown in your local timezone by default.
            {sourceLabel && (
              <span className="text-primary ml-2">Loaded: {sourceLabel}</span>
            )}
          </p>
        </header>

        {/* Input Panel */}
        <InputPanel onLoad={handleLoad} status={status} />

        {/* Filter Panel */}
        <FilterPanel
          tzMode={tzMode}
          onTzModeChange={setTzMode}
          query={filters.query}
          onQueryChange={(q) => setFilters(f => ({ ...f, query: q }))}
          typeFilter={filters.type}
          onTypeFilterChange={(t) => setFilters(f => ({ ...f, type: t }))}
          availableTypes={availableTypes}
          hideToolDetails={filters.hideToolDetails}
          onHideToolDetailsChange={(h) => setFilters(f => ({ ...f, hideToolDetails: h }))}
          onClear={() => setFilters({ query: '', type: 'all', hideToolDetails: false })}
        />

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            onClick={handleShowPrompts}
            disabled={events.length === 0}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Show prompts
          </Button>
          <Button
            variant="outline"
            onClick={handleShare}
            disabled={events.length === 0}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share as URL
          </Button>
        </div>

        {/* Main content */}
        <main className="grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-4 items-start">
          <EventList
            events={filteredEvents}
            selectedId={selectedEvent?.id || null}
            onSelect={setSelectedEvent}
            tzMode={tzMode}
            totalCount={events.length}
          />
          <DetailPanel event={selectedEvent} />
        </main>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-border text-center text-xs text-muted-foreground">
          <p>
            Copilot CLI Timeline Viewer • Inspired by{' '}
            <a 
              href="https://tools.simonwillison.net/claude-code-timeline" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Simon Willison's Claude Code Timeline Viewer
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
