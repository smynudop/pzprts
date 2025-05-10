import { defineConfig } from "vite"
import path from "node:path"
import { fileURLToPath } from "node:url"
import queryHash from "vite-plugin-query-hash"
import { hashPlugin } from "./plugin/hash"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
    plugins: [hashPlugin()],
    server: {
        port: 7638,
        host: true
    },
    build: {
        outDir: "../../docs",
        emptyOutDir: true,
        rollupOptions: {
            output: {
                entryFileNames: `assets/[name].js`,
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`,
            }
        }
    },
    resolve: {
        // alias: {
        //     "@udop/penpa-player": path.resolve(__dirname, "../wc/src")
        // }
    },
})