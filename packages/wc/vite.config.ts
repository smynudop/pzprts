import { defineConfig } from "vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import dts from 'vite-plugin-dts'

export default defineConfig((opt) => {
    const alias: Record<string, string> = opt.mode === "development" ? {
        "@udop/penpa-player-lib": path.resolve(__dirname, "../lib/src")

    } : {};

    return {
        plugins: [
            svelte({ compilerOptions: { customElement: true } }),
            dts({ include: "./src" })
        ],
        resolve: {
            alias: alias
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
            outDir: "./dist",
            minify: "esbuild",
            //sourcemap: true
        },

        define: {
            'process.env.NODE_ENV': JSON.stringify('production')  // または 'development'
        }

    }
})