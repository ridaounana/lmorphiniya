import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Deployed at www.oviich.com/lmorphiniya, not at a domain root — asset
  // URLs need the subpath baked in. Dev server stays at "/" so `npm run dev`
  // doesn't need the prefix typed in locally.
  base: command === "build" ? "/lmorphiniya/" : "/",
  plugins: [react(), tailwindcss()],
  server: {
    port: Number(process.env.PORT) || 5173,
  },
}))
