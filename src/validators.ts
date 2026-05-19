/** Options shared by every validator. */
export interface BaseOptions<T> {
  /**
   * Default value used when the env var is absent.
   * When provided, the variable becomes optional in validation.
   */
  default?: T
  /**
   * Human-readable description shown in generated .env.example files.
   */
  description?: string
  /**
   * When true, the value is masked as `[secret]` in log output.
   */
  secret?: boolean
}

/** Marker interface carried by every validator spec. */
export interface ValidatorSpec<T> {
  readonly _type: T
  readonly _required: boolean
  readonly _default: T | undefined
  readonly _secret: boolean
  readonly _description: string | undefined
  /** @internal */
  readonly _parse: (raw: string, field: string) => T
  /** @internal */
  readonly _validate: (value: T, field: string) => void
}

function makeSpec<T>(
  parse: (raw: string, field: string) => T,
  validate: (value: T, field: string) => void,
  opts: BaseOptions<T> & { required: boolean },
): ValidatorSpec<T> {
  return {
    _type: undefined as unknown as T,
    _required: opts.required,
    _default: opts.default,
    _secret: opts.secret ?? false,
    _description: opts.description,
    _parse: parse,
    _validate: validate,
  }
}

// ---------------------------------------------------------------------------
// str
// ---------------------------------------------------------------------------

/** Options for {@link str}. */
export interface StrOptions extends BaseOptions<string> {
  /** Restrict to a specific set of allowed values. */
  choices?: readonly string[]
  /** Minimum string length (inclusive). */
  minLength?: number
  /** Maximum string length (inclusive). */
  maxLength?: number
  /** Regex the value must match. */
  pattern?: RegExp
}

/**
 * Validates a string environment variable.
 *
 * @example
 * ```ts
 * NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' })
 * ```
 */
export function str(opts: StrOptions & { default: string }): ValidatorSpec<string>
export function str(opts?: StrOptions): ValidatorSpec<string>
export function str(opts: StrOptions = {}): ValidatorSpec<string> {
  return makeSpec<string>(
    (raw) => raw,
    (value, field) => {
      if (opts.choices && !opts.choices.includes(value)) {
        throw new Error(
          `must be one of [${opts.choices.map((c) => JSON.stringify(c)).join(', ')}], got ${JSON.stringify(value)} for ${field}`,
        )
      }
      if (opts.minLength !== undefined && value.length < opts.minLength) {
        throw new Error(`must be at least ${opts.minLength} characters for ${field}`)
      }
      if (opts.maxLength !== undefined && value.length > opts.maxLength) {
        throw new Error(`must be at most ${opts.maxLength} characters for ${field}`)
      }
      if (opts.pattern && !opts.pattern.test(value)) {
        throw new Error(`must match pattern ${opts.pattern} for ${field}`)
      }
    },
    { ...opts, required: opts.default === undefined },
  )
}

// ---------------------------------------------------------------------------
// num
// ---------------------------------------------------------------------------

/** Options for {@link num}. */
export interface NumOptions extends BaseOptions<number> {
  /** Minimum value (inclusive). */
  min?: number
  /** Maximum value (inclusive). */
  max?: number
}

/**
 * Validates a numeric environment variable. Accepts integers and floats.
 *
 * @example
 * ```ts
 * TIMEOUT_MS: num({ default: 5000, min: 0 })
 * ```
 */
export function num(opts: NumOptions & { default: number }): ValidatorSpec<number>
export function num(opts?: NumOptions): ValidatorSpec<number>
export function num(opts: NumOptions = {}): ValidatorSpec<number> {
  return makeSpec<number>(
    (raw, field) => {
      const n = Number(raw)
      if (!Number.isFinite(n)) throw new Error(`must be a finite number for ${field}`)
      return n
    },
    (value, field) => {
      if (opts.min !== undefined && value < opts.min) {
        throw new Error(`must be >= ${opts.min} for ${field}`)
      }
      if (opts.max !== undefined && value > opts.max) {
        throw new Error(`must be <= ${opts.max} for ${field}`)
      }
    },
    { ...opts, required: opts.default === undefined },
  )
}

// ---------------------------------------------------------------------------
// bool
// ---------------------------------------------------------------------------

/** Options for {@link bool}. */
export type BoolOptions = BaseOptions<boolean>

const TRUTHY = new Set(['true', '1', 'yes', 'on'])
const FALSY = new Set(['false', '0', 'no', 'off'])

/**
 * Validates a boolean environment variable.
 * Accepts: `true`, `false`, `1`, `0`, `yes`, `no`, `on`, `off` (case-insensitive).
 *
 * @example
 * ```ts
 * DEBUG: bool({ default: false })
 * ```
 */
export function bool(opts: BoolOptions & { default: boolean }): ValidatorSpec<boolean>
export function bool(opts?: BoolOptions): ValidatorSpec<boolean>
export function bool(opts: BoolOptions = {}): ValidatorSpec<boolean> {
  return makeSpec<boolean>(
    (raw, field) => {
      const lower = raw.toLowerCase()
      if (TRUTHY.has(lower)) return true
      if (FALSY.has(lower)) return false
      throw new Error(
        `must be a boolean (true/false/1/0/yes/no/on/off) for ${field}, got ${JSON.stringify(raw)}`,
      )
    },
    () => {},
    { ...opts, required: opts.default === undefined },
  )
}

// ---------------------------------------------------------------------------
// url
// ---------------------------------------------------------------------------

/** Options for {@link url}. */
export interface UrlOptions extends BaseOptions<string> {
  /** Restrict allowed URL protocols, e.g. `['https:']`. */
  protocols?: readonly string[]
}

/**
 * Validates that an environment variable is a valid URL.
 *
 * @example
 * ```ts
 * DATABASE_URL: url({ protocols: ['postgresql:', 'postgres:'] })
 * ```
 */
export function url(opts: UrlOptions & { default: string }): ValidatorSpec<string>
export function url(opts?: UrlOptions): ValidatorSpec<string>
export function url(opts: UrlOptions = {}): ValidatorSpec<string> {
  return makeSpec<string>(
    (raw, field) => {
      try {
        const parsed = new URL(raw)
        if (opts.protocols && !opts.protocols.includes(parsed.protocol)) {
          throw new Error(
            `protocol must be one of [${opts.protocols.join(', ')}] for ${field}, got ${parsed.protocol}`,
          )
        }
        return raw
      } catch (e) {
        if (e instanceof Error && e.message.includes('for ' + field)) throw e
        throw new Error(`must be a valid URL for ${field}`)
      }
    },
    () => {},
    { ...opts, required: opts.default === undefined },
  )
}

// ---------------------------------------------------------------------------
// port
// ---------------------------------------------------------------------------

/** Options for {@link port}. */
export type PortOptions = BaseOptions<number>

/**
 * Validates a TCP/UDP port number (1–65535).
 *
 * @example
 * ```ts
 * PORT: port({ default: 3000 })
 * ```
 */
export function port(opts: PortOptions & { default: number }): ValidatorSpec<number>
export function port(opts?: PortOptions): ValidatorSpec<number>
export function port(opts: PortOptions = {}): ValidatorSpec<number> {
  return makeSpec<number>(
    (raw, field) => {
      const n = parseInt(raw, 10)
      if (Number.isNaN(n) || String(n) !== raw.trim()) {
        throw new Error(`must be an integer port number for ${field}`)
      }
      if (n < 1 || n > 65535) {
        throw new Error(`must be between 1 and 65535 for ${field}`)
      }
      return n
    },
    () => {},
    { ...opts, required: opts.default === undefined },
  )
}

// ---------------------------------------------------------------------------
// email
// ---------------------------------------------------------------------------

/** Options for {@link email}. */
export type EmailOptions = BaseOptions<string>

// RFC-5321-compatible simplified regex — fast and covers 99%+ real addresses
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/

/**
 * Validates an email address environment variable.
 *
 * @example
 * ```ts
 * SMTP_FROM: email({ default: 'no-reply@example.com' })
 * ```
 */
export function email(opts: EmailOptions & { default: string }): ValidatorSpec<string>
export function email(opts?: EmailOptions): ValidatorSpec<string>
export function email(opts: EmailOptions = {}): ValidatorSpec<string> {
  return makeSpec<string>(
    (raw, field) => {
      if (!EMAIL_RE.test(raw)) {
        throw new Error(`must be a valid email address for ${field}`)
      }
      return raw
    },
    () => {},
    { ...opts, required: opts.default === undefined },
  )
}

// ---------------------------------------------------------------------------
// json
// ---------------------------------------------------------------------------

/** Options for {@link json}. */
export interface JsonOptions<T> extends BaseOptions<T> {}

/**
 * Parses a JSON-encoded environment variable into type `T`.
 * The generic parameter should match the expected shape of the parsed value.
 *
 * @example
 * ```ts
 * FEATURE_FLAGS: json<{ betaUsers: boolean }>()
 * ```
 */
export function json<T = unknown>(opts: JsonOptions<T> & { default: T }): ValidatorSpec<T>
export function json<T = unknown>(opts?: JsonOptions<T>): ValidatorSpec<T>
export function json<T = unknown>(opts: JsonOptions<T> = {}): ValidatorSpec<T> {
  return makeSpec<T>(
    (raw, field) => {
      try {
        return JSON.parse(raw) as T
      } catch {
        throw new Error(`must be valid JSON for ${field}`)
      }
    },
    () => {},
    { ...opts, required: opts.default === undefined },
  )
}

// ---------------------------------------------------------------------------
// enums  (string union)
// ---------------------------------------------------------------------------

/**
 * Validates that a variable matches one value from a const-asserted tuple.
 * Provides a narrower return type than `str({ choices })`.
 *
 * @example
 * ```ts
 * LOG_LEVEL: enums(['debug', 'info', 'warn', 'error'] as const)
 * ```
 */
export function enums<const T extends readonly string[]>(
  values: T,
  opts?: BaseOptions<T[number]>,
): ValidatorSpec<T[number]> {
  const base = opts ?? {}
  return makeSpec<T[number]>(
    (raw, field) => {
      if (!(values as readonly string[]).includes(raw)) {
        throw new Error(
          `must be one of [${values.map((v) => JSON.stringify(v)).join(', ')}] for ${field}`,
        )
      }
      return raw as T[number]
    },
    () => {},
    { ...base, required: base.default === undefined },
  )
}
