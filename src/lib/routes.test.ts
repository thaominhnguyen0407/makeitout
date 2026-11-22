import { describe, expect, it } from 'vitest'
import { CITIES, DESTINATIONS, distanceKm, estimateTrip, getCity, getDestination } from './places'
import { MAX_LEG_KM, allRoutes, estimateRoute, isRouteId, routeFromId, splitNights } from './routes'

describe('destinations', () => {
  it('has 200 destinations with unique ids', () => {
    expect(DESTINATIONS).toHaveLength(200)
    expect(new Set(DESTINATIONS.map((d) => d.id)).size).toBe(200)
  })

  it('lists every city once and every destination as a departure city', () => {
    expect(new Set(CITIES.map((c) => c.id)).size).toBe(CITIES.length)
    for (const d of DESTINATIONS) expect(getCity(d.id), d.id).toBeDefined()
  })

  it('has sane coordinates and costs', () => {
    for (const d of DESTINATIONS) {
      expect(Math.abs(d.lat), d.id).toBeLessThanOrEqual(90)
      expect(Math.abs(d.lon), d.id).toBeLessThanOrEqual(180)
      expect(d.daily, d.id).toBeGreaterThan(0)
    }
  })
})

describe('multi-city routes', () => {
  const routes = allRoutes()

  it('builds 2- and 3-stop routes with short legs and stable ids', () => {
    expect(routes.length).toBeGreaterThan(100)
    expect(new Set(routes.map((r) => r.id)).size).toBe(routes.length)
    for (const r of routes) {
      expect(r.stops.length === 2 || r.stops.length === 3).toBe(true)
      expect(new Set(r.stops.map((s) => s.id)).size).toBe(r.stops.length)
      for (let i = 1; i < r.stops.length; i++) {
        expect(distanceKm(r.stops[i - 1], r.stops[i])).toBeLessThanOrEqual(MAX_LEG_KM)
      }
      expect(isRouteId(r.id)).toBe(true)
      expect(routeFromId(r.id)?.stops.map((s) => s.id)).toEqual(r.stops.map((s) => s.id))
    }
  })

  it('rejects unknown route ids', () => {
    expect(routeFromId('route:lisbon+atlantis')).toBeNull()
    expect(routeFromId('lisbon')).toBeNull()
  })

  it('splits nights across stops', () => {
    expect(splitNights(7, 3)).toEqual([3, 2, 2])
    expect(splitNights(4, 2)).toEqual([2, 2])
  })

  it('prices a route like two halves of round trips plus the hop', () => {
    const from = getCity('newyork')!
    const lisbon = getDestination('lisbon')!
    const porto = getDestination('porto')!
    const single = estimateTrip(from, lisbon, 6)
    const route = estimateRoute(from, [lisbon, porto], 6)
    // Porto is ~275 km away: the trip costs a bit more to get around, and stays are cheaper there.
    expect(route.flight).toBeGreaterThan(single.flight)
    expect(route.flight - single.flight).toBeLessThan(120)
    expect(route.stay).toBeLessThan(single.stay)
  })
})
