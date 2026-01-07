import { useState } from 'react';
import { DropZone } from './DropZone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Link, Clipboard } from 'lucide-react';

interface InputPanelProps {
  onLoad: (content: string, source: string) => void;
  status: { message: string; type: 'good' | 'error' | 'warn' } | null;
}

export function InputPanel({ onLoad, status }: InputPanelProps) {
  const [activeTab, setActiveTab] = useState<'paste' | 'url'>('paste');
  const [pasteContent, setPasteContent] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRenderPaste = () => {
    if (pasteContent.trim()) {
      onLoad(pasteContent, 'pasted content');
    }
  };

  const handleFetchUrl = async () => {
    if (!urlValue.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(urlValue);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const content = await response.text();
      onLoad(content, urlValue);
    } catch (error) {
      console.error('Failed to fetch URL:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="panel p-4 mb-4">
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
        <DropZone onFileLoad={(content, name) => onLoad(content, name)} />
        
        <div>
          <div className="flex gap-2 mb-3">
            <button
              className={`tab px-3 py-1.5 rounded-full text-sm border transition-colors ${
                activeTab === 'paste' 
                  ? 'border-primary/50 bg-primary/10 text-foreground' 
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('paste')}
            >
              <Clipboard className="w-3.5 h-3.5 inline mr-1.5" />
              Paste
            </button>
            <button
              className={`tab px-3 py-1.5 rounded-full text-sm border transition-colors ${
                activeTab === 'url' 
                  ? 'border-primary/50 bg-primary/10 text-foreground' 
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('url')}
            >
              <Link className="w-3.5 h-3.5 inline mr-1.5" />
              URL
            </button>
          </div>

          {activeTab === 'paste' && (
            <div>
              <Textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Paste JSONL content here..."
                className="min-h-[140px] font-mono text-xs resize-y bg-secondary/50"
              />
              <div className="flex items-center gap-3 mt-3">
                <Button 
                  onClick={handleRenderPaste}
                  disabled={!pasteContent.trim()}
                  className="bg-primary/20 border border-primary/50 text-foreground hover:bg-primary/30"
                >
                  Render pasted content
                </Button>
                <span className="text-xs text-muted-foreground">
                  Tip: the timeline uses one JSON object per line.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'url' && (
            <div>
              <Input
                type="url"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://example.com/session.jsonl"
                className="bg-secondary/50"
              />
              <div className="flex items-center gap-3 mt-3">
                <Button 
                  onClick={handleFetchUrl}
                  disabled={!urlValue.trim() || isLoading}
                  className="bg-primary/20 border border-primary/50 text-foreground hover:bg-primary/30"
                >
                  {isLoading ? 'Fetching...' : 'Fetch and render'}
                </Button>
                <span className="text-xs text-muted-foreground">
                  The URL must allow cross-origin requests (CORS).
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {status && (
        <div className={`mt-3 p-3 rounded-lg border text-sm ${
          status.type === 'error' 
            ? 'border-destructive/50 bg-destructive/10 text-destructive' 
            : status.type === 'warn'
            ? 'border-warning/50 bg-warning/10 text-warning'
            : 'border-success/50 bg-success/10 text-success'
        }`}>
          {status.message}
        </div>
      )}
    </section>
  );
}
