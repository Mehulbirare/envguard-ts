/**
 * Minimal Express server using envx for validated env vars.
 * Run: ts-node server.ts
 */
import express from 'express'
import { env } from './env'

const app = express()

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: env.NODE_ENV,
    // Never expose secrets — show only non-sensitive config
    port: env.PORT,
  })
})

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`)
})
