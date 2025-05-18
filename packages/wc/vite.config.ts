import { defineConfig } from "vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import path from "node:path"
import fs from "node:fs/promises"
import { fileURLToPath } from "node:url"
import terser from "@rollup/plugin-terser";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import dts from 'vite-plugin-dts'

const entryFiles = (await fs.readdir(path.join(__dirname, "./src/player")))
    //.filter(x => !x.includes("index.ts"))
    .map(f => path.join(`./src/player/`, f))

export default defineConfig((opt) => {
    const alias: Record<string, string> = opt.mode === "development" ? {
        "@udop/penpa-player-lib": path.resolve(__dirname, "../lib/src")

    } : {};

    return {
        plugins: [
            svelte({ compilerOptions: { customElement: true } }),
            dts({ include: "./src/player" }),
            //terser()
        ],
        resolve: {
            alias: alias
        },
        build: {
            lib: {
                entry: entryFiles,
                name: "PenpaPlayer",
                fileName: (format, entry) => `${entry}.${format}.js`,
                formats: [
                    "es",
                    //"umd"
                ]
            },
            rollupOptions: {
                plugins: [terser()]
            },
            outDir: "./dist",
            minify: "terser",
            //sourcemap: true
        },
        define: {
            'process.env.NODE_ENV': JSON.stringify('production')  // または 'development'
        }

    }
})