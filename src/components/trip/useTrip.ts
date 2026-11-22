/**
 * All of a trip room's live data in one place, plus the derived ranking.
 * Must be rendered inside the trip's <RecordScope>.
 */

import { useCallback, useMemo, useState } from 'react'
import { useMutations, useQuery, type RecordData } from 'deepspace'
import type { TripInfo, Traveler, Vote } from '../../schemas/trip-schemas'
import {
  DESTINATIONS,
  estimateTrip,
  getCity,
  type City,
  type CostEstimate,
  type Destination,
} from '../../lib/places'
import {
  MIN_NIGHTS_PER_STOP,
  allRoutes,
  estimateRoute,
  isRouteId,
  legsCost,
  routeFromId,
  splitNights,
  type Route,
} from '../../lib/routes'
import { getMyTravelerId, setMyTravelerId } from '../../lib/trips'

export interface TravelerCost {
  traveler: RecordData<Traveler>
  origin: City
  estimate: CostEstimate
  fits: boolean
  /** budget − total (negative when over). */
  headroom: number
}

/** One votable option: a single destination or a multi-city route. */
export interface DestinationRow {
  /** Vote id: a destination id, or `route:a+b(+c)`. */
  id: string
  kind: 'single' | 'route'
  /** "Lisbon" or "Lisbon → Porto → Madrid". */
  title: string
  /** Country, or the countries a route passes through. */
  subtitle: string
  blurb: string
  stops: Destination[]
  /** Nights at each stop. */
  nightsPer: number[]
  /** Per-person cost of getting between stops (0 for a single destination). */
  legs: number
  costs: TravelerCost[]
  fitsCount: number
  allFit: boolean
  minTotal: number
  maxTotal: number
  /** The tightest traveler's headroom — higher means more comfortable for everyone. */
  tightest: number
  voters: RecordData<Traveler>[]
}

/** Most multi-city options to show, and how often one city may appear in them. */
const MAX_ROUTES_SHOWN = 40
const MAX_ROUTES_PER_CITY = 2

const byFit = (a: DestinationRow, b: DestinationRow) =>
  Number(b.allFit) - Number(a.allFit) || b.fitsCount - a.fitsCount || b.tightest - a.tightest

type Priced = { traveler: RecordData<Traveler>; origin: City }

function makeRow(
  base: Omit<DestinationRow, 'costs' | 'fitsCount' | 'allFit' | 'minTotal' | 'maxTotal' | 'tightest'>,
  priced: Priced[],
  estimate: (origin: City) => CostEstimate,
): DestinationRow {
  const costs = priced.map(({ traveler, origin }) => {
    const est = estimate(origin)
    const headroom = Number(traveler.data.budget) - est.total
    return { traveler, origin, estimate: est, headroom, fits: headroom >= 0 }
  })
  const totals = costs.map((c) => c.estimate.total)
  const fitsCount = costs.filter((c) => c.fits).length
  return {
    ...base,
    costs,
    fitsCount,
    allFit: costs.length > 0 && fitsCount === costs.length,
    minTotal: totals.length ? Math.min(...totals) : 0,
    maxTotal: totals.length ? Math.max(...totals) : 0,
    tightest: costs.length ? Math.min(...costs.map((c) => c.headroom)) : 0,
  }
}

function routeRow(route: Route, nights: number, priced: Priced[], voters: RecordData<Traveler>[]) {
  const { stops } = route
  const countries = [...new Set(stops.map((s) => s.country))]
  return makeRow(
    {
      id: route.id,
      kind: 'route',
      title: stops.map((s) => s.name).join(' → '),
      subtitle: countries.join(' · '),
      blurb: stops.map((s) => s.vibe).join(' · '),
      stops,
      nightsPer: splitNights(nights, stops.length),
      legs: legsCost(stops),
      voters,
    },
    priced,
    (origin) => estimateRoute(origin, stops, nights),
  )
}

export function useTrip(tripId: string) {
  const info = useQuery<TripInfo>('trip_info')
  const travelersQ = useQuery<Traveler>('travelers', { orderBy: 'createdAt', orderDir: 'asc' })
  const votesQ = useQuery<Vote>('votes')

  const infoMut = useMutations<TripInfo>('trip_info')
  const travelerMut = useMutations<Traveler>('travelers')
  const voteMut = useMutations<Vote>('votes')

  const [myId, setMyIdState] = useState<string | null>(() => getMyTravelerId(tripId))
  const setMyId = useCallback(
    (id: string | null) => {
      setMyTravelerId(tripId, id)
      setMyIdState(id)
    },
    [tripId],
  )

  const tripInfo = info.records[0] ?? null
  const nights = Math.max(1, Math.min(30, Number(tripInfo?.data.nights) || 4))
  const travelers = travelersQ.records
  const travelerById = useMemo(() => new Map(travelers.map((t) => [t.recordId, t])), [travelers])

  const me = myId ? (travelerById.get(myId) ?? null) : null

  // Ignore votes from people who have since left.
  const votes = useMemo(
    () => votesQ.records.filter((v) => travelerById.has(v.data.travelerId)),
    [votesQ.records, travelerById],
  )
  const myVote = me ? (votes.find((v) => v.data.travelerId === me.recordId) ?? null) : null

  const priced = useMemo(
    () =>
      travelers
        .map((traveler) => ({ traveler, origin: getCity(traveler.data.originId) }))
        .filter((t): t is Priced => !!t.origin),
    [travelers],
  )

  const votersById = useMemo(() => {
    const map = new Map<string, RecordData<Traveler>[]>()
    for (const v of votes) {
      const t = travelerById.get(v.data.travelerId)
      if (!t) continue
      map.set(v.data.destinationId, [...(map.get(v.data.destinationId) ?? []), t])
    }
    return map
  }, [votes, travelerById])

  const rows = useMemo<DestinationRow[]>(
    () =>
      DESTINATIONS.map((destination) =>
        makeRow(
          {
            id: destination.id,
            kind: 'single',
            title: destination.name,
            subtitle: destination.country,
            blurb: destination.vibe,
            stops: [destination],
            nightsPer: [nights],
            legs: 0,
            voters: votersById.get(destination.id) ?? [],
          },
          priced,
          (origin) => estimateTrip(origin, destination, nights),
        ),
      ).sort(byFit),
    [priced, votersById, nights],
  )

  const routesAllowed = nights >= 2 * MIN_NIGHTS_PER_STOP

  const routeRows = useMemo<DestinationRow[]>(() => {
    const out: DestinationRow[] = []
    if (routesAllowed && priced.length > 0) {
      const ranked = allRoutes()
        .filter((r) => nights >= r.stops.length * MIN_NIGHTS_PER_STOP)
        .map((r) => routeRow(r, nights, priced, votersById.get(r.id) ?? []))
        .sort(byFit)
      // 3-stop routes cost more, so they'd never make a single shared top list.
      // Pick each length separately, keeping it varied: each city appears in at
      // most a couple of routes of that length.
      const lengths = [...new Set(ranked.map((r) => r.stops.length))]
      const perLength = Math.ceil(MAX_ROUTES_SHOWN / Math.max(1, lengths.length))
      for (const len of lengths) {
        const used = new Map<string, number>()
        let taken = 0
        for (const row of ranked) {
          if (taken >= perLength) break
          if (row.stops.length !== len) continue
          if (row.stops.some((s) => (used.get(s.id) ?? 0) >= MAX_ROUTES_PER_CITY)) continue
          out.push(row)
          taken++
          for (const s of row.stops) used.set(s.id, (used.get(s.id) ?? 0) + 1)
        }
      }
    }
    // A route someone voted for always stays listed, even if it dropped out.
    for (const [id, voters] of votersById) {
      if (!isRouteId(id) || out.some((r) => r.id === id)) continue
      const route = routeFromId(id)
      if (route) out.push(routeRow(route, nights, priced, voters))
    }
    return out.sort(byFit)
  }, [routesAllowed, priced, votersById, nights])

  const leader = useMemo(() => {
    const voted = [...rows, ...routeRows].filter((r) => r.voters.length > 0)
    if (!voted.length) return null
    const top = Math.max(...voted.map((r) => r.voters.length))
    const tied = voted.filter((r) => r.voters.length === top)
    return { rows: tied, votes: top }
  }, [rows, routeRows])

  return {
    status:
      info.status === 'ready' && travelersQ.status === 'ready' && votesQ.status === 'ready'
        ? ('ready' as const)
        : info.status === 'error' || travelersQ.status === 'error'
          ? ('error' as const)
          : ('loading' as const),
    tripInfo,
    nights,
    travelers,
    votes,
    me,
    myVote,
    rows,
    routeRows,
    routesAllowed,
    leader,
    setMyId,
    infoMut,
    travelerMut,
    voteMut,
  }
}

export type TripState = ReturnType<typeof useTrip>
