import { defineConfig } from "vite"
//import { visualizer } from 'rollup-plugin-visualizer';
import dts from 'vite-plugin-dts'

export default defineConfig({
    plugins: [dts({
        outDir: './dist', // 型定義ファイルの出力先を指定
        //rollupTypes: true, // 型定義ファイルをrollupで処理
        insertTypesEntry: true, // 型定義のエントリーポイントを作成
        include: ["./src"]
    })],
    build: {
        lib: {
            entry: [
                "./src/index.ts",
            ],
            name: "PenpaPlayer",
            formats: ["es"],

        },
        outDir: "./dist",
        rollupOptions: {
            output: {
                preserveModules: true
            }
        },
        //sourcemap: true
    },

    define: {
        'process.env.NODE_ENV': JSON.stringify('production')  // または 'development'
    }

})