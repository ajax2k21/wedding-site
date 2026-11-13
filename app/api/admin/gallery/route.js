import connectDB from '@/lib/mongodb';
import GalleryCollection from '@/models/GalleryCollection';
import GalleryPhoto from '@/models/GalleryPhoto';
import { collectionsFilter, ensureDefaultCollections, destroyCloudinaryAsset, isCloudinaryConfigured } from '@/lib/gallery';
import { getAdminSide } from '@/lib/adminAuth';
import { NextResponse } from 'next/server';

async function listCollections(side) {
  await connectDB();
  await ensureDefaultCollections(side);

  const [collections, photos] = await Promise.all([
    GalleryCollection.find(collectionsFilter(side)).sort({ order: 1, createdAt: 1 }).lean(),
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

  return collections.map((collection) => ({
    _id: String(collection._id),
    name: collection.name,
    order: collection.order,
    photos: byCollection.get(String(collection._id)) || [],
  }));
}

export async function GET() {
  const side = await getAdminSide();
  if (!side) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json(
      { success: true, side, collections: await listCollections(side), cloudinaryReady: isCloudinaryConfigured() },
      { status: 200 }
    );
  } catch (err) {
    console.error('Admin gallery GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const side = await getAdminSide();
  if (!side) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await connectDB();
    const { name } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (name.trim().length > 60) {
      return NextResponse.json({ error: 'Name cannot exceed 60 characters' }, { status: 400 });
    }

    const last = await GalleryCollection.findOne({ side }).sort({ order: -1 }).lean();
    const collection = await GalleryCollection.create({
      name: name.trim(),
      order: last ? last.order + 1 : 0,
      side,
    });

    return NextResponse.json(
      { success: true, collection: { _id: String(collection._id), name: collection.name, order: collection.order, side, photos: [] } },
      { status: 201 }
    );
  } catch (err) {
    console.error('Admin gallery POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const side = await getAdminSide();
  if (!side) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await connectDB();
    const body = await request.json();

    if (Array.isArray(body.ids)) {
      const ids = body.ids.filter((id) => typeof id === 'string');
      if (ids.length === 0) return NextResponse.json({ error: 'ids required' }, { status: 400 });
      await GalleryCollection.bulkWrite(
        ids.map((id, index) => ({
          updateOne: { filter: { _id: id, side }, update: { order: index } },
        }))
      );
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (body.id && body.name?.trim()) {
      if (body.name.trim().length > 60) {
        return NextResponse.json({ error: 'Name cannot exceed 60 characters' }, { status: 400 });
      }
      await GalleryCollection.findOneAndUpdate({ _id: body.id, side }, { name: body.name.trim() });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  } catch (err) {
    console.error('Admin gallery PATCH error:', err);
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

    const collection = await GalleryCollection.findOneAndDelete({ _id: id, side });
    if (!collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });

    const photos = await GalleryPhoto.find({ collectionId: collection._id }).lean();
    await Promise.all(photos.map((photo) => destroyCloudinaryAsset(photo.publicId)));
    await GalleryPhoto.deleteMany({ collectionId: collection._id });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Admin gallery DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
