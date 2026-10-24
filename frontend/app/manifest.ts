import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bazar Shodai - বাজার সদাই',
    short_name: 'Bazar Shodai',
    description: 'Fresh groceries, fish, vegetables and daily essentials delivered directly to your doorstep in Shahrasti.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#45a22c',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/logo-mark.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
