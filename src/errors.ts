/** A single field-level validation failure. */
export interface FieldError {
  /** The environment variable name. */
  field: string
  /** Human-readable description of what went wrong. */
  message: string
  /** The raw value that failed validation (undefined if variable was missing). */
  received: string | undefined
}

/**
 * Thrown when one or more environment variables fail validation.
 * Provides a structured list of field errors and a formatted human-readable message.
 */
export class EnvValidationError extends Error {
  /** Structured list of every field that failed. */
  readonly errors: readonly FieldError[]

  constructor(errors: FieldError[]) {
    const lines = [
      '',
      '  [31m✖ Environment validation failed[0m',
      '',
      ...errors.map(
        (e) =>
          `  [33m${e.field}[0m: ${e.message}` +
          (e.received !== undefined ? ` (received: [90m${JSON.stringify(e.received)}[0m)` : ''),
      ),
      '',
    ]
    super(lines.join('\n'))
    this.name = 'EnvValidationError'
    this.errors = errors
    // Maintain proper prototype chain in transpiled CJS
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
