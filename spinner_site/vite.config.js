import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Keep dev at root; build assets for deployment under a sub-URL.
  base: process.env.NODE_ENV === 'production' ? '/spinner_site/dist/' : '/',
  plugins: [react()],
});