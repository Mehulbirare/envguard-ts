/**
 * envx — Zero-dependency TypeScript env variable validator
 * @module envx
 */

// Core
export { createEnv, generateExample, validateEnvFile } from './core.js'
export type { Schema, InferEnv, CreateEnvOptions } from './core.js'

// Validators
export { str, num, bool, url, port, email, json, enums } from './validators.js'
export type {
  ValidatorSpec,
  BaseOptions,
  StrOptions,
  NumOptions,
  BoolOptions,
  UrlOptions,
  PortOptions,
  EmailOptions,
  JsonOptions,
} from './validators.js'

// Errors
export { EnvValidationError } from './errors.js'
export type { FieldError } from './errors.js'
