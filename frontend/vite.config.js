import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/app-citas-clinicas/',  // ← Configurado para GitHub Pages
    build: {
        outDir: 'dist',
        sourcemap: false,
        assetsDir: 'assets'
    }
})
