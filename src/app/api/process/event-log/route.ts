import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toEventLogCsv, toEventLogXes } from '@/lib/process-mining';
import { loadEventLog, parseSource } from '@/lib/process-query';

export const dynamic = 'force-dynamic';

/**
 * GET /api/process/event-log?format=csv|xes&source=all|real|simulado
 * Exporta o event log no formato padrão (pm4py, Disco, Celonis, ProM).
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }
  try {
    const params = new URL(request.url).searchParams;
    const source = parseSource(params.get('source'));
    const format = params.get('format') === 'xes' ? 'xes' : 'csv';
    const rows = await loadEventLog(source);
    const body = format === 'xes' ? toEventLogXes(rows) : toEventLogCsv(rows);
    const filename = `plantguard-event-log-${source}.${format}`;
    return new NextResponse(body, {
      headers: {
        'Content-Type': format === 'xes' ? 'application/xml; charset=utf-8' : 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[GET /api/process/event-log]', error);
    return NextResponse.json({ error: 'Erro ao exportar o event log.' }, { status: 500 });
  }
}
