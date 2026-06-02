import { useEffect, useRef, useState } from 'react'
import { Check, Pencil, RotateCcw, Tags } from 'lucide-react'
import CategoryIcon from '../ui/CategoryIcon.jsx'
import { useCategoryOverrides } from '../../context/CategoryOverridesContext.jsx'
import { EXPENSE_CATEGORIES, getCategory } from '../../lib/categories.js'

/* Palette fixée pour le color picker (10 teintes, alignées avec le
   design system de l'app). */
const PALETTE = [
  '#7C6FFF',
  '#00E5A0',
  '#FF4D6A',
  '#FFB84D',
  '#F97316',
  '#3B82F6',
  '#69C9D0',
  '#A78BFA',
  '#E1306C',
  '#10B981',
]

/* Popup color picker. `triggerRef` est le bouton qui ouvre le picker :
   on l'inclut dans la zone « cliquable » pour éviter qu'un clic
   d'outside-detection ne déclenche immédiatement la réouverture. */
function ColorPicker({ value, onChange, onClose, triggerRef }) {
  const ref = useRef(null)

  useEffect(() => {
    const onPointerDown = (e) => {
      const inPicker = ref.current?.contains(e.target)
      const inTrigger = triggerRef?.current?.contains(e.target)
      if (!inPicker && !inTrigger) onClose()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose, triggerRef])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Choisir une couleur"
      className="absolute right-0 top-full z-30 mt-2 grid w-44 grid-cols-5 gap-2 rounded-xl border p-3 shadow-xl shadow-black/40"
      style={{
        background: '#0B0F1A',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {PALETTE.map((c) => {
        const active = c.toLowerCase() === String(value).toLowerCase()
        return (
          <button
            key={c}
            type="button"
            onClick={() => {
              onChange(c)
              onClose()
            }}
            aria-label={`Couleur ${c}`}
            className="grid h-7 w-7 place-items-center rounded-full transition-transform hover:scale-110"
            style={{
              backgroundColor: c,
              boxShadow: active
                ? '0 0 0 2px rgba(255,255,255,0.9)'
                : '0 0 0 1px rgba(255,255,255,0.06)',
            }}
          >
            {active && <Check className="h-3.5 w-3.5 text-white" />}
          </button>
        )
      })}
    </div>
  )
}

function CategoryRow({ categoryKey }) {
  const {
    getDisplay,
    renameCategory,
    recolorCategory,
    resetCategory,
    overrides,
  } = useCategoryOverrides()
  const disp = getDisplay(categoryKey)
  const meta = getCategory(categoryKey)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(disp.name)
  const [pickerOpen, setPickerOpen] = useState(false)
  const inputRef = useRef(null)
  const triggerRef = useRef(null)
  const customized = Boolean(overrides[categoryKey])

  useEffect(() => {
    setDraft(disp.name)
  }, [disp.name])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commit = () => {
    const next = draft.trim()
    if (next) renameCategory(categoryKey, next)
    setEditing(false)
  }
  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditing(false)
      setDraft(disp.name)
    }
  }

  return (
    <li
      className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
      style={{
        background: '#131929',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Nom à gauche */}
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={commit}
            className="w-full rounded-lg border border-accent/40 bg-canvas px-2 py-1 text-sm font-semibold text-ink outline-none transition-colors focus:border-accent"
          />
        ) : (
          <p
            className="truncate text-sm font-semibold"
            style={{ color: disp.color }}
          >
            {disp.name}
          </p>
        )}
      </div>

      {/* Cercle coloré cliquable + crayon à droite */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            aria-label={`Choisir la couleur de ${disp.name}`}
            aria-expanded={pickerOpen}
            className="grid h-9 w-9 place-items-center rounded-full transition-transform hover:scale-105"
            style={{
              backgroundColor: disp.color,
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            <CategoryIcon name={meta.icon} className="h-4 w-4 text-white" />
          </button>
          {pickerOpen && (
            <ColorPicker
              value={disp.color}
              onChange={(c) => recolorCategory(categoryKey, c)}
              onClose={() => setPickerOpen(false)}
              triggerRef={triggerRef}
            />
          )}
        </div>

        {editing ? (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={commit}
            aria-label="Valider le nouveau nom"
            className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-dim"
          >
            <Check className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Renommer ${disp.name}`}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-accent/40 hover:text-accent"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        {customized && !editing && (
          <button
            type="button"
            onClick={() => resetCategory(categoryKey)}
            aria-label={`Restaurer la catégorie ${meta.label}`}
            title="Restaurer les valeurs par défaut"
            className="grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors hover:bg-elevated hover:text-ink"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  )
}

export default function CategorySettings() {
  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent">
          <Tags className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold">
            Gérer les catégories
          </h2>
          <p className="text-xs text-muted">
            Renomme tes catégories et choisis leur couleur. Les modifications
            se propagent partout en temps réel.
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {EXPENSE_CATEGORIES.map((key) => (
          <CategoryRow key={key} categoryKey={key} />
        ))}
      </ul>
    </section>
  )
}
