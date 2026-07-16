import { useCallback, useEffect, useState } from 'react'
import type { ContentName } from '../data/schema'
import { loadContent, saveContent } from './api'
import { ValueEditor } from './ValueEditor'
import './portal.css'

const FILES: { name: ContentName; label: string; blurb: string }[] = [
  { name: 'brand', label: 'Brand', blurb: 'Identity, taglines, phones, socials' },
  { name: 'menu', label: 'Menu', blurb: 'Categories, items, prices, badges' },
  { name: 'outlets', label: 'Outlets', blurb: 'Addresses, hours, FSSAI, order links' },
  { name: 'stats', label: 'Stats & proof', blurb: 'Counters, timeline, lab report' },
  { name: 'testimonials', label: 'Testimonials', blurb: 'Vlogger videos, quotes' },
  { name: 'franchise', label: 'Franchise', blurb: 'Models, support, FAQs, enquiry' },
]

type Checklist = { label: string; done: boolean; where: string }[]

function buildChecklist(data: Partial<Record<ContentName, unknown>>): Checklist {
  const g = (name: ContentName) => data[name] as Record<string, unknown> | undefined
  const franchise = g('franchise')
  const brand = g('brand')
  const outlets = (g('outlets')?.outlets ?? []) as { hours: unknown }[]
  const models = (franchise?.models ?? []) as { franchiseFee: unknown; totalInvestment: unknown }[]
  const enquiry = (franchise?.enquiry ?? {}) as Record<string, unknown>
  const menuItems = (g('menu')?.items ?? []) as { price: unknown; counterPrice: unknown }[]
  return [
    {
      label: 'Franchise economics (fee / investment per model)',
      done: models.some((m) => m.franchiseFee !== null || m.totalInvestment !== null),
      where: 'Franchise → Models',
    },
    {
      label: 'Confirmed opening hours per outlet',
      done: outlets.every((o) => o.hours !== null),
      where: 'Outlets → Hours',
    },
    {
      label: 'Founder / brand story note',
      done: brand?.founderNote != null,
      where: 'Brand → Founder note',
    },
    {
      label: 'Official franchise WhatsApp number',
      done: enquiry.whatsappNumber != null,
      where: 'Franchise → Enquiry',
    },
    {
      label: 'Web3Forms access key (enquiry form)',
      done: enquiry.formEndpoint != null && enquiry.formAccessKey != null,
      where: 'Franchise → Enquiry',
    },
    {
      label: 'Business email',
      done: brand?.email != null,
      where: 'Brand → Email',
    },
    {
      label: 'Dessert & veg shawarma prices',
      done: menuItems.every((i) => i.price !== null || i.counterPrice !== null),
      where: 'Menu → Items',
    },
  ]
}

function FileEditor({ name }: { name: ContentName }) {
  const [value, setValue] = useState<unknown>(undefined)
  const [status, setStatus] = useState<{ kind: 'idle' | 'saving' | 'saved' | 'error'; msg?: string }>({ kind: 'idle' })
  const [dirty, setDirty] = useState(false)

  const refresh = useCallback(() => {
    loadContent(name)
      .then((v) => {
        setValue(v)
        setDirty(false)
      })
      .catch((e: unknown) => setStatus({ kind: 'error', msg: String(e) }))
  }, [name])

  useEffect(refresh, [refresh])
  useEffect(() => {
    const onFocus = () => {
      if (!dirty) refresh()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [dirty, refresh])

  if (value === undefined) return <p className="p-status">Loading…</p>

  const save = async () => {
    setStatus({ kind: 'saving' })
    const result = await saveContent(name, value)
    if (result.ok) {
      setStatus({ kind: 'saved' })
      setDirty(false)
      setTimeout(() => setStatus({ kind: 'idle' }), 2500)
    } else {
      setStatus({ kind: 'error', msg: result.error })
    }
  }

  return (
    <div className="p-editor">
      <div className="p-savebar">
        <button type="button" className="p-save" onClick={() => void save()} disabled={status.kind === 'saving'}>
          {status.kind === 'saving' ? 'Saving…' : `Save ${name}.json`}
        </button>
        {dirty && status.kind === 'idle' && <span className="p-dirty">unsaved changes</span>}
        {status.kind === 'saved' && <span className="p-saved">✓ saved — site reloads automatically</span>}
        {status.kind === 'error' && <pre className="p-error">{status.msg}</pre>}
      </div>
      <ValueEditor
        name={name}
        value={value}
        onChange={(next) => {
          setValue(next)
          setDirty(true)
        }}
      />
    </div>
  )
}

export function Portal() {
  const [tab, setTab] = useState<ContentName | 'home'>('home')
  const [all, setAll] = useState<Partial<Record<ContentName, unknown>>>({})

  useEffect(() => {
    if (tab !== 'home') return
    void Promise.all(
      FILES.map(async (f) => [f.name, await loadContent(f.name)] as const),
    ).then((entries) => setAll(Object.fromEntries(entries)))
  }, [tab])

  return (
    <div className="p-shell">
      <header className="p-header">
        <h1>
          Shawarmania <span>content portal</span>
        </h1>
        <p>
          Edit → Save → the site tab refreshes. Publish with{' '}
          <code>git add src/data && git commit && git push</code>.
        </p>
      </header>
      <nav className="p-tabs">
        <button type="button" className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>
          To-do
        </button>
        {FILES.map((f) => (
          <button
            key={f.name}
            type="button"
            className={tab === f.name ? 'active' : ''}
            onClick={() => setTab(f.name)}
            title={f.blurb}
          >
            {f.label}
          </button>
        ))}
      </nav>
      <main className="p-main">
        {tab === 'home' ? (
          <div className="p-checklist">
            <h2>What the site still needs from you</h2>
            <ul>
              {buildChecklist(all).map((item) => (
                <li key={item.label} className={item.done ? 'done' : ''}>
                  <span className="p-check">{item.done ? '✓' : '○'}</span>
                  <span>
                    {item.label}
                    <em> — {item.where}</em>
                  </span>
                </li>
              ))}
            </ul>
            <p className="p-note">
              Everything already filled comes from verified public sources (Swiggy, Zomato, Google,
              your Instagram). Data provenance: <code>src/data/SOURCES.md</code>.
            </p>
          </div>
        ) : (
          <FileEditor key={tab} name={tab} />
        )}
      </main>
    </div>
  )
}
