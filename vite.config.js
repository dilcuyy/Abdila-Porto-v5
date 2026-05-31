// vite.config.js — Abdila Asy Portfolio
import { defineConfig } from 'vite';

export default defineConfig({
  // Serve static assets with long-lived cache headers
  server: {
    headers: {
      // Fonts: cache 1 year (they have content hashes)
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },

  // Build optimizations
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        // Ensure JS/CSS chunks get content-hash filenames for long caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks: undefined,
      },
    },
  },

  // Inline small assets for fewer HTTP requests
  assetsInlineLimit: 4096,

  // Serve with correct MIME types
  plugins: [
    {
      name: 'configure-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Cache fonts aggressively
          if (req.url.match(/\.(woff2|woff|ttf)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
          // Cache images for 1 day during dev
          if (req.url.match(/\.(webp|jpg|jpeg|png|avif|gif|svg)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
          }
          // Cache CSS/JS with versioning for 1 week
          if (req.url.match(/\.(css|js)\?v=/)) {
            res.setHeader('Cache-Control', 'public, max-age=604800');
          }
          next();
        });
      },
    },
  ],
});
