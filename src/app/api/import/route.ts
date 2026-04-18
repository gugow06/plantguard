import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'A importação agora é processada no cliente. Esta rota foi desativada.' },
    { status: 410 },
  );
}
