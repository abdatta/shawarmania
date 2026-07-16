import type { ContentName } from '../data/schema'

export async function loadContent(name: ContentName): Promise<unknown> {
  const res = await fetch(`/api/content/${name}`)
  if (!res.ok) throw new Error(`load ${name}: HTTP ${res.status}`)
  return res.json()
}

export type SaveResult = { ok: true } | { ok: false; error: string }

export async function saveContent(name: ContentName, data: unknown): Promise<SaveResult> {
  const res = await fetch(`/api/content/${name}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (res.ok) return { ok: true }
  const body = (await res.json().catch(() => ({ error: `HTTP ${res.status}` }))) as {
    error?: string
  }
  return { ok: false, error: body.error ?? `HTTP ${res.status}` }
}
