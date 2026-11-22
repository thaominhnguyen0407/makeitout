import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button, useToast } from '../ui'
import { PersonDot } from './Person'
import { TravelerForm } from './TravelerForm'
import type { TripState } from './useTrip'
import { formatUsd, getCity } from '../../lib/places'

/** Left column: join / your entry, then everyone in the group. */
export function GroupPanel({ trip }: { trip: TripState }) {
  const { me, travelers, travelerMut, removeMyVotes, setMyId } = trip
  const { success, error } = useToast()
  const [editing, setEditing] = useState(false)

  const others = travelers.filter((t) => t.recordId !== me?.recordId)

  async function leave() {
    if (!me) return
    if (!window.confirm('Remove yourself from this trip? Your votes go too.')) return
    try {
      await removeMyVotes()
      await travelerMut.removeConfirmed(me.recordId)
      setMyId(null)
      setEditing(false)
    } catch (e) {
      error('Could not leave the trip', e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        {!me ? (
          <>
            <h2 className="font-display text-xl font-semibold">Add yourself</h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
              Only the group sees this. No account needed.
            </p>
            <TravelerForm
              submitLabel="Join the trip"
              disabled={!travelerMut.ready}
              onSubmit={async (value) => {
                try {
                  const id = await travelerMut.createConfirmed(value)
                  setMyId(id)
                  success(`You’re in, ${value.name}`)
                } catch (e) {
                  error('Could not join', e instanceof Error ? e.message : String(e))
                }
              }}
            />
            {others.length > 0 && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-2 text-xs text-muted-foreground">Already added yourself on another device?</p>
                <div className="flex flex-wrap gap-2">
                  {others.map((t) => (
                    <button
                      key={t.recordId}
                      type="button"
                      onClick={() => setMyId(t.recordId)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background py-1 pl-1 pr-3 text-sm hover:border-foreground/40"
                    >
                      <PersonDot id={t.recordId} name={t.data.name} size="sm" />
                      I’m {t.data.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : editing ? (
          <>
            <h2 className="mb-4 font-display text-xl font-semibold">Edit your details</h2>
            <TravelerForm
              initial={me.data}
              submitLabel="Save"
              onCancel={() => setEditing(false)}
              onSubmit={async (value) => {
                try {
                  await travelerMut.putConfirmed(me.recordId, value)
                  setEditing(false)
                } catch (e) {
                  error('Could not save', e instanceof Error ? e.message : String(e))
                }
              }}
            />
            <button
              type="button"
              onClick={leave}
              className="mt-4 text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
            >
              Leave this trip
            </button>
          </>
        ) : (
          <div className="flex items-start gap-3">
            <PersonDot id={me.recordId} name={me.data.name} />
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">You</p>
              <p className="truncate font-semibold">{me.data.name}</p>
              <p className="text-sm text-muted-foreground">
                From {getCity(me.data.originId)?.name ?? '—'} · up to {formatUsd(me.data.budget)}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} aria-label="Edit your details">
              <Pencil /> Edit
            </Button>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 flex items-baseline justify-between px-1 text-sm font-semibold">
          The group
          <span className="font-normal text-muted-foreground">{travelers.length} in</span>
        </h3>
        {travelers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Nobody yet. Add yourself, then send the link.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {travelers.map((t) => {
              const count = new Set(
                [...trip.likes, ...trip.downvotes.map((d) => d.data)]
                  .filter((v) => v.travelerId === t.recordId)
                  .map((v) => v.destinationId),
              ).size
              const voted = count > 0
              return (
                <li key={t.recordId} className="flex items-center gap-3 px-4 py-2.5">
                  <PersonDot id={t.recordId} name={t.data.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {t.data.name}
                      {t.recordId === me?.recordId && <span className="text-muted-foreground"> (you)</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {getCity(t.data.originId)?.name ?? 'Unknown city'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm tabular-nums">{formatUsd(t.data.budget)}</p>
                    <p className={voted ? 'text-xs text-primary' : 'text-xs text-muted-foreground'}>
                      {voted ? `voted on ${count}` : 'not voted'}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
