/**
 * All of a trip room's live data in one place, plus the derived ranking.
 * Must be rendered inside the trip's <RecordScope>.
 */

import { useCallback, useMemo, useState } from 'react'
import { useMutations, useQuery, type RecordData } from 'deepspace'
import type { Downvote, TripInfo, Traveler, Vote } from '../../schemas/trip-schemas'
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
  downvoters: RecordData<Traveler>[]
  /** upvotes − DOWNVOTE_WEIGHT × downvotes. */
  score: number
}

/** One downvote cancels out this many upvotes. */
export const DOWNVOTE_WEIGHT = 3

/** Most multi-city options to show, and how often one city may appear in them. */
const MAX_ROUTES_SHOWN = 40
const MAX_ROUTES_PER_CITY = 2

const byFit = (a: DestinationRow, b: DestinationRow) =>
  Number(b.allFit) - Number(a.allFit) || b.fitsCount - a.fitsCount || b.tightest - a.tightest

type Priced = { traveler: RecordData<Traveler>; origin: City }

function makeRow(
  base: Omit<
    DestinationRow,
    'costs' | 'fitsCount' | 'allFit' | 'minTotal' | 'maxTotal' | 'tightest' | 'score'
  >,
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
    score: base.voters.length - DOWNVOTE_WEIGHT * base.downvoters.length,
  }
}

type Voters = Pick<DestinationRow, 'voters' | 'downvoters'>
const NO_VOTERS: Voters = { voters: [], downvoters: [] }

function routeRow(route: Route, nights: number, priced: Priced[], { voters, downvoters }: Voters) {
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
      downvoters,
    },
    priced,
    (origin) => estimateRoute(origin, stops, nights),
  )
}

export function useTrip(tripId: string) {
  const info = useQuery<TripInfo>('trip_info')
  const travelersQ = useQuery<Traveler>('travelers', { orderBy: 'createdAt', orderDir: 'asc' })
  const votesQ = useQuery<Vote>('votes')
  const downvotesQ = useQuery<Downvote>('downvotes')

  const infoMut = useMutations<TripInfo>('trip_info')
  const travelerMut = useMutations<Traveler>('travelers')
  const voteMut = useMutations<Vote>('votes')
  const downvoteMut = useMutations<Downvote>('downvotes')

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
  const downvotes = useMemo(
    () => downvotesQ.records.filter((v) => travelerById.has(v.data.travelerId)),
    [downvotesQ.records, travelerById],
  )
  /** My downvote records, keyed by option id. */
  const myDownvotes = useMemo(
    () => new Map(me ? downvotes.filter((v) => v.data.travelerId === me.recordId).map((v) => [v.data.destinationId, v]) : []),
    [downvotes, me],
  )

  const priced = useMemo(
    () =>
      travelers
        .map((traveler) => ({ traveler, origin: getCity(traveler.data.originId) }))
        .filter((t): t is Priced => !!t.origin),
    [travelers],
  )

  const votersById = useMemo(() => {
    const map = new Map<string, Voters>()
    const entry = (id: string) => {
      let e = map.get(id)
      if (!e) map.set(id, (e = { voters: [], downvoters: [] }))
      return e
    }
    for (const v of votes) {
      const t = travelerById.get(v.data.travelerId)
      if (t) entry(v.data.destinationId).voters.push(t)
    }
    for (const v of downvotes) {
      const t = travelerById.get(v.data.travelerId)
      if (t) entry(v.data.destinationId).downvoters.push(t)
    }
    return map
  }, [votes, downvotes, travelerById])

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
            ...(votersById.get(destination.id) ?? NO_VOTERS),
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
        .map((r) => routeRow(r, nights, priced, votersById.get(r.id) ?? NO_VOTERS))
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
    // A route someone voted on always stays listed, even if it dropped out.
    for (const [id, voters] of votersById) {
      if (!isRouteId(id) || out.some((r) => r.id === id)) continue
      const route = routeFromId(id)
      if (route) out.push(routeRow(route, nights, priced, voters))
    }
    return out.sort(byFit)
  }, [routesAllowed, priced, votersById, nights])

  // The favourite is the best score; a place with a net-negative or zero score never leads.
  const leader = useMemo(() => {
    const liked = [...rows, ...routeRows].filter((r) => r.score > 0)
    if (!liked.length) return null
    const top = Math.max(...liked.map((r) => r.score))
    return { rows: liked.filter((r) => r.score === top), score: top }
  }, [rows, routeRows])

  return {
    status:
      info.status === 'ready' &&
      travelersQ.status === 'ready' &&
      votesQ.status === 'ready' &&
      downvotesQ.status === 'ready'
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
    downvotes,
    myDownvotes,
    rows,
    routeRows,
    routesAllowed,
    leader,
    setMyId,
    infoMut,
    travelerMut,
    voteMut,
    downvoteMut,
  }
}

export type TripState = ReturnType<typeof useTrip>
