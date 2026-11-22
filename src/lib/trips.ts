/**
 * Trip links and per-browser memory.
 *
 * A trip is identified only by its random id in the URL (/t/<id>), which
 * maps to its own RecordRoom. This browser remembers which traveler it is in
 * each trip and which trips it has opened — conveniences only, so every
 * storage access is guarded and the app still works without it.
 */

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

export function newTripId(): string {
  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

export const isValidTripId = (id: string | undefined): id is string =>
  !!id && /^[a-z0-9]{6,32}$/.test(id)

export const tripRoomId = (tripId: string) => `trip:${tripId}`

const meKey = (tripId: string) => `makeitout:me:${tripId}`
const RECENT_KEY = 'makeitout:recent'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* storage unavailable — fine */
  }
}

export const getMyTravelerId = (tripId: string) => read(meKey(tripId))
export const setMyTravelerId = (tripId: string, travelerId: string | null) =>
  write(meKey(tripId), travelerId)

export interface RecentTrip {
  id: string
  name: string
  openedAt: number
}

export function getRecentTrips(): RecentTrip[] {
  try {
    const parsed = JSON.parse(read(RECENT_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((t) => isValidTripId(t?.id)) : []
  } catch {
    return []
  }
}

export function rememberTrip(id: string, name: string) {
  const rest = getRecentTrips().filter((t) => t.id !== id)
  write(RECENT_KEY, JSON.stringify([{ id, name, openedAt: Date.now() }, ...rest].slice(0, 12)))
}
