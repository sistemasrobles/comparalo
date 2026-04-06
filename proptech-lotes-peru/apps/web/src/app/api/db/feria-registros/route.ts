import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const db = () => createServiceClient();

// GET /api/db/feria-registros
export async function GET() {
  const { data, error } = await db().from('feria_registros').select('data, is_read').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map((r: { data: Record<string, unknown>; is_read: boolean }) => ({ ...r.data, isRead: r.is_read })));
}

// POST /api/db/feria-registros  (crear)
export async function POST(req: NextRequest) {
  const registro = await req.json();
  const { error } = await db()
    .from('feria_registros')
    .insert({ id: registro.id, data: registro, is_read: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...registro, isRead: false });
}

// PATCH /api/db/feria-registros  (marcar leídos)
export async function PATCH(req: NextRequest) {
  const { id, all } = await req.json();
  if (all) {
    const { error } = await db().from('feria_registros').update({ is_read: true }).neq('id', '__none__');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (id) {
    const { error } = await db().from('feria_registros').update({ is_read: true }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/db/feria-registros?id=xxx
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await db().from('feria_registros').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
