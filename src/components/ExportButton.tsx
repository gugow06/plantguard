'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';

interface ExportItem {
  imageName: string;
  status: string;
  confidence: number;
  plantType: string | null;
  pathology: string | null;
  description: string;
  createdAt: string;
}

interface ExportButtonProps {
  fetchAllData: () => Promise<ExportItem[]>;
}

function toCsv(data: ExportItem[]): string {
  const headers = ['imageName', 'status', 'confidence', 'plantType', 'pathology', 'description', 'createdAt'];
  const escape = (val: string | null | number) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = data.map((item) =>
    headers.map((h) => escape(item[h as keyof ExportItem])).join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}

export function ExportButton({ fetchAllData }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport(format: 'csv' | 'json') {
    setIsExporting(true);
    try {
      const data = await fetchAllData();

      if (data.length === 0) {
        toast.error('Nenhuma análise para exportar.');
        return;
      }

      const timestamp = new Date().toISOString().slice(0, 10);

      if (format === 'csv') {
        const csv = toCsv(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `plantguard-historico-${timestamp}.csv`);
      } else {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        saveAs(blob, `plantguard-historico-${timestamp}.json`);
      }

      toast.success(`Exportado como ${format.toUpperCase()} com sucesso!`);
    } catch {
      toast.error('Erro ao exportar dados.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" disabled={isExporting} />}
      >
        {isExporting ? (
          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
        ) : (
          <Download className="mr-1.5 h-3 w-3" />
        )}
        Exportar
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')} className="cursor-pointer">
          <FileJson className="mr-2 h-4 w-4" />
          Exportar JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
