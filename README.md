# envguard

[![npm version](https://img.shields.io/npm/v/envguard?color=brightgreen)](https://www.npmjs.com/package/envguard)
[![npm downloads](https://img.shields.io/npm/dw/envguard)](https://www.npmjs.com/package/envguard)
[![bundle size](https://img.shields.io/bundlephobia/minzip/envguard?label=minzip)](https://bundlephobia.com/package/envguard)
[![CI](https://github.com/Mehulbirare/npm-install-envx/actions/workflows/ci.yml/badge.svg)](https://github.com/Mehulbirare/npm-install-envx/actions)
[![coverage](https://codecov.io/gh/Mehulbirare/npm-install-envx/branch/main/graph/badge.svg)](https://codecov.io/gh/Mehulbirare/npm-install-envx)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![license](https://img.shields.io/npm/l/envguard)](LICENSE)

**Zero-dependency** TypeScript environment variable validator with compile-time type inference.  
Validates on startup, throws human-readable errors, infers types — no `string` widening anywhere.

```ts
import { createEnv, str, num, bool, url, port } from 'envguard'

export const env = createEnv({
  schema: {
    DATABASE_URL: url(),
    PORT:         port({ default: 3000 }),
    NODE_ENV:     str({ choices: ['development', 'production', 'test'], default: 'development' }),
    DEBUG:        bool({ default: false }),
    API_KEY:      str({ secret: true }),   // masked in error output
  },
})

env.PORT         // → number  (not string!)
env.DATABASE_URL // → string
env.DEBUG        // → boolean
```

If any required variable is missing or fails validation, `createEnv` throws a **structured, readable error at startup** — not a cryptic runtime crash deep in your app.

```
  ✖ Environment validation failed

  DATABASE_URL: is required but missing
  PORT: must be between 1 and 65535 (received: "99999")
  NODE_ENV: must be one of ["development", "production", "test"] (received: "staging")
```

---

## Table of contents

- [Why envguard?](#why-envguard)
- [Install](#install)
- [Quick start](#quick-start)
- [API reference](#api-reference)
  - [createEnv](#createenv)
  - [Validators](#validators)
  - [generateExample](#generateexample)
  - [validateEnvFile](#validateenvfile)
  - [EnvValidationError](#envvalidationerror)
- [CLI](#cli)
- [Examples](#examples)
- [Comparison](#comparison-vs-alternatives)
- [Contributing](#contributing)

---

## Why envguard?

| Feature | envguard | envalid | envsafe | t3-env |
|---|:---:|:---:|:---:|:---:|
| Zero dependencies | ✅ | ❌ (dotenv) | ✅ | ❌ (zod) |
| TypeScript-first types | ✅ | ⚠️ | ✅ | ✅ |
| Compile-time inference | ✅ | ❌ | ✅ | ✅ |
| Bundle size | **< 3 KB** | ~15 KB | ~4 KB | ~12 KB |
| Works in Edge / Deno / Bun | ✅ | ❌ | ⚠️ | ⚠️ |
| CLI (`npx envguard check`) | ✅ | ❌ | ❌ | ❌ |
| Auto `.env.example` gen | ✅ | ❌ | ❌ | ❌ |
| Secret masking | ✅ | ❌ | ❌ | ❌ |
| `choices` enum narrowing | ✅ | ✅ | ✅ | ✅ |

---

## Install

```bash
npm install envguard
# or
pnpm add envguard
# or
yarn add envguard
```

No peer dependencies required. Works with Node ≥ 18, Deno, Bun, and all Edge runtimes.

---

## Quick start

### 1. Create your env file

```ts
// src/env.ts
import { createEnv, str, num, bool, url, port, email } from 'envguard'

export const env = createEnv({
  schema: {
    DATABASE_URL:  url({ protocols: ['postgresql:', 'postgres:'] }),
    REDIS_URL:     url({ default: 'redis://localhost:6379' }),
    PORT:          port({ default: 3000 }),
    NODE_ENV:      str({ choices: ['development', 'production', 'test'], default: 'development' }),
    DEBUG:         bool({ default: false }),
    API_KEY:       str({ secret: true }),
    ADMIN_EMAIL:   email({ default: 'admin@example.com' }),
    MAX_POOL_SIZE: num({ default: 10, min: 1, max: 100 }),
  },
})
```

### 2. Import it everywhere

```ts
import { env } from './env'

// Fully typed, never undefined at runtime
const db = createPool(env.DATABASE_URL)
app.listen(env.PORT)
```

### 3. Validate before deploy

```bash
npx envguard check --env .env.production --schema src/env.js
```

---

## API reference

### `createEnv(options)`

The primary API. Validates environment variables and returns a **frozen, typed object**.

```ts
function createEnv<S extends Schema>(options: CreateEnvOptions<S>): InferEnv<S>
```

| Option | Type | Default | Description |
|---|---|---|---|
| `schema` | `Schema` | required | Map of variable names → validators |
| `env` | `Record<string, string \| undefined>` | `process.env` | Override the env source (great for tests) |
| `skipValidation` | `boolean` | `false` | Return without throwing (useful in test setup) |
| `onError` | `(errors: FieldError[]) => void` | — | Called before throwing, for custom logging |

Throws [`EnvValidationError`](#envvalidationerror) if validation fails.

---

### Validators

All validators accept a `BaseOptions` bag:

```ts
interface BaseOptions<T> {
  default?:     T        // Makes the variable optional
  description?: string  // Shown in generated .env.example
  secret?:      boolean // Mask value in error output
}
```

#### `str(opts?)`

Validates a string. Returned type: `string`.

```ts
str()
str({ choices: ['a', 'b', 'c'] })           // string literal union NOT inferred — use enums() for that
str({ minLength: 1, maxLength: 255 })
str({ pattern: /^[a-z]+$/ })
str({ default: 'hello', secret: true })
```

| Option | Type | Description |
|---|---|---|
| `choices` | `string[]` | Restrict to allowed values |
| `minLength` | `number` | Minimum string length (inclusive) |
| `maxLength` | `number` | Maximum string length (inclusive) |
| `pattern` | `RegExp` | Must match regex |

#### `num(opts?)`

Validates a number (integer or float). Returned type: `number`.

```ts
num()
num({ min: 0, max: 100 })
num({ default: 42 })
```

#### `bool(opts?)`

Validates a boolean. Accepts: `true/false/1/0/yes/no/on/off` (case-insensitive). Returned type: `boolean`.

```ts
bool()
bool({ default: false })
```

#### `url(opts?)`

Validates a URL using the WHATWG `URL` parser. Returned type: `string`.

```ts
url()
url({ protocols: ['https:'] })
url({ protocols: ['postgresql:', 'postgres:'] })
```

#### `port(opts?)`

Validates a port number (1–65535). Returned type: `number`.

```ts
port()
port({ default: 3000 })
```

#### `email(opts?)`

Validates an email address. Returned type: `string`.

```ts
email()
email({ default: 'admin@example.com' })
```

#### `json<T>(opts?)`

Parses a JSON-encoded string. Returned type: `T` (defaults to `unknown`).

```ts
json()
json<string[]>({ default: [] })
json<{ apiUrl: string; timeout: number }>()
```

#### `enums(values, opts?)`

Validates against a const-asserted string tuple. **Narrows the return type** to the union.

```ts
enums(['debug', 'info', 'warn', 'error'] as const)
// → ValidatorSpec<'debug' | 'info' | 'warn' | 'error'>
```

---

### `generateExample(schema)`

Generates the text of a `.env.example` file from a schema. Secrets are shown as `[secret]`.

```ts
import { generateExample } from 'envguard'
import { schema } from './env'
import fs from 'node:fs'

fs.writeFileSync('.env.example', generateExample(schema))
```

Or use the CLI: `npx envguard generate`

---

### `validateEnvFile(parsed, schema)`

Validates a pre-parsed `{ KEY: value }` map against a schema, returning errors without throwing. Used internally by the CLI.

```ts
const errors = validateEnvFile(
  { PORT: 'not-a-number' },
  { PORT: port() },
)
// errors → [{ field: 'PORT', message: '...', received: 'not-a-number' }]
```

---

### `EnvValidationError`

```ts
class EnvValidationError extends Error {
  readonly errors: readonly FieldError[]
}

interface FieldError {
  field:    string           // Variable name
  message:  string           // Human-readable failure reason
  received: string | undefined  // Raw value (or '[secret]' / undefined)
}
```

---

## CLI

```bash
# Validate a .env file against a schema
npx envguard check
npx envguard check --env .env.production --schema dist/env.js

# Generate .env.example from a schema
npx envguard generate
npx envguard generate --schema dist/env.js --out .env.example
```

The schema file must export the schema object as `default`, `schema`, or the module itself:

```js
// envguard.schema.js  (default location)
const { str, url, port } = require('envguard')
module.exports = {
  DATABASE_URL: url(),
  PORT: port({ default: 3000 }),
  API_KEY: str({ secret: true }),
}
```

Exit codes: `0` = valid, `1` = invalid or error.

---

## Examples

- [Express](./examples/express/)
- [Next.js](./examples/nextjs/)
- [Fastify](./examples/fastify/)

---

## Comparison vs alternatives

### vs `envalid`

envalid is battle-tested but has a dotenv peer dependency, a larger bundle (~15 KB), no TypeScript-first design, and no CLI tooling. envguard is zero-dep and infers precise types at compile time.

### vs `envsafe`

envsafe is TS-first and has good inference but is no longer actively maintained. envguard adds the CLI, secret masking, and `.env.example` generation.

### vs `t3-env`

t3-env wraps Zod which is powerful but adds ~12 KB to your bundle and requires Zod as a peer. envguard is zero-dependency and covers 95% of real-world use cases in < 3 KB. If you already use Zod heavily, t3-env might be a better fit; otherwise envguard is the lighter choice.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Run tests: `npm test`
4. Submit a pull request

Please ensure `npm run test:coverage` passes at ≥ 90% coverage before opening a PR.

---

## License

MIT © envguard contributors
