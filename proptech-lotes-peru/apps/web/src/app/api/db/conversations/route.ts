import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const db = () => createServiceClient();

// GET /api/db/conversations
export async function GET() {
  const { data, error } = await db().from('conversations').select('*').order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    (data as Array<{ id: string; visitor_name: string; visitor_email: string; project_id: string; project_name: string; messages: unknown; is_read: boolean; is_closed: boolean; created_at: string; updated_at: string }>).map((r) => ({
      id: r.id,
      visitorName: r.visitor_name,
      visitorEmail: r.visitor_email,
      projectId: r.project_id,
      projectName: r.project_name,
      messages: r.messages,
      isRead: r.is_read,
      isClosed: r.is_closed,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))
  );
}

// POST /api/db/conversations  (upsert conversación completa, reply, o create)
export async function POST(req: NextRequest) {
  const body = await req.json();

  // action: 'reply' — añadir mensaje del admin a conversación existente
  if (body.action === 'reply' && body.conversationId && body.message) {
    const { data: existing, error: fetchErr } = await db()
      .from('conversations')
      .select('messages')
      .eq('id', body.conversationId)
      .single();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    const messages = [...((existing?.messages as unknown[]) ?? []), body.message];
    const { error } = await db()
      .from('conversations')
      .update({ messages, is_read: false, updated_at: new Date().toISOString() })
      .eq('id', body.conversationId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // action: 'update' o 'create' — upsert conversación completa
  const conv = body.conversation ?? body;
  const { error } = await db().from('conversations').upsert({
    id: conv.id,
    visitor_name: conv.visitorName ?? 'Visitante',
    visitor_email: conv.visitorEmail ?? '',
    project_id: conv.projectId ?? '',
    project_name: conv.projectName ?? '',
    messages: conv.messages ?? [],
    is_read: conv.isRead ?? false,
    is_closed: conv.isClosed ?? false,
    created_at: conv.createdAt ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(conv);
}

// PATCH /api/db/conversations  (marcar leído / marcar todos / cerrar)
export async function PATCH(req: NextRequest) {
  const { id, all, isClosed } = await req.json();
  if (all) {
    const { error } = await db().from('conversations').update({ is_read: true }).neq('id', '__none__');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (id) {
    const update: Record<string, unknown> = { is_read: true };
    if (isClosed !== undefined) update.is_closed = isClosed;
    const { error } = await db().from('conversations').update(update).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/db/conversations?id=xxx
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await db().from('conversations').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
