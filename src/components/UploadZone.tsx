'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
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
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
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
    <div className="space-y-4">
      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative aspect-video w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview da imagem selecionada"
              className="h-full w-full object-contain bg-muted/30"
            />
          </div>
          <div className="flex items-center justify-between border-t border-border p-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">{selectedFile?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClear} disabled={isLoading}>
                <X className="mr-1 h-3 w-3" />
                Remover
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Analisando...
                  </span>
                ) : (
                  'Analisar'
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all',
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border hover:border-primary/50 hover:bg-muted/50',
          )}
        >
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl transition-colors',
              isDragging ? 'bg-primary/10' : 'bg-muted group-hover:bg-primary/10',
            )}
          >
            <Upload
              className={cn(
                'h-7 w-7 transition-colors',
                isDragging ? 'text-primary' : 'text-muted-foreground group-hover:text-primary',
              )}
            />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">
            Arraste uma imagem ou clique para selecionar
          </p>
          <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG ou WebP — máximo 10MB</p>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
