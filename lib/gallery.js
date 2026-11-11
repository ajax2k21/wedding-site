import crypto from 'crypto';
import wedding from '@/wedding.config';
import GalleryCollection from '@/models/GalleryCollection';

export function cloudinaryConfig() {
  return {
    cloud: process.env.CLOUDINARY_CLOUD_NAME,
    key: process.env.CLOUDINARY_API_KEY,
    secret: process.env.CLOUDINARY_API_SECRET,
  };
}

export function isCloudinaryConfigured() {
  const { cloud, key, secret } = cloudinaryConfig();
  return Boolean(cloud && key && secret);
}

// First visit after a fresh database seeds one collection per wedding function.
export async function ensureDefaultCollections() {
  const count = await GalleryCollection.countDocuments();
  if (count > 0) return;
  const defaults = wedding.functions.map((fn, index) => ({ name: fn.title, order: index }));
  if (defaults.length) await GalleryCollection.insertMany(defaults);
}

// Cloudinary signs alphabetically sorted params, excluding file / api_key / cloud_name.
export function signCloudinaryParams(params, secret) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(toSign + secret).digest('hex');
}

export function cloudinaryFolder(collectionId) {
  return `${wedding.galleryFolder}/${collectionId}`;
}

export async function destroyCloudinaryAsset(publicId) {
  const { cloud, key, secret } = cloudinaryConfig();
  if (!cloud || !key || !secret || !publicId) return;
  const timestamp = Math.round(Date.now() / 1000);
  const signature = signCloudinaryParams({ public_id: publicId, timestamp }, secret);
  const body = new URLSearchParams({
    public_id: publicId,
    api_key: key,
    timestamp: String(timestamp),
    signature,
  });
  try {
    await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, { method: 'POST', body });
  } catch (err) {
    console.error('Cloudinary delete failed:', err);
  }
}
