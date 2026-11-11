import connectDB from '@/lib/mongodb';
import GalleryCollection from '@/models/GalleryCollection';
import GalleryPhoto from '@/models/GalleryPhoto';
import { ensureDefaultCollections } from '@/lib/gallery';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    await ensureDefaultCollections();

    const [collections, photos] = await Promise.all([
      GalleryCollection.find().sort({ order: 1, createdAt: 1 }).lean(),
      GalleryPhoto.find().sort({ createdAt: 1 }).lean(),
    ]);

    const byCollection = new Map();
    for (const photo of photos) {
      const key = String(photo.collectionId);
      if (!byCollection.has(key)) byCollection.set(key, []);
      byCollection.get(key).push({
        _id: String(photo._id),
        url: photo.url,
        caption: photo.caption,
      });
    }

    return NextResponse.json(
      {
        success: true,
        collections: collections.map((collection) => ({
          _id: String(collection._id),
          name: collection.name,
          order: collection.order,
          photos: byCollection.get(String(collection._id)) || [],
        })),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Gallery GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
