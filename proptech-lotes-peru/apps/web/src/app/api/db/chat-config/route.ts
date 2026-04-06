import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const db = () => createServiceClient();

// GET /api/db/chat-config
export async function GET() {
  const { data, error } = await db().from('chat_config').select('data').eq('id', 1).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const result = (data as { data: unknown } | null)?.data;
  if (!result) {
    const defaults = { active: true, agentName: 'Asesor PerúInversión', agentRole: 'Asesor inmobiliario', agentAvatar: '', welcomeMessage: '¡Hola! ¿En qué proyecto estás interesado? Estoy aquí para ayudarte.', whatsappNumber: '51987654321', accentColor: '#0098dc' };
    return NextResponse.json(defaults);
  }
  return NextResponse.json(result);
}

// POST /api/db/chat-config  (upsert)
export async function POST(req: NextRequest) {
  const config = await req.json();
  const { error } = await db().from('chat_config').upsert({ id: 1, data: config, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(config);
}
