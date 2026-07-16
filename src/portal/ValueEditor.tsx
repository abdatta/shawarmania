/**
 * Value-driven recursive editor: renders the loaded JSON as form controls.
 * Types come from the current value; nullable fields use NULL_TYPE_HINTS when
 * toggled on. The server's zod validation remains the actual gate.
 */
import { ARRAY_TEMPLATES, ENUM_HINTS, IMAGE_KEYS, LONG_TEXT_FIELDS, NULL_TYPE_HINTS } from './fieldHints'

type Props = {
  name: string
  value: unknown
  onChange: (next: unknown) => void
}

function labelize(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase())
}

function structuredCloneValue<T>(v: T): T {
  return v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T)
}

export function ValueEditor({ name, value, onChange }: Props) {
  /* ---- null ---- */
  if (value === null) {
    const hint = NULL_TYPE_HINTS[name] ?? 'string'
    const enable = () => {
      if (name === 'hours') onChange([structuredCloneValue(ARRAY_TEMPLATES.hours)])
      else if (name === 'image') onChange(IMAGE_KEYS[0])
      else if (ENUM_HINTS[name]) onChange(ENUM_HINTS[name][0])
      else onChange(hint === 'number' ? 0 : hint === 'url' ? 'https://' : '')
    }
    return (
      <span className="p-null">
        <em>not set</em>
        <button type="button" className="p-mini" onClick={enable}>
          set value
        </button>
      </span>
    )
  }

  /* ---- primitives ---- */
  if (typeof value === 'boolean') {
    return (
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
    )
  }
  if (typeof value === 'number') {
    return (
      <span className="p-inline">
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        />
        {NULL_TYPE_HINTS[name] && (
          <button type="button" className="p-mini" onClick={() => onChange(null)}>
            clear
          </button>
        )}
      </span>
    )
  }
  if (typeof value === 'string') {
    if (name === 'image') {
      return (
        <span className="p-inline">
          <select value={value} onChange={(e) => onChange(e.target.value)}>
            {IMAGE_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <button type="button" className="p-mini" onClick={() => onChange(null)}>
            clear
          </button>
        </span>
      )
    }
    if (ENUM_HINTS[name]) {
      return (
        <span className="p-inline">
          <select value={value} onChange={(e) => onChange(e.target.value)}>
            {ENUM_HINTS[name].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {NULL_TYPE_HINTS[name] && (
            <button type="button" className="p-mini" onClick={() => onChange(null)}>
              clear
            </button>
          )}
        </span>
      )
    }
    const long = LONG_TEXT_FIELDS.has(name) || value.length > 70
    return (
      <span className="p-inline">
        {long ? (
          <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
        )}
        {NULL_TYPE_HINTS[name] && (
          <button type="button" className="p-mini" onClick={() => onChange(null)}>
            clear
          </button>
        )}
      </span>
    )
  }

  /* ---- arrays ---- */
  if (Array.isArray(value)) {
    const template = ARRAY_TEMPLATES[name]
    const isObjectRows = value.length > 0 ? typeof value[0] === 'object' : typeof template === 'object'
    return (
      <div className={isObjectRows ? 'p-array' : 'p-array p-array-flat'}>
        {value.map((item, i) => (
          <div key={i} className={isObjectRows ? 'p-card' : 'p-flatrow'}>
            <div className="p-cardbar">
              <span className="p-cardno">
                {typeof item === 'object' && item !== null && 'name' in (item as object)
                  ? String((item as Record<string, unknown>).name)
                  : `#${i + 1}`}
              </span>
              <button
                type="button"
                className="p-mini p-danger"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                remove
              </button>
            </div>
            <ValueEditor
              name={`${name}[]`}
              value={item}
              onChange={(next) => onChange(value.map((v, j) => (j === i ? next : v)))}
            />
          </div>
        ))}
        {template !== undefined && (
          <button
            type="button"
            className="p-mini p-add"
            onClick={() => onChange([...value, structuredCloneValue(template)])}
          >
            + add {name === 'items' ? 'menu item' : name.replace(/s$/, '')}
          </button>
        )}
      </div>
    )
  }

  /* ---- objects ---- */
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    return (
      <div className="p-fields">
        {Object.entries(obj).map(([key, v]) => (
          <label key={key} className="p-field">
            <span className="p-label">{labelize(key)}</span>
            <ValueEditor name={key} value={v} onChange={(next) => onChange({ ...obj, [key]: next })} />
          </label>
        ))}
      </div>
    )
  }

  return <em>unsupported</em>
}
