import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const db = () => createServiceClient();

// GET /api/db/ad-banners
export async function GET() {
  const { data, error } = await db().from('ad_banners').select('data').order('sort_order', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map((r: { data: unknown }) => r.data));
}

// POST /api/db/ad-banners  (upsert completo)
export async function POST(req: NextRequest) {
  const banners: Array<{ id: string; order: number; active: boolean; [key: string]: unknown }> = await req.json();
  await db().from('ad_banners').delete().neq('id', '__none__');
  if (banners.length > 0) {
    const rows = banners.map((b) => ({ id: b.id, data: b, sort_order: b.order ?? 0, active: b.active ?? true }));
    const { error } = await db().from('ad_banners').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
