import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Proxy /api to the API on the same PORT it uses: from the shell or server/.env, default 4000.
  const serverDir = fileURLToPath(new URL("../server", import.meta.url));
  const apiPort = loadEnv(mode, serverDir, "").PORT || "4000";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        "/api": `http://localhost:${apiPort}`,
      },
    },
  };
});
