/**
 * Minimal Fastify server using envx.
 * Run: ts-node server.ts
 */
import Fastify from 'fastify'
import { env } from './env'

const app = Fastify({ logger: { level: env.LOG_LEVEL } })

app.get('/health', async () => ({ status: 'ok', env: env.NODE_ENV }))

app.listen({ port: env.PORT, host: env.HOST }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
