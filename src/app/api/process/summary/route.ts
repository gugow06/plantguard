import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { summarizeProcess } from '@/lib/process-mining';
import { loadEventLog, parseSource } from '@/lib/process-query';

export const dynamic = 'force-dynamic';

/** GET /api/process/summary?source=all|real|simulado — métricas de mineração de processos. */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }
  try {
    const source = parseSource(new URL(request.url).searchParams.get('source'));
    const rows = await loadEventLog(source);
    return NextResponse.json({ source, ...summarizeProcess(rows) });
  } catch (error) {
    console.error('[GET /api/process/summary]', error);
    return NextResponse.json({ error: 'Erro ao analisar o processo.' }, { status: 500 });
  }
}
