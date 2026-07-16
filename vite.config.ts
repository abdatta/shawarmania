import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { imagetools } from 'vite-imagetools'

// Project-page deploys serve from /<repo-name>/ — override with VITE_BASE if the
// repo is renamed (see README). Dev always serves from /.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.VITE_BASE ?? '/shawarmania/') : '/',
  plugins: [react(), imagetools()],
}))
