/**
 * A trip: one shared link per friend group.
 *
 * The trip id in the URL selects its own RecordRoom (`trip:<id>`), so all
 * travelers, votes, and settings for this group live there and sync live.
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RecordScope } from 'deepspace'
import { Check, Link2, Minus, Plus } from 'lucide-react'
import { Button, Input, Label, useToast } from '@/components/ui'
import { tripSchemas } from '../../../schemas/trip-schemas'
import { isValidTripId, rememberTrip, tripRoomId } from '../../../lib/trips'
import { useTrip, type TripState } from '../../../components/trip/useTrip'
import { GroupPanel } from '../../../components/trip/GroupPanel'
import { DestinationList } from '../../../components/trip/DestinationList'

export default function TripPage() {
  const { tripId } = useParams()
  if (!isValidTripId(tripId)) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-display text-2xl font-semibold">That trip link looks broken</p>
        <Link to="/" className="text-sm text-primary underline">
          Start a new trip
        </Link>
      </div>
    )
  }
  return (
    <RecordScope key={tripId} roomId={tripRoomId(tripId)} schemas={tripSchemas}>
      <TripBoard tripId={tripId} />
    </RecordScope>
  )
}

function TripBoard({ tripId }: { tripId: string }) {
  const trip = useTrip(tripId)
  const name = trip.tripInfo?.data.name

  useEffect(() => {
    if (name) rememberTrip(tripId, name)
  }, [tripId, name])

  if (trip.status === 'loading') {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading trip…</div>
  }
  if (trip.status === 'error') {
    return (
      <div className="flex h-full items-center justify-center text-sm text-destructive">
        Couldn’t load this trip. Check your connection and refresh.
      </div>
    )
  }
  if (!trip.tripInfo) return <SetupTrip trip={trip} />

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <title>{`${trip.tripInfo.data.name} · makeitout`}</title>
      <TripHeader trip={trip} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <GroupPanel trip={trip} />
        </aside>
        <section aria-label="Destinations">
          <DestinationList trip={trip} />
        </section>
      </div>
    </div>
  )
}

function SetupTrip({ trip }: { trip: TripState }) {
  const [name, setName] = useState('')
  const [nights, setNights] = useState(4)
  const [saving, setSaving] = useState(false)
  const { error } = useToast()

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await trip.infoMut.createConfirmed({ key: 'main', name: name.trim().slice(0, 60) || 'Our trip', nights })
    } catch (err) {
      // Someone else may have set it up a moment earlier — the live query will show theirs.
      const msg = err instanceof Error ? err.message : String(err)
      if (!/duplicate/i.test(msg)) error('Could not create the trip', msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-border bg-card p-7">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">New trip</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight">What are we calling this?</h1>
        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="trip-name">Trip name</Label>
            <Input
              id="trip-name"
              autoFocus
              value={name}
              maxLength={60}
              placeholder="Spring break 2027"
              onChange={(e) => setName(e.target.value)}
              className="mt-1 bg-background"
            />
          </div>
          <div>
            <Label>How many nights?</Label>
            <NightsStepper value={nights} onChange={setNights} className="mt-1" />
          </div>
        </div>
        <Button type="submit" loading={saving} disabled={!trip.infoMut.ready} className="mt-6 w-full">
          Create trip &amp; get the link
        </Button>
      </form>
    </div>
  )
}

function TripHeader({ trip }: { trip: TripState }) {
  const info = trip.tripInfo!
  const [draft, setDraft] = useState(info.data.name)
  const [copied, setCopied] = useState(false)
  const { error } = useToast()

  // Follow renames made by others while not editing.
  useEffect(() => setDraft(info.data.name), [info.data.name])

  function saveName() {
    const next = draft.trim().slice(0, 60)
    if (!next) return setDraft(info.data.name)
    if (next !== info.data.name) trip.infoMut.put(info.recordId, { name: next })
  }

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: info.data.name, text: 'Add your budget and vote on where we go', url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      error('Couldn’t copy', 'Copy the address from your browser bar instead.')
    }
  }

  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Group trip</p>
        <input
          aria-label="Trip name"
          value={draft}
          maxLength={60}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="mt-1 w-full truncate bg-transparent font-display text-3xl font-semibold leading-tight outline-none focus:underline focus:decoration-primary focus:decoration-2 focus:underline-offset-4 sm:text-4xl"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Nights</span>
          <NightsStepper
            value={trip.nights}
            onChange={(n) => trip.infoMut.put(info.recordId, { nights: n })}
          />
        </div>
        <Button onClick={share} variant={copied ? 'secondary' : 'default'}>
          {copied ? <Check /> : <Link2 />}
          {copied ? 'Link copied' : 'Share link'}
        </Button>
      </div>
    </header>
  )
}

function NightsStepper({
  value,
  onChange,
  className,
}: {
  value: number
  onChange: (n: number) => void
  className?: string
}) {
  const btn =
    'flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent'
  return (
    <div className={`inline-flex items-center gap-1 rounded-full border border-border bg-card p-0.5 ${className ?? ''}`}>
      <button type="button" className={btn} aria-label="Fewer nights" disabled={value <= 1} onClick={() => onChange(value - 1)}>
        <Minus className="size-4" />
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button type="button" className={btn} aria-label="More nights" disabled={value >= 30} onClick={() => onChange(value + 1)}>
        <Plus className="size-4" />
      </button>
    </div>
  )
}
