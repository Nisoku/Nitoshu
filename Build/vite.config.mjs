import { defineConfig, loadEnv } from "vite";
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isSingleFile = env.SINGLE_FILE === 'true';

  return {
    base: "./",
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['robots.txt'],
        manifest: {
          name: 'Web-Template',
          short_name: 'Web-Template',
          start_url: './',
          display: 'standalone',
          theme_color: '#00bfff',
          background_color: '#00bfff',
        },
        pwaAssets: {
          image: 'public/favicon.png',
          preset: 'minimal-2023',
          includeHtmlHeadLinks: true,
        },
        workbox: {
          // Required for PWA to find the inlined file
          globPatterns: ['**/*.{js,css,html,png,ico,json}'],
          runtimeCaching: [
            {
              urlPattern: /.*\.(js|css|html)$/,
              handler: 'NetworkFirst',
              options: { cacheName: 'app-shell' },
            },
            {
              urlPattern: /.*\.(png|ico|json)$/,
              handler: 'CacheFirst',
              options: { cacheName: 'assets' },
            },
          ],
        },
      }),
      // Conditionally add the plugin
      isSingleFile && viteSingleFile(),
    ].filter(Boolean),
    build: {
      sourcemap: true,
      outDir: './dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
    },
  };
});
