import { cookies } from 'next/headers';

// Returns 'bride', 'groom' or null. Old cookies stored 'authenticated'.
export async function getAdminSide() {
  const cookieStore = await cookies();
  const value = cookieStore.get('admin_auth')?.value;
  if (value === 'groom') return 'groom';
  if (value === 'bride' || value === 'authenticated') return 'bride';
  return null;
}
