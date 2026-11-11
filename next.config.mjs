import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve('.'),
  // Next 15's ESLint runner cannot load flat config; `npm run lint` does.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
