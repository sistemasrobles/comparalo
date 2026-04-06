import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const db = () => createServiceClient();

// PUT /api/db/reservations/[id]  (actualizar estado/notas/documentos)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const patch = await req.json();
  // Obtener la reserva actual
  const { data: current, error: fetchError } = await db()
    .from('reservations')
    .select('data')
    .eq('id', params.id)
    .single();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  const updated = { ...(current as { data: object }).data, ...patch };
  const { error } = await db()
    .from('reservations')
    .update({ data: updated, status: updated.status, updated_at: new Date().toISOString() })
    .eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(updated);
}

// DELETE /api/db/reservations/[id]
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await db().from('reservations').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
