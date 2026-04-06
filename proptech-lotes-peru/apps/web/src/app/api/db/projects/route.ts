import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const db = () => createServiceClient();

// GET /api/db/projects
export async function GET() {
  const { data, error } = await db().from('projects').select('data').order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map((r: { data: unknown }) => r.data));
}

// POST /api/db/projects
export async function POST(req: NextRequest) {
  const project = await req.json();
  const { data, error } = await db()
    .from('projects')
    .insert({ id: project.id, data: project, is_active: project.isActive ?? true, is_featured: project.isFeatured ?? false })
    .select('data')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data as { data: unknown }).data);
}
