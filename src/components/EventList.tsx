import { useRef, useEffect } from 'react';
import { CopilotEvent } from '@/types/copilot';
import { formatTimestamp, getDayKey, formatDelta, summarizeEvent, getBadgeClass } from '@/lib/copilot-parser';

interface EventListProps {
  events: CopilotEvent[];
  selectedId: string | null;
  onSelect: (event: CopilotEvent) => void;
  tzMode: 'local' | 'utc';
  totalCount: number;
}

export function EventList({ events, selectedId, onSelect, tzMode, totalCount }: EventListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const firstTimestamp = events[0]?._parsedDate;

  // Group events by day
  const groupedByDay: { day: string; events: CopilotEvent[] }[] = [];
  let currentDay = '';
  
  for (const event of events) {
    const day = getDayKey(event._parsedDate, tzMode);
    if (day !== currentDay) {
      currentDay = day;
      groupedByDay.push({ day, events: [] });
    }
    groupedByDay[groupedByDay.length - 1].events.push(event);
  }

  // Calculate time range
  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];
  const timeRange = firstEvent && lastEvent 
    ? formatDelta((lastEvent._parsedDate?.getTime() || 0) - (firstEvent._parsedDate?.getTime() || 0))
    : '-';

  return (
    <section className="panel flex flex-col min-h-[560px]">
      {/* Stats header */}
      <div className="flex items-baseline justify-between flex-wrap gap-3 px-4 py-3 border-b border-border">
        <div className="text-sm">
          <span className="font-semibold">{events.length}</span>
          <span className="text-muted-foreground"> showing / </span>
          <span className="font-semibold">{totalCount}</span>
          <span className="text-muted-foreground"> events</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {timeRange !== '-' ? `Duration: ${timeRange}` : '-'}
        </div>
      </div>

      {/* Event list */}
      <div 
        ref={listRef} 
        className="flex-1 overflow-auto"
        role="list"
        tabIndex={0}
      >
        {events.length === 0 ? (
          <div className="p-4 text-muted-foreground text-sm">
            No events to display. Load a file to get started.
          </div>
        ) : (
          groupedByDay.map(({ day, events: dayEvents }) => (
            <div key={day}>
              <div className="day-separator">{day}</div>
              {dayEvents.map((event, idx) => {
                const prevEvent = idx > 0 ? dayEvents[idx - 1] : null;
                const delta = prevEvent && event._parsedDate && prevEvent._parsedDate
                  ? event._parsedDate.getTime() - prevEvent._parsedDate.getTime()
                  : null;

                return (
                  <div
                    key={event.id}
                    className={`event-row ${selectedId === event.id ? 'selected' : ''}`}
                    onClick={() => onSelect(event)}
                    role="listitem"
                  >
                    {/* Time column */}
                    <div className="font-mono text-xs leading-tight">
                      <div className="font-semibold text-foreground">
                        {formatTimestamp(event._parsedDate, tzMode).split(' ').slice(1).join(' ')}
                      </div>
                      {delta !== null && delta > 0 && (
                        <div className="text-muted-foreground mt-0.5">
                          {formatDelta(delta)}
                        </div>
                      )}
                      {firstTimestamp && event._parsedDate && (
                        <div className="text-muted-foreground/60 mt-0.5">
                          t{formatDelta(event._parsedDate.getTime() - firstTimestamp.getTime())}
                        </div>
                      )}
                    </div>

                    {/* Content column */}
                    <div>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        <span className={`badge ${getBadgeClass(event.type)}`}>
                          {event.type}
                        </span>
                      </div>
                      <div className="text-sm leading-snug text-foreground break-words">
                        {summarizeEvent(event)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
