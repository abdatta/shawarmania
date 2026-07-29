import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { imagetools } from 'vite-imagetools'
import { validateContent } from './plugins/validate-content'
import { contentPortal } from './plugins/content-portal'

validateContent()

// Served from the apex custom domain shawarmania.in, so the base is /.
// Override with VITE_BASE to build for a project page (https://<user>.github.io/<repo>/).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.VITE_BASE ?? '/') : '/',
  plugins: [react(), imagetools(), contentPortal()],
}))
