import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The customer website always runs on port 5173 (the admin panel uses 5174)
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
