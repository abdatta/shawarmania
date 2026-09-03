import { defineConfig } from 'vitest/config'

/**
 * The Worker's own tests, in plain Node.
 *
 * Nothing here needs the workerd runtime: the page renderer, the PDF builder and
 * the payload tripwire are pure functions over a receipt payload, which is where
 * the claims worth asserting live. The routing and the headers are exercised
 * against a running `wrangler dev` instead, because that is the only place they
 * are real.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['worker/test/**/*.test.ts'],
    root: new URL('..', import.meta.url).pathname,
  },
})
