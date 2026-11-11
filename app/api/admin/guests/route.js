import connectDB from '@/lib/mongodb';
import Guest from '@/models/Guest';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Simple cookie-based auth guard
async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === 'authenticated';
}

export async function GET(request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const filterStatus = searchParams.get('status') || '';

    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (filterStatus && filterStatus !== 'all') query.status = filterStatus;

    const guests = await Guest.find(query).sort({ createdAt: -1 });

    // Aggregated stats
    const stats = await Guest.aggregate([
      { $group: {
        _id: '$status',
        count:      { $sum: 1 },
        totalMembers: { $sum: '$guestCount' },
      }},
    ]);

    return NextResponse.json({ success: true, guests, stats }, { status: 200 });
  } catch (err) {
    console.error('Admin GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await Guest.findByIdAndDelete(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
