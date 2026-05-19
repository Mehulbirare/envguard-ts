import { createEnv, str, num, bool, url, port, json } from 'envx'

export const env = createEnv({
  schema: {
    DATABASE_URL: url({ protocols: ['postgresql:', 'postgres:'] }),
    REDIS_URL: url({ protocols: ['redis:', 'rediss:'], default: 'redis://localhost:6379' }),
    PORT: port({ default: 3000 }),
    HOST: str({ default: '0.0.0.0' }),
    NODE_ENV: str({
      choices: ['development', 'production', 'test'],
      default: 'development',
    }),
    LOG_LEVEL: str({
      choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
      default: 'info',
    }),
    JWT_SECRET: str({ secret: true, minLength: 32 }),
    RATE_LIMIT_MAX: num({ default: 100, min: 1 }),
    CORS_ORIGINS: json<string[]>({ default: ['http://localhost:3000'] }),
    TRUST_PROXY: bool({ default: false }),
  },
})
