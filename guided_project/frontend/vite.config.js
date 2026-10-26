import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// strictPort: if 5173 is busy, stop instead of silently using another port
// (the backend's CORS only allows http://localhost:5173).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
