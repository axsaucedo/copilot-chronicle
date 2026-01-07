import { useCallback, useState, useRef } from 'react';
import { Upload, FileText } from 'lucide-react';

interface DropZoneProps {
  onFileLoad: (content: string, fileName: string) => void;
}

export function DropZone({ onFileLoad }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileLoad(content, file.name);
    };
    reader.readAsText(file);
  }, [onFileLoad]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={`dropzone min-h-[140px] flex flex-col items-center justify-center gap-2 ${
        isDragging ? 'dragover border-solid' : ''
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      aria-label="Drop zone for JSONL files"
    >
      <div className="flex items-center gap-2 text-foreground">
        {isDragging ? (
          <Upload className="w-5 h-5 text-primary animate-bounce" />
        ) : (
          <FileText className="w-5 h-5 text-primary" />
        )}
        <span className="font-semibold">
          Drop a <code className="text-xs bg-muted px-1.5 py-0.5 rounded">.jsonl</code> file here
        </span>
      </div>
      <div className="text-muted-foreground text-sm">or click to choose a file</div>
      <div className="text-xs text-muted-foreground mt-1">
        Supported: file picker, drag-and-drop, paste, or URL fetch
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jsonl,application/json,text/plain"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
}
