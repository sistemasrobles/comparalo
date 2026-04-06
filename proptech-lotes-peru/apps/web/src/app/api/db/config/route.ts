import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const db = () => createServiceClient();

// GET /api/db/config
export async function GET() {
  const { data, error } = await db().from('site_config').select('data').eq('id', 1).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const result = (data as { data: unknown } | null)?.data;
  if (!result) {
    // Tabla vacía — devolver defaults
    const defaults = { siteName: 'PerúInversión', siteSubtitle: 'La forma más inteligente de invertir en terrenos', ctaTitle: '¿Listo para invertir en tu terreno?', ctaSubtitle: 'Compara, simula y decide con datos reales.', adminPassword: 'admin2024' };
    return NextResponse.json(defaults);
  }
  return NextResponse.json(result);
}

// POST /api/db/config  (upsert)
export async function POST(req: NextRequest) {
  const config = await req.json();
  const { error } = await db().from('site_config').upsert({ id: 1, data: config, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(config);
}
