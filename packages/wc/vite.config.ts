import { defineConfig } from "vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig((opt) => {
    return {
        plugins: [
            svelte({ compilerOptions: { customElement: true } }),
        ],
        resolve: {
            alias: {
                "@udop/penpa-player-lib": path.resolve(__dirname, "../lib/src")

            }
        },
        server: {
            port: 7638,
            host: true,  // すべてのIPアドレスからアクセス可能にする
        },
        define: {
            'process.env.NODE_ENV': JSON.stringify('production')  // または 'development'
        }
    }
})