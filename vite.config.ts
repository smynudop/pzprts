import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { visualizer } from 'rollup-plugin-visualizer';
//import dts from 'vite-plugin-dts'

export default defineConfig({
    plugins: [vue(), visualizer(),
        //     dts({
        //     tsconfigPath: "./tsconfig.json"
        // })
    ],
    server: {
        port: 7638
    },
    build: {
        lib: {
            entry: [
                "./src/index.ts",
                "./src/player/slitherlink.ts"
            ],
            name: "PenpaPlayer",
            fileName: (format, entry) => `${entry}.${format}.js`,
            formats: ["es"]
        },
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production')  // または 'development'
    }

})