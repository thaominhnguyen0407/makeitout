/**
 * Multi-city trips: 2–3 nearby destinations visited in one trip.
 *
 * Candidates are built once from the destination list: each stop must be
 * within MAX_LEG_KM of the next, and only each city's closest neighbours are
 * paired, which keeps the set small (a few thousand) and the routes sensible.
 *
 * Cost per traveler (ESTIMATE, USD) for route A → B → C:
 *  - one-way flight home → A, plus one-way flight C → home (each half the
 *    round-trip estimate)
 *  - the legs between stops, the same for everyone: ground transport for
 *    short hops, a one-way flight otherwise
 *  - nights split across the stops, each at that stop's daily cost
 */

import {
  DESTINATIONS,
  distanceKm,
  estimateFlight,
  getDestination,
  type City,
  type CostEstimate,
  type Destination,
} from './places'

export const MAX_LEG_KM = 900
const NEIGHBOURS = 6
/** Each stop needs at least this many nights for a route to be offered. */
export const MIN_NIGHTS_PER_STOP = 2

export interface Route {
  id: string
  stops: Destination[]
}

const ROUTE_PREFIX = 'route:'
export const isRouteId = (id: string) => id.startsWith(ROUTE_PREFIX)
const routeId = (stops: Destination[]) => ROUTE_PREFIX + stops.map((s) => s.id).join('+')

/** Fares are symmetric, so A→B→C and C→B→A cost the same; keep one. */
function canonical(stops: Destination[]): Destination[] {
  return stops[0].id <= stops[stops.length - 1].id ? stops : [...stops].reverse()
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step

/** One-way cost per person between two stops. */
export function estimateLeg(a: Destination, b: Destination): number {
  const km = distanceKm(a, b)
  if (km < 150) return 15 // local train / bus
  if (km <= 500) return roundTo(20 + 0.1 * km, 5) // intercity train / bus
  return roundTo(estimateFlight(a, b) / 2, 5) // one-way flight
}

/** Split nights across stops, extra nights going to the earlier stops. */
export function splitNights(nights: number, stops: number): number[] {
  const base = Math.floor(nights / stops)
  return Array.from({ length: stops }, (_, i) => base + (i < nights % stops ? 1 : 0))
}

export function estimateRoute(from: City, stops: Destination[], nights: number): CostEstimate {
  const first = stops[0]
  const last = stops[stops.length - 1]
  const flight = roundTo(
    estimateFlight(from, first) / 2 + estimateFlight(from, last) / 2 + legsCost(stops),
    10,
  )
  const perStop = splitNights(nights, stops.length)
  const stay = roundTo(
    stops.reduce((sum, s, i) => sum + s.daily * perStop[i], 0),
    10,
  )
  return { flight, stay, total: flight + stay }
}

export function legsCost(stops: Destination[]): number {
  let legs = 0
  for (let i = 1; i < stops.length; i++) legs += estimateLeg(stops[i - 1], stops[i])
  return legs
}

function buildRoutes(): Route[] {
  const near = new Map<string, Destination[]>()
  for (const a of DESTINATIONS) {
    near.set(
      a.id,
      DESTINATIONS.filter((b) => b.id !== a.id && distanceKm(a, b) <= MAX_LEG_KM)
        .sort((x, y) => distanceKm(a, x) - distanceKm(a, y))
        .slice(0, NEIGHBOURS),
    )
  }

  const routes = new Map<string, Route>()
  const add = (stops: Destination[]) => {
    const s = canonical(stops)
    const id = routeId(s)
    if (!routes.has(id)) routes.set(id, { id, stops: s })
  }

  for (const a of DESTINATIONS) {
    const nb = near.get(a.id) ?? []
    for (const b of nb) add([a, b])
    // a is the middle stop; the two ends must be different and not on top of each other.
    for (let i = 0; i < nb.length; i++) {
      for (let j = i + 1; j < nb.length; j++) {
        if (distanceKm(nb[i], nb[j]) >= 150) add([nb[i], a, nb[j]])
      }
    }
  }
  return [...routes.values()]
}

let cache: Route[] | null = null
/** All candidate routes (built on first use). */
export function allRoutes(): Route[] {
  return (cache ??= buildRoutes())
}

/** Rebuild a route from its id — used for votes on routes not in the current list. */
export function routeFromId(id: string): Route | null {
  if (!isRouteId(id)) return null
  const stops = id
    .slice(ROUTE_PREFIX.length)
    .split('+')
    .map((s) => getDestination(s))
  if (stops.length < 2 || stops.some((s) => !s)) return null
  return { id, stops: stops as Destination[] }
}
