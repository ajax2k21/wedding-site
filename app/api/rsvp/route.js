import connectDB from '@/lib/mongodb';
import Guest from '@/models/Guest';
import { NextResponse } from 'next/server';

const MAX_GUESTS = 20;

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, status, guestCount, message, website } = body;

    // Honeypot: real visitors never fill a hidden field
    if (website) return NextResponse.json({ success: true }, { status: 200 });

    if (!name?.trim())    return NextResponse.json({ error: 'Name is required' },    { status: 400 });
    if (!status)          return NextResponse.json({ error: 'Status is required' },  { status: 400 });
    if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    if (!['yes','maybe','no'].includes(status))
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    if (name.trim().length > 100)
      return NextResponse.json({ error: 'Name cannot exceed 100 characters' }, { status: 400 });
    if (message.trim().length > 500)
      return NextResponse.json({ error: 'Message cannot exceed 500 characters' }, { status: 400 });

    const count = status === 'yes' ? Number(guestCount) || 1 : 0;
    if (count < 1 || count > MAX_GUESTS)
      return NextResponse.json({ error: `Guest count must be between 1 and ${MAX_GUESTS}` }, { status: 400 });

    const guest = await Guest.create({
      name:       name.trim(),
      status,
      guestCount: count,
      message:    message.trim(),
    });

    return NextResponse.json({ success: true, data: guest }, { status: 201 });
  } catch (err) {
    if (err?.name === 'ValidationError') {
      const first = Object.values(err.errors)[0]?.message || 'Invalid data';
      return NextResponse.json({ error: first }, { status: 400 });
    }
    console.error('RSVP POST error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    // Fetch only necessary fields for the public wishes wall
    const wishes = await Guest.find({}, 'name status guestCount message createdAt')
      .sort({ createdAt: -1 })
      .limit(50);
    return NextResponse.json({ success: true, wishes }, { status: 200 });
  } catch (err) {
    console.error('Wishes GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
