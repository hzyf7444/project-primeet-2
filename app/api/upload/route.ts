import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('File upload request received');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const meetingId = formData.get('meetingId') as string;

    console.log('File details:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      meetingId
    });

    if (!file || !meetingId) {
      console.error('Missing file or meetingId');
      return NextResponse.json({ error: 'File and meetingId are required' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('File too large:', file.size);
      return NextResponse.json({ error: 'File size too large. Maximum 10MB allowed.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', meetingId);
    
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      console.log('Upload directory created/verified:', uploadsDir);
    } catch (error) {
      console.error('Error creating directory:', error);
      return NextResponse.json({ error: 'Failed to create upload directory' }, { status: 500 });
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const baseName = path.basename(file.name, fileExtension);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `${timestamp}-${sanitizedBaseName}${fileExtension}`;
    const filepath = path.join(uploadsDir, filename);

    console.log('Saving file to:', filepath);

    // Write file
    try {
      await fs.writeFile(filepath, buffer);
      console.log('File saved successfully');
    } catch (error) {
      console.error('Error writing file:', error);
      return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
    }

    const fileUrl = `/uploads/${meetingId}/${filename}`;

    console.log('File upload completed:', {
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    return NextResponse.json({ 
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
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