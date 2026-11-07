'use client'

import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { unaccent } from '@/lib/utils'

interface Props {
  id: string
  options: readonly string[] | null
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
}

const KIND = /^(Phường|Xã|Đặc khu)\s+/
const fold = (text: string) => unaccent(text.toLowerCase()).replace(/\s+/g, ' ').trim()

/**
 * Searchable list of wards (V14.27). Typing "ben thanh" or "bến thành" both find "Phường Bến Thành": matching ignores
 * accents and the Phường/Xã prefix. Keyboard: arrows move, Enter picks, Escape closes. Only a value from the list is kept.
 */
export function WardCombobox({ id, options, value, onChange, onBlur, disabled, invalid, describedBy }: Props) {
  const listId = useId()
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState<string | null>(null)
  const [active, setActive] = useState(0)

  const matches = useMemo(() => {
    if (!options) return []
    const q = fold(query ?? '')
    if (!q) return options
    const starts: string[] = [], contains: string[] = []
    for (const option of options) {
      const name = fold(option.replace(KIND, ''))
      if (name.startsWith(q)) starts.push(option)
      else if (name.includes(q) || fold(option).includes(q)) contains.push(option)
    }
    return [...starts, ...contains]
  }, [options, query])

  const show = (index: number) => {
    setActive(index)
    list.current?.children[index]?.scrollIntoView({ block: 'nearest' })
  }
  const pick = (option: string) => { onChange(option); setQuery(null); setOpen(false) }
  const close = () => { setOpen(false); setQuery(null); onBlur?.() }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) { setOpen(true); setActive(0); return }
      const next = event.key === 'ArrowDown' ? Math.min(active + 1, matches.length - 1) : Math.max(active - 1, 0)
      show(next)
    } else if (event.key === 'Enter' && open) {
      event.preventDefault()
      const option = matches[active]
      if (option) pick(option)
    } else if (event.key === 'Escape' && open) {
      event.preventDefault(); setOpen(false); setQuery(null)
    }
  }

  const placeholder = !options ? 'Đang tải danh sách…' : disabled ? 'Chọn tỉnh, thành phố trước' : 'Tìm phường, xã'
  return <div className={`ck-combo ${open ? 'is-open' : ''}`}>
    <Search size={17} className="ck-combo-search" aria-hidden="true" />
    <input
      ref={input} id={id} type="text" className="input ck-combo-input" role="combobox" autoComplete="off" spellCheck={false}
      aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-invalid={invalid || undefined} aria-describedby={describedBy}
      aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
      disabled={disabled || !options} placeholder={placeholder}
      value={query ?? value}
      onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(0) }}
      onFocus={(event) => { event.target.select(); setOpen(true); setActive(Math.max(0, value ? matches.indexOf(value) : 0)) }}
      onClick={() => setOpen(true)}
      onBlur={close}
      onKeyDown={onKeyDown}
    />
    <ChevronDown size={18} className="ck-combo-caret" aria-hidden="true" />
    {open && options ? <ul ref={list} id={listId} role="listbox" className="ck-combo-list" aria-label="Phường, xã">
      {matches.length ? matches.map((option, index) => <li
        key={option} id={`${listId}-${index}`} role="option" aria-selected={option === value}
        className={index === active ? 'is-active' : undefined}
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={() => setActive(index)}
        onClick={() => pick(option)}>
        <span>{option}</span>{option === value ? <Check size={16} aria-hidden="true" /> : null}
      </li>) : <li className="ck-combo-empty" role="presentation">Không thấy “{query}”. Thử bỏ dấu hoặc gõ ít chữ hơn.</li>}
    </ul> : null}
  </div>
}
