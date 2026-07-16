import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Portal } from './Portal'

export function mountPortal(rootEl: HTMLElement) {
  createRoot(rootEl).render(
    <StrictMode>
      <Portal />
    </StrictMode>,
  )
}
