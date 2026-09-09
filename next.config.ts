import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  /* Exclude the lazily-imported vendor chunks from the precache manifest — see
     the comment in sw.ts for why. */
  exclude: [/mermaid/, /katex/, /shiki/],
  /* "/" is the URL people actually visit, and it is not the same cache key as the
     exported "/index.html", so it is precached in its own right. Without it the
     app installs and then fails to open with the network gone. */
  additionalPrecacheEntries: [{ url: '/', revision: null }],
});

const config: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  reactCompiler: true,
};

export default withSerwist(config);
