import type { Metadata, Viewport } from 'next';
import { IconSprite } from '@/components/ui/Icon';
import { ToastHost } from '@/components/ui/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Khatt',
  description: 'A fast markdown editor that runs entirely in your browser.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f2f4' },
    { media: '(prefers-color-scheme: dark)', color: '#1b1b1f' },
  ],
};

/* Runs before first paint. React must never read the stored theme during
   render: that is what produces a hydration mismatch and a flash of the wrong
   palette on every load. */
const BOOTSTRAP = `(function(){try{
  var t=localStorage.getItem('md-editor-theme');
  if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);
  var d=localStorage.getItem('md-editor-dir');
  if(d==='rtl')document.documentElement.setAttribute('dir','rtl');
}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOTSTRAP }} />
      </head>
      <body>
        <IconSprite />
        {children}
        <ToastHost />
      </body>
    </html>
  );
}
