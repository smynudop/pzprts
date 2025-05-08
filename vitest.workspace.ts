import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  "./vite.config.ts",
  "./packages/lib/vite.config.ts",
  "./packages/demo/vite.config.ts",
  "./packages/wc/vite.config.ts"
])
