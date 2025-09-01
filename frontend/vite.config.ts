import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file from the repository root
  const env = loadEnv(mode, "../", "");

  return {
    plugins: [react()],
    define: {
      // Expose BACKEND_HOST from env file as VITE_BACKEND_URL
      "import.meta.env.VITE_BACKEND_URL": JSON.stringify(
        env.BACKEND_HOST || "http://localhost:8000"
      ),
      "import.meta.env.API_VERSION_STR": JSON.stringify(
        env.API_VERSION_STR || "/"
      ),
    },
  };
});
