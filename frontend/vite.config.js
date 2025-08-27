import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/app-citas-clinicas/',
    build: {
        outDir: 'dist',
        sourcemap: false,
        assetsDir: 'assets'
    },
    server: {
        port: 5174,
        host: true,
        open: true
    }
})
