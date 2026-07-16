/**
 * Dev-only content write API for the /admin portal.
 *
 * Safety properties:
 *  - `apply: 'serve'` — never instantiated during `vite build`; no write API can ship.
 *  - Fixed allowlist — the URL selects from the six known files; no client paths.
 *  - Shared zod validation — the portal cannot write content the build would reject.
 *  - Atomic tmp+rename writes — no torn JSON if the site tab reads mid-write.
 */
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { schemas, type ContentName } from '../src/data/schema'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 2_000_000) reject(new Error('payload too large'))
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(payload))
}

export function contentPortal(): Plugin {
  return {
    name: 'shawarmania:content-portal',
    apply: 'serve',
    configureServer(server) {
      const dataDir = path.resolve(server.config.root, 'src/data')

      server.middlewares.use('/api/content', (req, res) => {
        void (async () => {
          const name = (req.url ?? '').replace(/^\//, '').replace(/\.json$/, '').split('?')[0]
          if (!(name in schemas)) return send(res, 404, { error: `unknown content file: ${name}` })
          const file = path.join(dataDir, `${name}.json`)

          if (req.method === 'GET') {
            const raw = await fs.readFile(file, 'utf-8')
            res.setHeader('content-type', 'application/json')
            return res.end(raw)
          }

          if (req.method === 'PUT') {
            let parsedBody: unknown
            try {
              parsedBody = JSON.parse(await readBody(req))
            } catch {
              return send(res, 400, { error: 'body is not valid JSON' })
            }
            const result = schemas[name as ContentName].safeParse(parsedBody)
            if (!result.success) {
              return send(res, 422, { error: z.prettifyError(result.error) })
            }
            const tmp = `${file}.tmp`
            await fs.writeFile(tmp, `${JSON.stringify(result.data, null, 2)}\n`, 'utf-8')
            await fs.rename(tmp, file)
            return send(res, 200, { ok: true })
          }

          return send(res, 405, { error: 'method not allowed' })
        })().catch((err: unknown) => {
          send(res, 500, { error: String(err) })
        })
      })
    },
  }
}
