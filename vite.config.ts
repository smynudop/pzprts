import { defineConfig } from "vite"


import { svelte } from '@sveltejs/vite-plugin-svelte'
import { visualizer } from 'rollup-plugin-visualizer';
//import dts from 'vite-plugin-dts'

export default defineConfig({
    plugins: [
        svelte({ compilerOptions: { customElement: true } })
    ],
    resolve: {
    },
    server: {
        port: 7638,
    },
    build: {
        lib: {
            entry: [
                "./src/index.ts",
            ],
            name: "PenpaPlayer",
            fileName: (format, entry) => `${entry}.${format}.js`,
            formats: ["es", "umd"]
        },
        minify: "esbuild",
        //sourcemap: true
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production')  // または 'development'
    }

})