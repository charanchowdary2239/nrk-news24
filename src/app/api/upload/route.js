import { requireAdmin } from '@/lib/api-auth';
import { isSupabaseConfigured, uploadImageToSupabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'No file uploaded.' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Only JPEG, PNG, WebP, GIF, and AVIF are permitted.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum permitted 5MB limit.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || '.jpg';
    const fileName = `${Date.now()}-${uuidv4().substring(0, 8)}${ext.toLowerCase()}`;

    // 1. Supabase Storage (Production on Vercel & Supabase connected)
    if (isSupabaseConfigured()) {
      const uploadResult = await uploadImageToSupabase(buffer, fileName, file.type);
      if (uploadResult.error) {
        throw new Error(uploadResult.error);
      }

      return NextResponse.json({
        success: true,
        message: 'Image uploaded successfully to Supabase Storage.',
        url: uploadResult.publicUrl,
        fileName,
      });
    }

    // 2. Local Fallback (Development only when Supabase is not configured)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully (local).',
      url: publicUrl,
      fileName,
    });
  } catch (err) {
    console.error('Error handling upload:', err);
    return NextResponse.json(
      { success: false, error: `Image upload failed: ${err.message}` },
      { status: 500 }
    );
  }
}
