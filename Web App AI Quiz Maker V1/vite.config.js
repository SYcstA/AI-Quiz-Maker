import { defineConfig } from 'vite';
import dotenv from 'dotenv'; // Import dotenv to load environment variables

// Load .env file at build time
dotenv.config();

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  // Expose environment variables to the client-side code
  define: {
    'process.env.VITE_API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || 'http://localhost:3000'),
    'process.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(process.env.GOOGLE_CLIENT_ID || '')
  }
});