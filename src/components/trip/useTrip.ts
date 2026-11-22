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
import { getMyTravelerId, setMyTravelerId } from '../../lib/trips'

export interface TravelerCost {
  traveler: RecordData<Traveler>
  origin: City
  estimate: CostEstimate
  fits: boolean
  /** budget − total (negative when over). */
  headroom: number
}

export interface DestinationRow {
  destination: Destination
  costs: TravelerCost[]
  fitsCount: number
  allFit: boolean
  minTotal: number
  maxTotal: number
  /** The tightest traveler's headroom — higher means more comfortable for everyone. */
  tightest: number
  voters: RecordData<Traveler>[]
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

  const rows = useMemo<DestinationRow[]>(() => {
    const priced = travelers
      .map((traveler) => ({ traveler, origin: getCity(traveler.data.originId) }))
      .filter((t): t is { traveler: RecordData<Traveler>; origin: City } => !!t.origin)

    const votersByDest = new Map<string, RecordData<Traveler>[]>()
    for (const v of votes) {
      const t = travelerById.get(v.data.travelerId)
      if (!t) continue
      votersByDest.set(v.data.destinationId, [...(votersByDest.get(v.data.destinationId) ?? []), t])
    }

    return DESTINATIONS.map((destination) => {
      const costs = priced.map(({ traveler, origin }) => {
        const estimate = estimateTrip(origin, destination, nights)
        const headroom = Number(traveler.data.budget) - estimate.total
        return { traveler, origin, estimate, headroom, fits: headroom >= 0 }
      })
      const totals = costs.map((c) => c.estimate.total)
      const fitsCount = costs.filter((c) => c.fits).length
      return {
        destination,
        costs,
        fitsCount,
        allFit: costs.length > 0 && fitsCount === costs.length,
        minTotal: totals.length ? Math.min(...totals) : 0,
        maxTotal: totals.length ? Math.max(...totals) : 0,
        tightest: costs.length ? Math.min(...costs.map((c) => c.headroom)) : 0,
        voters: votersByDest.get(destination.id) ?? [],
      }
    }).sort(
      (a, b) =>
        Number(b.allFit) - Number(a.allFit) || b.fitsCount - a.fitsCount || b.tightest - a.tightest,
    )
  }, [travelers, votes, travelerById, nights])

  const leader = useMemo(() => {
    const voted = rows.filter((r) => r.voters.length > 0)
    if (!voted.length) return null
    const top = Math.max(...voted.map((r) => r.voters.length))
    const tied = voted.filter((r) => r.voters.length === top)
    return { rows: tied, votes: top }
  }, [rows])

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
    leader,
    setMyId,
    infoMut,
    travelerMut,
    voteMut,
  }
}

export type TripState = ReturnType<typeof useTrip>
