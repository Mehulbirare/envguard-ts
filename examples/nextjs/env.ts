/**
 * Next.js env validation with envx.
 *
 * Split into server-only and shared (public) vars.
 * Import `serverEnv` only in server components / API routes.
 * Import `publicEnv` anywhere.
 */
import { createEnv, str, bool, url, port } from 'envx'

/** Variables available only on the server. Never expose to the client. */
export const serverEnv = createEnv({
  schema: {
    DATABASE_URL: url({ protocols: ['postgresql:', 'postgres:'] }),
    NEXTAUTH_SECRET: str({ secret: true, minLength: 32 }),
    NEXTAUTH_URL: url(),
    STRIPE_SECRET_KEY: str({ secret: true }),
    NODE_ENV: str({
      choices: ['development', 'production', 'test'],
      default: 'development',
    }),
  },
})

/** Variables exposed to the browser via NEXT_PUBLIC_ prefix. */
export const publicEnv = createEnv({
  schema: {
    NEXT_PUBLIC_APP_URL: url({ default: 'http://localhost:3000' }),
    NEXT_PUBLIC_STRIPE_PK: str({ default: '' }),
    NEXT_PUBLIC_ANALYTICS: bool({ default: false }),
  },
  // In Next.js, client env vars come from a different source
  env:
    typeof window === 'undefined'
      ? process.env
      : Object.fromEntries(
          Object.entries(process.env).filter(([k]) => k.startsWith('NEXT_PUBLIC_')),
        ),
})
