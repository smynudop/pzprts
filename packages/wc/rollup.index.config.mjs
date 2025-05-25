// rollup.config.js
import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import svelte from "rollup-plugin-svelte";
import css from "rollup-plugin-import-css";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

export default defineConfig({
	input: "./src/player/index.ts",
	output: {
		inlineDynamicImports: true,
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
