import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const db = () => createServiceClient();

// GET /api/db/feria-config
export async function GET() {
  const { data, error } = await db().from('feria_config').select('data').eq('id', 1).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const result = (data as { data: unknown } | null)?.data;
  if (!result) {
    const defaults = { active: true, name: 'Feria PerúInversión 2026', dates: '28, 29 y 30 de marzo', place: 'Centro de Convenciones de Lima', endDate: '2026-03-30T23:59:59', ctaUrl: '/feria', ctaLabel: 'Ver feria', theme: 'orange' };
    return NextResponse.json(defaults);
  }
  return NextResponse.json(result);
}

// POST /api/db/feria-config  (upsert)
export async function POST(req: NextRequest) {
  const config = await req.json();
  const { error } = await db().from('feria_config').upsert({ id: 1, data: config, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(config);
}
