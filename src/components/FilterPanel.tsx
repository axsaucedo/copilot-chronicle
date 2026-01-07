import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X } from 'lucide-react';

interface FilterPanelProps {
  tzMode: 'local' | 'utc';
  onTzModeChange: (mode: 'local' | 'utc') => void;
  query: string;
  onQueryChange: (query: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  availableTypes: string[];
  hideToolDetails: boolean;
  onHideToolDetailsChange: (hide: boolean) => void;
  onClear: () => void;
}

export function FilterPanel({
  tzMode,
  onTzModeChange,
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
  availableTypes,
  hideToolDetails,
  onHideToolDetailsChange,
  onClear,
}: FilterPanelProps) {
  return (
    <section className="panel p-4 mb-4">
      <div className="flex flex-wrap items-end gap-4">
        {/* Timezone */}
        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <label className="text-xs text-muted-foreground">Timezone</label>
          <div className="segmented">
            <button
              className={tzMode === 'local' ? 'active' : ''}
              onClick={() => onTzModeChange('local')}
            >
              Local
            </button>
            <button
              className={tzMode === 'utc' ? 'active' : ''}
              onClick={() => onTzModeChange('utc')}
            >
              UTC
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-1.5 min-w-[200px] flex-1 max-w-[300px]">
          <label className="text-xs text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="message, tool name..."
              className="pl-9 bg-secondary/50"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-xs text-muted-foreground">Type</label>
          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger className="bg-secondary/50">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {availableTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hide Tool Details */}
        <div className="flex items-center gap-2 pb-2">
          <Checkbox
            id="hideToolDetails"
            checked={hideToolDetails}
            onCheckedChange={(checked) => onHideToolDetailsChange(!!checked)}
          />
          <label
            htmlFor="hideToolDetails"
            className="text-xs text-muted-foreground cursor-pointer"
          >
            Hide turn/truncation
          </label>
        </div>

        {/* Clear */}
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="mb-0.5"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Clear
        </Button>
      </div>
    </section>
  );
}
