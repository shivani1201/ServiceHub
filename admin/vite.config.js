import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The admin panel always runs on port 5174 (the customer site uses 5173)
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, strictPort: true },
});
