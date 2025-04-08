import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
    plugins: [vue(), visualizer()],
    server: {
        port: 7638
    },
    build: {
        lib: {
            entry: ["./src/slitherlink.ts"],
            name: "SlitherlinkPlayer",
            fileName: (format) => `slitherlink.${format}.js`,
            formats: ["es"]
        },
    },
})