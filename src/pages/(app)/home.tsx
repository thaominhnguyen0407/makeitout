/**
 * Your trips — the trips this browser has opened, plus a way to start one.
 * The list lives in localStorage, so it is per device.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import { getRecentTrips, newTripId } from '../../lib/trips'

export default function HomePage() {
  const navigate = useNavigate()
  const [trips] = useState(getRecentTrips)

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">On this device</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Your trips</h1>
        </div>
        <Button onClick={() => navigate(`/t/${newTripId()}`)}>
          <Plus /> New trip
        </Button>
      </div>

      {trips.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          No trips yet. Start one, or open the link a friend sent you.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {trips.map((t) => (
            <li key={t.id}>
              <Link to={`/t/${t.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-accent/60">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Opened {new Date(t.openedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
