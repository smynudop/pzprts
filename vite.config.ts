import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { visualizer } from 'rollup-plugin-visualizer';
//import dts from 'vite-plugin-dts'

export default defineConfig({
    plugins: [vue({
        features: {
            customElement: true
        }
    }),
        //visualizer(),
        //     dts({
        //     tsconfigPath: "./tsconfig.json"
        // })
    ],
    resolve: {
        alias: {
            "vue": "vue/dist/vue.esm-bundler.js"
        }
    },
    server: {
        port: 7638,
    },
    build: {
        lib: {
            entry: [
                "./src/index.ts",
                // "./src/player/slitherlink.ts",
                // "./src/player/mashu.ts"
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