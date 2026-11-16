import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/auth": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/test": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/news": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/calendar": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/pqrs": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/events": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/community-posts": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/tbog": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/community-highlights": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});