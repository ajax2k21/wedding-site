import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password, side } = await request.json();

    if (side !== 'bride' && side !== 'groom') {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const expected =
      side === 'groom'
        ? { email: process.env.SHIVAM_ADMIN_EMAIL, password: process.env.SHIVAM_ADMIN_PASSWORD }
        : { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };

    if (!expected.email || !expected.password || email !== expected.email || password !== expected.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const res = NextResponse.json({ success: true, side });
    res.cookies.set('admin_auth', side, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   60 * 60 * 8, // 8 hours
      path:     '/',
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('admin_auth');
  return res;
}
