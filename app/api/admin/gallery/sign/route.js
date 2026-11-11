import connectDB from '@/lib/mongodb';
import GalleryCollection from '@/models/GalleryCollection';
import { cloudinaryConfig, cloudinaryFolder, isCloudinaryConfigured, signCloudinaryParams } from '@/lib/gallery';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === 'authenticated';
}

export async function POST(request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: 'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.' },
      { status: 503 }
    );
  }

  try {
    await connectDB();
    const { collectionId } = await request.json();
    if (!collectionId) return NextResponse.json({ error: 'collectionId is required' }, { status: 400 });

    const collection = await GalleryCollection.findById(collectionId);
    if (!collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });

    const { cloud, key, secret } = cloudinaryConfig();
    const timestamp = Math.round(Date.now() / 1000);
    const folder = cloudinaryFolder(collectionId);
    // Incoming transformation: cap stored images at 1600px wide and let Cloudinary pick quality.
    const transformation = 'c_limit,w_1600,q_auto:good';
    const signature = signCloudinaryParams({ folder, timestamp, transformation }, secret);

    return NextResponse.json(
      { success: true, cloudName: cloud, apiKey: key, timestamp, signature, folder, transformation },
      { status: 200 }
    );
  } catch (err) {
    console.error('Cloudinary sign error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
