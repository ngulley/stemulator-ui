import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import chatProxy from "./vite-plugin-chat-proxy";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), chatProxy()],
  server: {
    proxy: {
      "/stemulator": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
