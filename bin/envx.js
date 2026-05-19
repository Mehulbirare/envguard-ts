#!/usr/bin/env node
// envx CLI entry point
import('../dist/esm/cli.js').catch((e) => {
  // Fallback to CJS if ESM import fails (Node 18 with --require hooks, etc.)
  try {
    require('../dist/cjs/cli.js')
  } catch {
    console.error('[envx] Failed to load CLI:', e?.message ?? e)
    process.exit(1)
  }
})
