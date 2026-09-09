import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';
import type { PrecacheEntry } from 'serwist';

/* This file is bundled as a service worker, not as part of the app, so the
   worker globals are not in `lib`. Declaring just the one property Serwist reads
   is cheaper than pulling the whole webworker lib into the app's type space,
   where it collides with the DOM lib. */
declare const self: { __SW_MANIFEST: (PrecacheEntry | string)[] | undefined };

/* The shell is precached so offline means "fully functional", not "a fallback
   page". The lazy chunks (mermaid, katex, shiki) are deliberately NOT precached:
   precaching them would cost every user the bytes that the lazy-loading design
   exists to avoid. They enter the runtime cache the first time a document uses
   one, and are then available offline. */
new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: defaultCache,
  /* A navigation to "/" is not the same URL as the precached "/index.html", so
     without this the app is installed and still fails to open offline. */
  fallbacks: {
    entries: [
      {
        url: '/index.html',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
}).addEventListeners();
