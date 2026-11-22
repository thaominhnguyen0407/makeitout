import { useState } from 'react'
import { Check, ChevronDown, Plane, Trophy, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { formatUsd } from '../../lib/places'
import { useToast } from '../ui'
import { PersonDot } from './Person'
import type { DestinationRow, TripState } from './useTrip'

type Filter = 'fits' | 'all'
type Mode = 'single' | 'route'

export function DestinationList({ trip }: { trip: TripState }) {
  const { rows, routeRows, routesAllowed, travelers, me, myVote, voteMut, leader, nights } = trip
  const { warning, error } = useToast()
  const [mode, setMode] = useState<Mode>('single')
  const [filter, setFilter] = useState<Filter>('fits')
  const [open, setOpen] = useState<string | null>(null)

  const list = mode === 'single' ? rows : routeRows
  const fitting = list.filter((r) => r.allFit)
  // An option someone already voted for stays visible even if it no longer fits.
  const shown = filter === 'fits' ? list.filter((r) => r.allFit || r.voters.length > 0) : list

  async function vote(destId: string) {
    if (!me) {
      warning('Add yourself first', 'Join the trip on the left, then vote.')
      return
    }
    try {
      if (myVote?.data.destinationId === destId) await voteMut.removeConfirmed(myVote.recordId)
      else if (myVote) await voteMut.putConfirmed(myVote.recordId, { destinationId: destId })
      else await voteMut.createConfirmed({ travelerId: me.recordId, destinationId: destId })
    } catch (e) {
      error('Vote didn’t go through', e instanceof Error ? e.message : String(e))
    }
  }

  if (travelers.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <Plane className="mb-3 size-8 text-muted-foreground" />
        <p className="font-display text-xl font-semibold">Destinations show up once people join</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Everyone adds where they’re flying from and what they can spend. Then we work out which places
          fit everyone.
        </p>
      </div>
    )
  }

  return (
    <div>
      {leader && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-foreground px-5 py-4 text-background">
          <Trophy className="size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider opacity-70">
              {leader.rows.length > 1 ? 'Tied for the lead' : 'Group favourite so far'}
            </p>
            <p className="truncate font-display text-lg font-semibold">
              {leader.rows.map((r) => r.title).join(' · ')}
            </p>
          </div>
          <p className="ml-auto shrink-0 text-sm tabular-nums opacity-80">
            {leader.votes} of {travelers.length} {travelers.length === 1 ? 'vote' : 'votes'}
          </p>
        </div>
      )}

      <div className="mb-3">
        <Segmented
          label="Trip type"
          value={mode}
          onChange={(m) => {
            setMode(m)
            setOpen(null)
          }}
          options={[
            ['single', `One place · ${rows.filter((r) => r.allFit).length} fit`],
            ['route', `Multi-city · ${routeRows.filter((r) => r.allFit).length} fit`],
          ]}
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Segmented
          label="Filter"
          value={filter}
          onChange={setFilter}
          options={[
            ['fits', `Fits everyone · ${fitting.length}`],
            ['all', `All · ${list.length}`],
          ]}
        />
        <p className="text-xs text-muted-foreground">
          Estimated per person, {nights} {nights === 1 ? 'night' : 'nights'},{' '}
          {mode === 'single' ? 'round-trip flight' : 'flights + travel between stops'}
        </p>
      </div>

      {mode === 'route' && !routesAllowed && routeRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
          <p className="font-display text-lg font-semibold">Multi-city needs a longer trip</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Each stop gets at least 2 nights, so 2 cities need 4+ nights and 3 cities need 6+. This trip is{' '}
            {nights} {nights === 1 ? 'night' : 'nights'}.
          </p>
        </div>
      ) : shown.length === 0 ? (
        <NothingFits rows={list} mode={mode} onShowAll={() => setFilter('all')} />
      ) : (
        <ul className="space-y-2.5">
          {shown.map((row) => (
            <DestinationCard
              key={row.id}
              row={row}
              groupSize={travelers.length}
              isMine={myVote?.data.destinationId === row.id}
              expanded={open === row.id}
              onToggle={() => setOpen(open === row.id ? null : row.id)}
              onVote={() => vote(row.id)}
              canVote={voteMut.ready}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: [T, string][]
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-full border border-border bg-card p-1 text-sm">
      {options.map(([key, text]) => (
        <button
          key={key}
          role="tab"
          aria-selected={value === key}
          onClick={() => onChange(key)}
          className={cn(
            'rounded-full px-3 py-1.5 transition-colors',
            value === key ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

function NothingFits({ rows, mode, onShowAll }: { rows: DestinationRow[]; mode: Mode; onShowAll: () => void }) {
  const closest = rows[0]
  const over = closest?.costs.filter((c) => !c.fits) ?? []
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
      <p className="font-display text-lg font-semibold">Nothing fits everyone’s budget yet</p>
      {closest && (
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Closest is {closest.title}: {over.map((c) => c.traveler.data.name).join(', ')}{' '}
          {over.length === 1 ? 'would need' : 'would need up to'}{' '}
          {formatUsd(Math.max(...over.map((c) => -c.headroom)))} more. Try fewer nights or bigger budgets.
        </p>
      )}
      <button onClick={onShowAll} className="mt-4 text-sm font-medium text-primary underline-offset-2 hover:underline">
        {mode === 'single' ? 'Show all destinations' : 'Show all multi-city trips'}
      </button>
    </div>
  )
}

function DestinationCard({
  row,
  groupSize,
  isMine,
  expanded,
  onToggle,
  onVote,
  canVote,
}: {
  row: DestinationRow
  groupSize: number
  isMine: boolean
  expanded: boolean
  onToggle: () => void
  onVote: () => void
  canVote: boolean
}) {
  const { costs, allFit, fitsCount, voters } = row
  const price =
    row.minTotal === row.maxTotal ? formatUsd(row.minTotal) : `${formatUsd(row.minTotal)}–${formatUsd(row.maxTotal)}`

  return (
    <li
      className={cn(
        'overflow-hidden rounded-2xl border bg-card transition-colors',
        isMine ? 'border-primary ring-1 ring-primary' : 'border-border',
      )}
    >
      <div className="flex items-center gap-3 p-4 sm:gap-4">
        <button type="button" onClick={onToggle} aria-expanded={expanded} className="min-w-0 flex-1 text-left">
          <div className="flex items-baseline gap-2">
            <h3 className="truncate font-display text-lg font-semibold">{row.title}</h3>
            <span className="truncate text-xs text-muted-foreground">{row.subtitle}</span>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {row.kind === 'route'
              ? row.stops.map((s, i) => `${row.nightsPer[i]}n ${s.name}`).join(' · ')
              : row.blurb}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-medium tabular-nums">{price}</span>
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs',
                allFit ? 'text-[#1f7a4d]' : 'text-[#b4442a]',
              )}
            >
              {allFit ? <Check className="size-3.5" /> : <X className="size-3.5" />}
              {allFit ? 'Fits everyone' : `Fits ${fitsCount} of ${groupSize}`}
            </span>
            <ChevronDown
              className={cn('size-4 text-muted-foreground transition-transform', expanded && 'rotate-180')}
            />
          </div>
        </button>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            onClick={onVote}
            disabled={!canVote}
            aria-pressed={isMine}
            className={cn(
              'min-w-[84px] rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50',
              isMine
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'border border-border bg-background hover:border-foreground/50',
            )}
          >
            {isMine ? 'Voted' : 'Vote'}
            {voters.length > 0 && <span className="ml-1.5 tabular-nums opacity-80">{voters.length}</span>}
          </button>
          {voters.length > 0 && (
            <div className="flex -space-x-1.5">
              {voters.slice(0, 5).map((v) => (
                <PersonDot key={v.recordId} id={v.recordId} name={v.data.name} size="sm" />
              ))}
              {voters.length > 5 && (
                <span className="inline-flex h-6 items-center pl-2.5 text-xs text-muted-foreground">
                  +{voters.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-background/60 px-4 py-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-1.5 font-normal">Who</th>
                <th className="pb-1.5 text-right font-normal">{row.kind === 'route' ? 'Travel' : 'Flight'}</th>
                <th className="hidden pb-1.5 text-right font-normal sm:table-cell">Stay</th>
                <th className="pb-1.5 text-right font-normal">Total</th>
                <th className="pb-1.5 text-right font-normal">vs budget</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {costs.map((c) => (
                <tr key={c.traveler.recordId}>
                  <td className="py-1">
                    <span className="font-medium">{c.traveler.data.name}</span>
                    <span className="hidden text-muted-foreground sm:inline"> · {c.origin.name}</span>
                  </td>
                  <td className="py-1 text-right">{formatUsd(c.estimate.flight)}</td>
                  <td className="hidden py-1 text-right sm:table-cell">{formatUsd(c.estimate.stay)}</td>
                  <td className="py-1 text-right">{formatUsd(c.estimate.total)}</td>
                  <td className={cn('py-1 text-right', c.fits ? 'text-[#1f7a4d]' : 'text-[#b4442a]')}>
                    {c.fits ? `${formatUsd(c.headroom)} left` : `${formatUsd(-c.headroom)} over`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {row.kind === 'route' ? (
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p>
                {row.stops
                  .map((s, i) => `${row.nightsPer[i]} ${row.nightsPer[i] === 1 ? 'night' : 'nights'} in ${s.name} (≈ ${formatUsd(s.daily)}/day)`)
                  .join(' · ')}
              </p>
              <p>
                Travel = one-way flight to {row.stops[0].name}, ≈ {formatUsd(row.legs)} between stops, one-way flight
                home from {row.stops[row.stops.length - 1].name}.
              </p>
              <p className="italic">{row.blurb}</p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Stay ≈ {formatUsd(row.stops[0].daily)}/person/day for shared lodging, food and getting around.
            </p>
          )}
        </div>
      )}
    </li>
  )
}
