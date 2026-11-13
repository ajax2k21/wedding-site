import wedding from '@/wedding.config';

// Groom-first variant served at /shivam: identical content, Shivam's side first.
export const groomFirstWedding = {
  ...wedding,
  couple: { ...wedding.couple, order: 'groom-first' },
  monogram: `${wedding.couple.groom.initials} ❤️ ${wedding.couple.bride.initials}`,
};
