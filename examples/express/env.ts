import { createEnv, str, num, bool, url, port, email } from 'envx'

export const env = createEnv({
  schema: {
    /** PostgreSQL connection string */
    DATABASE_URL: url({ protocols: ['postgresql:', 'postgres:'] }),

    /** Server port */
    PORT: port({ default: 3000 }),

    /** Runtime environment */
    NODE_ENV: str({
      choices: ['development', 'production', 'test'],
      default: 'development',
    }),

    /** Enable verbose logging */
    DEBUG: bool({ default: false }),

    /** Secret used to sign JWTs */
    JWT_SECRET: str({ secret: true, minLength: 32 }),

    /** Admin notification address */
    ADMIN_EMAIL: email(),

    /** Number of bcrypt salt rounds */
    BCRYPT_ROUNDS: num({ default: 12, min: 10, max: 14 }),
  },
})

// env.PORT        → number
// env.DEBUG       → boolean
// env.NODE_ENV    → string
// env.JWT_SECRET  → string (masked in logs)
