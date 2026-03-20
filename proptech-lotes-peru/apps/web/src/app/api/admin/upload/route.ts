import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
    }

    // Validate type
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { error: `Formato no permitido: ${file.type}. Usa JPG, PNG, WEBP o GIF.` },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. Máximo permitido: 10 MB.` },
        { status: 400 }
      );
    }

    // Build a unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeName = file.name
      .replace(/\.[^.]+$/, '')                // remove extension
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')             // slugify
      .replace(/-+/g, '-')
      .slice(0, 60);
    const timestamp = Date.now();
    const filename = `${safeName}-${timestamp}.${ext}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'projects');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Public URL accessible from the browser
    const publicUrl = `/uploads/projects/${filename}`;

    return NextResponse.json({
      url: publicUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (err) {
    console.error('[upload] error:', err);
    return NextResponse.json({ error: 'Error interno al subir el archivo.' }, { status: 500 });
  }
}
