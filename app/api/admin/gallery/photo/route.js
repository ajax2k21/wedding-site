import connectDB from '@/lib/mongodb';
import GalleryCollection from '@/models/GalleryCollection';
import GalleryPhoto from '@/models/GalleryPhoto';
import { destroyCloudinaryAsset } from '@/lib/gallery';
import { getAdminSide } from '@/lib/adminAuth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const side = await getAdminSide();
  if (!side) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await connectDB();
    const { collectionId, publicId, url, caption } = await request.json();

    if (!collectionId || !publicId || !url) {
      return NextResponse.json({ error: 'collectionId, publicId and url are required' }, { status: 400 });
    }
    if (!/^https:\/\/res\.cloudinary\.com\//.test(url)) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    const collection = await GalleryCollection.findOne({ _id: collectionId, side });
    if (!collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });

    const photo = await GalleryPhoto.create({
      collectionId: collection._id,
      publicId,
      url,
      caption: (caption || '').slice(0, 100),
    });

    return NextResponse.json(
      { success: true, photo: { _id: String(photo._id), url: photo.url, caption: photo.caption } },
      { status: 201 }
    );
  } catch (err) {
    console.error('Gallery photo POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const side = await getAdminSide();
  if (!side) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const photo = await GalleryPhoto.findById(id);
    if (!photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });

    const collection = await GalleryCollection.findOne({ _id: photo.collectionId, side });
    if (!collection) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });

    await photo.deleteOne();
    await destroyCloudinaryAsset(photo.publicId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Gallery photo DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
