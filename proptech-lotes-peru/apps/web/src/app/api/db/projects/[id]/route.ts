import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const db = () => createServiceClient();

// PUT /api/db/projects/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const project = await req.json();
  const { data, error } = await db()
    .from('projects')
    .update({ data: project, is_active: project.isActive ?? true, is_featured: project.isFeatured ?? false, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('data')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data as { data: unknown }).data);
}

// DELETE /api/db/projects/[id]
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await db().from('projects').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
