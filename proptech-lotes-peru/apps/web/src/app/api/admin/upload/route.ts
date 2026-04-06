import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    // Build a safe public_id for Cloudinary
    const safeName = file.name
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
    const publicId = `peruinversion/projects/${safeName}-${Date.now()}`;

    // Upload to Cloudinary via buffer (works on serverless/Vercel)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { public_id: publicId, resource_type: 'image', overwrite: false },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload failed'));
          resolve(result as { secure_url: string });
        }
      ).end(buffer);
    });

    return NextResponse.json({
      url: uploadResult.secure_url,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (err) {
    console.error('[upload] error:', err);
    return NextResponse.json({ error: 'Error interno al subir el archivo.' }, { status: 500 });
  }
}
