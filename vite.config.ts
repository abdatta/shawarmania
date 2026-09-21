import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { imagetools } from 'vite-imagetools'
import { validateContent } from './plugins/validate-content'
import { contentPortal } from './plugins/content-portal'
import { legalFacts } from './plugins/legal-facts'

validateContent()

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// Served from the apex custom domain shawarmania.in, so the base is /.
// Override with VITE_BASE to build for a project page (https://<user>.github.io/<repo>/).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.VITE_BASE ?? '/') : '/',
  plugins: [react(), imagetools(), contentPortal(), legalFacts()],
  build: {
    /*
      Four documents, not one.

      The landing page is the site; the other three are the legal documents the
      RCS messaging registration requires to be live, public URLs — see
      openspec/changes/legal-and-messaging-pages. Their sources sit at
      `<name>/index.html` so Rollup emits `dist/<name>/index.html`, which the
      static host serves at the directory URL `/<name>/` with no rewrite and no
      404 fallback. They carry no script, so they add no chunk to the bundle.
    */
    rollupOptions: {
      input: {
        main: here('index.html'),
        privacy: here('privacy/index.html'),
        terms: here('terms/index.html'),
        messages: here('messages/index.html'),
      },
    },
  },
}))
