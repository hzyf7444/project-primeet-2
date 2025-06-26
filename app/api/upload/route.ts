import { NextRequest, NextResponse } from 'next/server';
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

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size too large. Maximum 10MB allowed.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', meetingId);
    
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directory:', error);
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const baseName = path.basename(file.name, fileExtension);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `${timestamp}-${sanitizedBaseName}${fileExtension}`;
    const filepath = path.join(uploadsDir, filename);

    // Write file
    try {
      await fs.writeFile(filepath, buffer);
    } catch (error) {
      console.error('Error writing file:', error);
      return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
    }

    const fileUrl = `/uploads/${meetingId}/${filename}`;

    return NextResponse.json({ 
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

// Increase the maximum file size for uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};