import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const db = () => createServiceClient();

// GET /api/db/hero
export async function GET() {
  const { data, error } = await db().from('hero_slides').select('data').order('sort_order', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map((r: { data: unknown }) => r.data));
}

// POST /api/db/hero  (upsert completo: reemplaza todo el array)
export async function POST(req: NextRequest) {
  const slides: Array<{ id: string; order: number; [key: string]: unknown }> = await req.json();
  // delete all + insert
  await db().from('hero_slides').delete().neq('id', '__none__');
  if (slides.length > 0) {
    const rows = slides.map((s) => ({ id: s.id, data: s, sort_order: s.order ?? 0 }));
    const { error } = await db().from('hero_slides').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
