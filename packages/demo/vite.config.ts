import { defineConfig } from "vite"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
    server: {
        port: 7638,
        host: true
    },
    build: {
        outDir: "../../docs",
        emptyOutDir: true
    },
    resolve: {
        // alias: {
        //     "@udop/penpa-player": path.resolve(__dirname, "../wc/src")
        // }
    },
})