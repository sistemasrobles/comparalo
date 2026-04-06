import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const db = () => createServiceClient();

// GET /api/db/reservations
export async function GET() {
  const { data, error } = await db().from('reservations').select('data').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map((r: { data: unknown }) => r.data));
}

// POST /api/db/reservations  (crear nueva)
export async function POST(req: NextRequest) {
  const reservation = await req.json();
  const { error } = await db()
    .from('reservations')
    .insert({ id: reservation.id, code: reservation.code, data: reservation, status: reservation.status ?? 'pendiente' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(reservation);
}
