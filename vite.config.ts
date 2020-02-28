import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'build',
        // Optimización de chunks para reducir bundle size
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // Separar vendor chunks por librería
                    if (id.includes('node_modules')) {
                        if (id.includes('firebase')) {
                            return 'vendor-firebase';
                        }
                        if (id.includes('react-dom') || id.includes('react-router')) {
                            return 'vendor-react';
                        }
                        if (id.includes('bootstrap') || id.includes('react-bootstrap')) {
                            return 'vendor-ui';
                        }
                        if (id.includes('jspdf') || id.includes('html2canvas')) {
                            return 'vendor-pdf';
                        }
                    }
                },
            },
        },
        // Aumentar límite de warning
        chunkSizeWarningLimit: 600,
        // Minificación
        minify: 'esbuild',
        // Source maps para producción
        sourcemap: false,
    },
    // Optimizaciones de desarrollo
    server: {
        port: 5173,
        open: true,
    },
    // Optimizaciones de preview
    preview: {
        port: 4173,
    },
});
