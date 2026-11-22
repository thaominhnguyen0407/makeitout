import { useId, useState, type FormEvent } from 'react'
import { Button, Input, Label } from '../ui'
import { CITIES, cityLabel, findCity, getCity } from '../../lib/places'
import type { Traveler } from '../../schemas/trip-schemas'

const MAX_BUDGET = 100_000

/** Join the trip (no initial value) or edit your own entry. */
export function TravelerForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  disabled,
}: {
  initial?: Traveler
  submitLabel: string
  onSubmit: (value: Traveler) => Promise<void> | void
  onCancel?: () => void
  disabled?: boolean
}) {
  const listId = useId()
  const initialCity = initial ? getCity(initial.originId) : undefined
  const [name, setName] = useState(initial?.name ?? '')
  const [origin, setOrigin] = useState(initialCity ? cityLabel(initialCity) : '')
  const [budget, setBudget] = useState(initial ? String(initial.budget) : '')
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)

  const city = findCity(origin)
  const budgetNum = Number(budget)
  const errors = {
    name: !name.trim() ? 'Add your name' : null,
    origin: !city ? (origin.trim() ? 'Pick a city from the list' : 'Where are you flying from?') : null,
    budget:
      !budget || !Number.isFinite(budgetNum) || budgetNum <= 0
        ? 'Enter what you can spend'
        : budgetNum > MAX_BUDGET
          ? 'That’s a bit much — under $100k please'
          : null,
  }
  const valid = !errors.name && !errors.origin && !errors.budget

  async function submit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!valid || !city) return
    setSaving(true)
    try {
      await onSubmit({ name: name.trim().slice(0, 40), originId: city.id, budget: Math.round(budgetNum) })
    } finally {
      setSaving(false)
    }
  }

  const err = (msg: string | null) =>
    touched && msg ? <p className="mt-1 text-xs text-destructive">{msg}</p> : null

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div>
        <Label htmlFor={`${listId}-name`}>Your name</Label>
        <Input
          id={`${listId}-name`}
          value={name}
          maxLength={40}
          autoComplete="given-name"
          placeholder="Sam"
          onChange={(e) => setName(e.target.value)}
          className="mt-1 bg-background"
        />
        {err(errors.name)}
      </div>
      <div>
        <Label htmlFor={`${listId}-origin`}>Flying from</Label>
        <Input
          id={`${listId}-origin`}
          value={origin}
          list={listId}
          autoComplete="off"
          placeholder="Start typing a city…"
          onChange={(e) => setOrigin(e.target.value)}
          className="mt-1 bg-background"
        />
        <datalist id={listId}>
          {CITIES.map((c) => (
            <option key={c.id} value={cityLabel(c)} />
          ))}
        </datalist>
        {err(errors.origin)}
      </div>
      <div>
        <Label htmlFor={`${listId}-budget`}>Total you can spend (USD)</Label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
            $
          </span>
          <Input
            id={`${listId}-budget`}
            inputMode="numeric"
            value={budget}
            placeholder="1200"
            onChange={(e) => setBudget(e.target.value.replace(/[^\d]/g, ''))}
            className="bg-background pl-7"
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Flights and your share of the stay, all in.</p>
        {err(errors.budget)}
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={saving} disabled={disabled} className="flex-1">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
