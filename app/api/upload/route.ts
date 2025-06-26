import { NextRequest, NextResponse } from 'next/server';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const meetingId = formData.get('meetingId') as string;

    if (!file || !meetingId) {
      return NextResponse.json({ error: 'File and meetingId are required' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', meetingId);
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = path.join(uploadsDir, filename);

    // Write file
    await fs.writeFile(filepath, buffer);

    const fileUrl = `/uploads/${meetingId}/${filename}`;

    return NextResponse.json({ fileUrl });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};