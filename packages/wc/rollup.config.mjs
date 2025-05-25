// rollup.config.js
import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import svelte from "rollup-plugin-svelte";
import css from "rollup-plugin-import-css";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const entryFiles = (await fs.readdir(path.join(__dirname, "./src/player")))
	.filter((x) => !x.includes("index.ts"))
	.map((f) => path.join(`./src/player/`, f));

export default defineConfig({
	input: entryFiles,
	output: {
		dir: "dist",
		format: "es",
		entryFileNames: `[name].[format].js`,
	},
	plugins: [
		css(),
		svelte({
			// Optionally, preprocess components with svelte.preprocess:
			// https://svelte.dev/docs#compile-time-svelte-preprocess
			emitCss: false,
		}),
		typescript(),
		resolve({
			browser: true,
			exportConditions: ["svelte"],
			extensions: [".svelte"],
		}),
		terser(),
	],
});
