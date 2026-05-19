/**
 * envx CLI — validate and generate .env files
 *
 * Commands:
 *   envx check [--env <file>] [--schema <file>]
 *   envx generate [--schema <file>] [--out <file>]
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { validateEnvFile, generateExample } from './core.js'
import type { Schema } from './core.js'

// ---------------------------------------------------------------------------
// Tiny .env parser (no dependency)
// ---------------------------------------------------------------------------

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eqIdx = line.indexOf('=')
    if (eqIdx === -1) continue
    const key = line.slice(0, eqIdx).trim()
    let value = line.slice(eqIdx + 1).trim()
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}

// ---------------------------------------------------------------------------
// Arg parser
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): Record<string, string | true> {
  const args: Record<string, string | true> = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg !== undefined && arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next !== undefined && !next.startsWith('--')) {
        args[key] = next
        i++
      } else {
        args[key] = true
      }
    }
  }
  return args
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function loadSchema(schemaPath: string): Promise<Schema> {
  const resolved = path.resolve(process.cwd(), schemaPath)
  if (!fs.existsSync(resolved)) {
    console.error(`[envx] schema file not found: ${resolved}`)
    process.exit(1)
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const mod = await import(resolved)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const schema = (mod.default ?? mod.schema ?? mod) as Schema
  if (typeof schema !== 'object' || schema === null) {
    console.error('[envx] schema file must export a default schema object')
    process.exit(1)
  }
  return schema
}

async function cmdCheck(args: Record<string, string | true>): Promise<void> {
  const envFile = typeof args['env'] === 'string' ? args['env'] : '.env'
  const schemaFile = typeof args['schema'] === 'string' ? args['schema'] : 'envx.schema.js'

  const envPath = path.resolve(process.cwd(), envFile)
  if (!fs.existsSync(envPath)) {
    console.error(`[envx] env file not found: ${envPath}`)
    process.exit(1)
  }

  const schema = await loadSchema(schemaFile)
  const parsed = parseEnvFile(fs.readFileSync(envPath, 'utf8'))
  const errors = validateEnvFile(parsed, schema)

  if (errors.length === 0) {
    console.log(`\x1b[32m✔ ${envFile} is valid\x1b[0m`)
    return
  }

  console.error(`\x1b[31m✖ ${envFile} has ${errors.length} error(s):\x1b[0m\n`)
  for (const err of errors) {
    const received =
      err.received !== undefined ? ` (received: \x1b[90m${JSON.stringify(err.received)}\x1b[0m)` : ''
    console.error(`  \x1b[33m${err.field}\x1b[0m: ${err.message}${received}`)
  }
  console.error('')
  process.exit(1)
}

async function cmdGenerate(args: Record<string, string | true>): Promise<void> {
  const schemaFile = typeof args['schema'] === 'string' ? args['schema'] : 'envx.schema.js'
  const outFile = typeof args['out'] === 'string' ? args['out'] : '.env.example'

  const schema = await loadSchema(schemaFile)
  const content = generateExample(schema)
  fs.writeFileSync(path.resolve(process.cwd(), outFile), content, 'utf8')
  console.log(`\x1b[32m✔ Generated ${outFile}\x1b[0m`)
}

function printHelp(): void {
  console.log(`
  \x1b[1menvx\x1b[0m — Environment variable validator

  \x1b[1mUsage:\x1b[0m
    envx check    [--env <file>]    [--schema <file>]
    envx generate [--schema <file>] [--out <file>]

  \x1b[1mCommands:\x1b[0m
    check       Validate a .env file against a schema (default: .env / envx.schema.js)
    generate    Generate a .env.example from a schema (default output: .env.example)

  \x1b[1mOptions:\x1b[0m
    --env       Path to the .env file          (default: .env)
    --schema    Path to the schema JS/TS file  (default: envx.schema.js)
    --out       Output path for generate       (default: .env.example)
    --help      Show this help message
`)
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const [, , command, ...rest] = process.argv
  const args = parseArgs(rest)

  if (args['help'] || !command) {
    printHelp()
    return
  }

  switch (command) {
    case 'check':
      await cmdCheck(args)
      break
    case 'generate':
      await cmdGenerate(args)
      break
    default:
      console.error(`[envx] Unknown command: ${command}`)
      printHelp()
      process.exit(1)
  }
}

main().catch((err) => {
  console.error('[envx] Unexpected error:', err)
  process.exit(1)
})
