'use client';

import { useCallback, useState, useRef, useId } from 'react';
import { Upload, X, ImageIcon, ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadZoneProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

export function UploadZone({ onUpload, isLoading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Formato inválido. Use JPEG, PNG ou WebP.';
    }
    if (file.size > MAX_SIZE) {
      return 'Arquivo muito grande. Máximo 10MB.';
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    },
    [validateFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleClear = useCallback(() => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedFile) onUpload(selectedFile);
  }, [selectedFile, onUpload]);

  return (
    <div className="space-y-3">
      {preview ? (
        /* ── Preview state ── */
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm animate-fade-in">
          <div className="relative aspect-video w-full bg-muted/20 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview da imagem selecionada"
              className="h-full w-full object-contain"
            />
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                {/* Scan line animation */}
                <div className="relative h-40 w-40 overflow-hidden rounded-xl border border-primary/30">
                  <div className="absolute inset-0 bg-primary/5" />
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan"
                    aria-hidden="true"
                  />
                  <ScanLine className="absolute inset-0 m-auto h-8 w-8 text-primary/40" />
                </div>
                <p className="text-sm font-medium text-foreground">Analisando espécime...</p>
                <p className="text-xs text-muted-foreground">IA em processamento</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <ImageIcon className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{selectedFile?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={isLoading}
                aria-label="Remover imagem selecionada"
              >
                <X className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                Remover
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="mr-1.5 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                    Analisando...
                  </>
                ) : (
                  'Analisar'
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Drop zone ── */
        <div
          role="button"
          tabIndex={0}
          aria-label="Clique ou arraste uma imagem para analisar"
          aria-describedby={error ? errorId : undefined}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
          className={cn(
            'group relative flex cursor-pointer flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border-2 border-dashed py-14 px-8 transition-all duration-200',
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.005]'
              : 'border-border hover:border-primary/40 hover:bg-accent/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        >
          {/* Background grid pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
            aria-hidden="true"
          />

          {/* Icon */}
          <div
            className={cn(
              'relative flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200',
              isDragging
                ? 'bg-primary/15 scale-110'
                : 'bg-muted group-hover:bg-primary/10',
            )}
          >
            <Upload
              className={cn(
                'h-7 w-7 transition-colors duration-200',
                isDragging ? 'text-primary' : 'text-muted-foreground group-hover:text-primary',
              )}
              aria-hidden="true"
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              {isDragging ? 'Solte para analisar' : 'Arraste a imagem ou clique para selecionar'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG ou WebP — máximo 10 MB</p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleInputChange}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center justify-center gap-1.5 text-center text-sm font-medium text-destructive"
        >
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}
