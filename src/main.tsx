import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import App from './App'

const root = document.getElementById('root')!

// Dev-only content portal at /admin — the whole branch (and everything the
// portal imports) is dead-code-eliminated from production builds.
if (import.meta.env.DEV && location.pathname.replace(/\/$/, '').endsWith('/admin')) {
  void import('./portal/mount').then(({ mountPortal }) => mountPortal(root))
} else {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
