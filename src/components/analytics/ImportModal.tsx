'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileUp, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { importRowSchema } from '@/lib/validations/import';
import type { RawAnalysisRecord } from '@/lib/compute-analytics';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (records: RawAnalysisRecord[], fileName: string) => void;
}

export function ImportModal({ open, onClose, onImport }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown>[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setIsProcessing(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const parsePreview = useCallback(async (f: File) => {
    const text = await f.text();
    const name = f.name.toLowerCase();

    try {
      if (name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        const rows = Array.isArray(parsed) ? parsed : [parsed];
        setPreview(rows.slice(0, 5));
      } else if (name.endsWith('.csv')) {
        const Papa = (await import('papaparse')).default;
        const result = Papa.parse(text, { header: true, preview: 5, skipEmptyLines: true });
        setPreview(result.data as Record<string, unknown>[]);
      }
    } catch {
      toast.error('Erro ao ler o arquivo.');
    }
  }, []);

  const handleFileSelect = useCallback(
    (f: File) => {
      const name = f.name.toLowerCase();
      if (!name.endsWith('.csv') && !name.endsWith('.json')) {
        toast.error('Formato inválido. Use .csv ou .json.');
        return;
      }
      setFile(f);
      parsePreview(f);
    },
    [parsePreview],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFileSelect(f);
    },
    [handleFileSelect],
  );

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const text = await file.text();
      const name = file.name.toLowerCase();
      let rawRows: Record<string, unknown>[];

      if (name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        rawRows = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        const Papa = (await import('papaparse')).default;
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });
        rawRows = result.data as Record<string, unknown>[];
      }

      if (rawRows.length === 0) {
        toast.error('Arquivo vazio.');
        setIsProcessing(false);
        return;
      }

      const validRecords: RawAnalysisRecord[] = [];
      let errorCount = 0;

      for (const raw of rawRows) {
        const parsed = importRowSchema.safeParse(raw);
        if (!parsed.success) {
          errorCount++;
          continue;
        }
        validRecords.push({
          imageName: parsed.data.imageName,
          status: parsed.data.status,
          plantType: parsed.data.plantType ?? null,
          pathology: parsed.data.pathology ?? null,
          confidence: parsed.data.confidence,
          description: parsed.data.description ?? '',
          recommendations: parsed.data.recommendations ?? '',
          createdAt: parsed.data.createdAt?.toISOString(),
        });
      }

      if (validRecords.length === 0) {
        toast.error('Nenhum registro válido encontrado no arquivo.');
        setIsProcessing(false);
        return;
      }

      if (errorCount > 0) {
        toast.warning(`${errorCount} registros ignorados por erros de validação.`);
      }

      toast.success(`${validRecords.length} registros carregados para análise.`);
      onImport(validRecords, file.name);
      handleClose();
    } catch {
      toast.error('Erro ao processar o arquivo.');
    } finally {
      setIsProcessing(false);
    }
  }, [file, onImport, handleClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="relative mx-4 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Importar Dados
              </h2>
              <p className="text-xs text-muted-foreground">
                CSV ou JSON — visualização temporária, sem salvar no seu perfil
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-200',
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/30',
              file && 'border-primary/30 bg-primary/5',
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
            <Upload
              className={cn(
                'h-8 w-8 transition-colors',
                file ? 'text-primary' : 'text-muted-foreground',
              )}
            />
            {file ? (
              <div className="mt-3 text-center">
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                >
                  Trocar arquivo
                </Button>
              </div>
            ) : (
              <div className="mt-3 text-center">
                <p className="text-sm font-medium text-foreground">
                  Arraste um arquivo ou clique para selecionar
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Formatos: .csv, .json
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && preview.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Preview (primeiros {preview.length} registros)
              </p>
              <div className="max-h-40 overflow-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {Object.keys(preview[0]).slice(0, 5).map((key) => (
                        <th key={key} className="px-3 py-2 text-left font-medium text-muted-foreground">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        {Object.values(row).slice(0, 5).map((val, j) => (
                          <td key={j} className="max-w-[120px] truncate px-3 py-2 text-foreground">
                            {String(val ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={!file || isProcessing}
              onClick={handleAnalyze}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <FileUp className="mr-1.5 h-3.5 w-3.5" />
                  Importar
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
