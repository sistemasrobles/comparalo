import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const db = () => createServiceClient();

// GET /api/db/contact
export async function GET() {
  const { data, error } = await db().from('contact_submissions').select('data, is_read').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map((r: { data: Record<string, unknown>; is_read: boolean }) => ({ ...r.data, isRead: r.is_read })));
}

// POST /api/db/contact  (crear)
export async function POST(req: NextRequest) {
  const submission = await req.json();
  const { error } = await db()
    .from('contact_submissions')
    .insert({ id: submission.id, data: submission, is_read: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...submission, isRead: false });
}

// PATCH /api/db/contact  (marcar leídos)
export async function PATCH(req: NextRequest) {
  const { id, all } = await req.json();
  if (all) {
    const { error } = await db().from('contact_submissions').update({ is_read: true }).neq('id', '__none__');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (id) {
    const { error } = await db().from('contact_submissions').update({ is_read: true }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/db/contact?id=xxx
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await db().from('contact_submissions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
