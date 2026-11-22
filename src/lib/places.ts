/**
 * Cities, destinations, and the trip-cost estimator.
 *
 * Prices are ESTIMATES in USD, not quotes:
 *  - Flight: a distance-based round-trip economy fare (great-circle distance,
 *    a per-km rate that tapers on long hauls), times a per-destination factor
 *    for places that are pricier or harder to reach. Under 150 km we assume
 *    ground travel.
 *  - Stay: nights × a mid-range daily cost per person (shared lodging, food,
 *    local transport).
 */

export interface City {
  id: string
  name: string
  country: string
  lat: number
  lon: number
}

export interface Destination extends City {
  /** Mid-range spend per person per day, USD (shared lodging + food + local). */
  daily: number
  /** Multiplier on the distance fare for pricier / remote airports. */
  fareFactor: number
  vibe: string
}

const c = (id: string, name: string, country: string, lat: number, lon: number): City => ({
  id,
  name,
  country,
  lat,
  lon,
})

const d = (
  city: City,
  daily: number,
  vibe: string,
  fareFactor = 1,
): Destination => ({ ...city, daily, vibe, fareFactor })

// ── Destinations ─────────────────────────────────────────────────────────
export const DESTINATIONS: Destination[] = [
  d(c('lisbon', 'Lisbon', 'Portugal', 38.72, -9.14), 110, 'Tiled hills, seafood, late nights'),
  d(c('barcelona', 'Barcelona', 'Spain', 41.39, 2.17), 140, 'Beach plus city, tapas crawl'),
  d(c('paris', 'Paris', 'France', 48.86, 2.35), 190, 'Museums, bistros, long walks'),
  d(c('london', 'London', 'United Kingdom', 51.51, -0.13), 210, 'Pubs, markets, West End'),
  d(c('amsterdam', 'Amsterdam', 'Netherlands', 52.37, 4.9), 180, 'Canals and bikes'),
  d(c('rome', 'Rome', 'Italy', 41.9, 12.5), 150, 'Ruins by day, pasta by night'),
  d(c('athens', 'Athens', 'Greece', 37.98, 23.73), 115, 'Acropolis and island hops'),
  d(c('prague', 'Prague', 'Czechia', 50.08, 14.44), 100, 'Old town and cheap beer'),
  d(c('budapest', 'Budapest', 'Hungary', 47.5, 19.04), 90, 'Thermal baths, ruin bars'),
  d(c('berlin', 'Berlin', 'Germany', 52.52, 13.4), 140, 'Clubs, history, street food'),
  d(c('dubrovnik', 'Dubrovnik', 'Croatia', 42.65, 18.09), 140, 'Walled city on the Adriatic', 1.1),
  d(c('istanbul', 'Istanbul', 'Türkiye', 41.01, 28.98), 85, 'Bazaars across two continents'),
  d(c('reykjavik', 'Reykjavík', 'Iceland', 64.15, -21.94), 230, 'Hot springs and road trips', 1.1),
  d(c('marrakech', 'Marrakech', 'Morocco', 31.63, -8.01), 75, 'Riads, souks, desert trips'),
  d(c('capetown', 'Cape Town', 'South Africa', -33.92, 18.42), 95, 'Mountains meet the ocean'),
  d(c('dubai', 'Dubai', 'UAE', 25.2, 55.27), 180, 'Desert, beaches, skyline'),
  d(c('bangkok', 'Bangkok', 'Thailand', 13.76, 100.5), 65, 'Street food and rooftops'),
  d(c('chiangmai', 'Chiang Mai', 'Thailand', 18.79, 98.98), 50, 'Temples and night markets'),
  d(c('bali', 'Bali', 'Indonesia', -8.65, 115.22), 60, 'Villas, surf, rice terraces', 1.1),
  d(c('hanoi', 'Hanoi', 'Vietnam', 21.03, 105.85), 50, 'Pho, motorbikes, Ha Long Bay'),
  d(c('tokyo', 'Tokyo', 'Japan', 35.68, 139.69), 160, 'Neon, ramen, day trips'),
  d(c('seoul', 'Seoul', 'South Korea', 37.57, 126.98), 130, 'K-food, palaces, nightlife'),
  d(c('singapore', 'Singapore', 'Singapore', 1.35, 103.82), 170, 'Hawker centres, gardens'),
  d(c('sydney', 'Sydney', 'Australia', -33.87, 151.21), 180, 'Harbour, beaches, coast walks'),
  d(c('queenstown', 'Queenstown', 'New Zealand', -45.03, 168.66), 170, 'Adventure capital', 1.2),
  d(c('newyork', 'New York', 'United States', 40.71, -74.01), 250, 'Everything, all night'),
  d(c('miami', 'Miami', 'United States', 25.76, -80.19), 200, 'Beach clubs and Cuban food'),
  d(c('neworleans', 'New Orleans', 'United States', 29.95, -90.07), 170, 'Jazz, po’boys, parades'),
  d(c('austin', 'Austin', 'United States', 30.27, -97.74), 170, 'Live music and BBQ'),
  d(c('denver', 'Denver', 'United States', 39.74, -104.99), 160, 'Breweries and mountains'),
  d(c('lasvegas', 'Las Vegas', 'United States', 36.17, -115.14), 160, 'Shows, pools, the Strip'),
  d(c('sanfrancisco', 'San Francisco', 'United States', 37.77, -122.42), 240, 'Bay views, wine country'),
  d(c('honolulu', 'Honolulu', 'United States', 21.31, -157.86), 230, 'Surf and island hikes', 1.1),
  d(c('vancouver', 'Vancouver', 'Canada', 49.28, -123.12), 180, 'Ocean, forest, ski hills'),
  d(c('montreal', 'Montréal', 'Canada', 45.5, -73.57), 150, 'Bagels, festivals, old port'),
  d(c('mexicocity', 'Mexico City', 'Mexico', 19.43, -99.13), 80, 'Tacos, mezcal, museums'),
  d(c('cancun', 'Cancún', 'Mexico', 21.16, -86.85), 140, 'Resorts, cenotes, ruins'),
  d(c('oaxaca', 'Oaxaca', 'Mexico', 17.07, -96.72), 70, 'Mole, markets, mezcal', 1.15),
  d(c('sanjose', 'San José', 'Costa Rica', 9.93, -84.08), 110, 'Rainforest and volcanoes'),
  d(c('sanjuan', 'San Juan', 'Puerto Rico', 18.47, -66.11), 160, 'Old San Juan and beaches'),
  d(c('cartagena', 'Cartagena', 'Colombia', 10.39, -75.48), 85, 'Colourful walled city', 1.1),
  d(c('medellin', 'Medellín', 'Colombia', 6.24, -75.58), 70, 'Eternal spring, nightlife'),
  d(c('lima', 'Lima', 'Peru', -12.05, -77.04), 80, 'Ceviche and Machu Picchu trips'),
  d(c('buenosaires', 'Buenos Aires', 'Argentina', -34.6, -58.38), 80, 'Steak, tango, late dinners'),
  d(c('rio', 'Rio de Janeiro', 'Brazil', -22.91, -43.17), 95, 'Beaches and samba'),
]

// ── Departure cities (destinations + other major hubs) ───────────────────
const OTHER_CITIES: City[] = [
  c('chicago', 'Chicago', 'United States', 41.88, -87.63),
  c('losangeles', 'Los Angeles', 'United States', 34.05, -118.24),
  c('seattle', 'Seattle', 'United States', 47.61, -122.33),
  c('boston', 'Boston', 'United States', 42.36, -71.06),
  c('washington', 'Washington, DC', 'United States', 38.91, -77.04),
  c('atlanta', 'Atlanta', 'United States', 33.75, -84.39),
  c('dallas', 'Dallas', 'United States', 32.78, -96.8),
  c('houston', 'Houston', 'United States', 29.76, -95.37),
  c('phoenix', 'Phoenix', 'United States', 33.45, -112.07),
  c('philadelphia', 'Philadelphia', 'United States', 39.95, -75.17),
  c('minneapolis', 'Minneapolis', 'United States', 44.98, -93.27),
  c('detroit', 'Detroit', 'United States', 42.33, -83.05),
  c('sandiego', 'San Diego', 'United States', 32.72, -117.16),
  c('portland', 'Portland', 'United States', 45.52, -122.68),
  c('nashville', 'Nashville', 'United States', 36.16, -86.78),
  c('orlando', 'Orlando', 'United States', 28.54, -81.38),
  c('charlotte', 'Charlotte', 'United States', 35.23, -80.84),
  c('saltlake', 'Salt Lake City', 'United States', 40.76, -111.89),
  c('toronto', 'Toronto', 'Canada', 43.65, -79.38),
  c('calgary', 'Calgary', 'Canada', 51.05, -114.07),
  c('madrid', 'Madrid', 'Spain', 40.42, -3.7),
  c('manchester', 'Manchester', 'United Kingdom', 53.48, -2.24),
  c('dublin', 'Dublin', 'Ireland', 53.35, -6.26),
  c('edinburgh', 'Edinburgh', 'United Kingdom', 55.95, -3.19),
  c('frankfurt', 'Frankfurt', 'Germany', 50.11, 8.68),
  c('munich', 'Munich', 'Germany', 48.14, 11.58),
  c('zurich', 'Zürich', 'Switzerland', 47.38, 8.54),
  c('vienna', 'Vienna', 'Austria', 48.21, 16.37),
  c('milan', 'Milan', 'Italy', 45.46, 9.19),
  c('brussels', 'Brussels', 'Belgium', 50.85, 4.35),
  c('copenhagen', 'Copenhagen', 'Denmark', 55.68, 12.57),
  c('stockholm', 'Stockholm', 'Sweden', 59.33, 18.07),
  c('oslo', 'Oslo', 'Norway', 59.91, 10.75),
  c('warsaw', 'Warsaw', 'Poland', 52.23, 21.01),
  c('hongkong', 'Hong Kong', 'China', 22.32, 114.17),
  c('shanghai', 'Shanghai', 'China', 31.23, 121.47),
  c('beijing', 'Beijing', 'China', 39.9, 116.41),
  c('taipei', 'Taipei', 'Taiwan', 25.03, 121.57),
  c('osaka', 'Osaka', 'Japan', 34.69, 135.5),
  c('manila', 'Manila', 'Philippines', 14.6, 120.98),
  c('kualalumpur', 'Kuala Lumpur', 'Malaysia', 3.14, 101.69),
  c('jakarta', 'Jakarta', 'Indonesia', -6.21, 106.85),
  c('hochiminh', 'Ho Chi Minh City', 'Vietnam', 10.82, 106.63),
  c('delhi', 'Delhi', 'India', 28.61, 77.21),
  c('mumbai', 'Mumbai', 'India', 19.08, 72.88),
  c('bangalore', 'Bengaluru', 'India', 12.97, 77.59),
  c('melbourne', 'Melbourne', 'Australia', -37.81, 144.96),
  c('brisbane', 'Brisbane', 'Australia', -27.47, 153.03),
  c('perth', 'Perth', 'Australia', -31.95, 115.86),
  c('auckland', 'Auckland', 'New Zealand', -36.85, 174.76),
  c('johannesburg', 'Johannesburg', 'South Africa', -26.2, 28.05),
  c('nairobi', 'Nairobi', 'Kenya', -1.29, 36.82),
  c('lagos', 'Lagos', 'Nigeria', 6.52, 3.38),
  c('cairo', 'Cairo', 'Egypt', 30.04, 31.24),
  c('doha', 'Doha', 'Qatar', 25.29, 51.53),
  c('telaviv', 'Tel Aviv', 'Israel', 32.09, 34.78),
  c('saopaulo', 'São Paulo', 'Brazil', -23.55, -46.63),
  c('bogota', 'Bogotá', 'Colombia', 4.71, -74.07),
  c('santiago', 'Santiago', 'Chile', -33.45, -70.67),
]

export const CITIES: City[] = [...DESTINATIONS, ...OTHER_CITIES]
  .map(({ id, name, country, lat, lon }) => c(id, name, country, lat, lon))
  .sort((a, b) => a.name.localeCompare(b.name))

const CITY_BY_ID = new Map(CITIES.map((city) => [city.id, city]))
const DEST_BY_ID = new Map(DESTINATIONS.map((dest) => [dest.id, dest]))

export const getCity = (id: string) => CITY_BY_ID.get(id)
export const getDestination = (id: string) => DEST_BY_ID.get(id)
export const cityLabel = (city: City) => `${city.name}, ${city.country}`

/** Find a city from free text typed into the origin field. */
export function findCity(text: string): City | undefined {
  const q = text.trim().toLowerCase()
  if (!q) return undefined
  return (
    CITIES.find((city) => cityLabel(city).toLowerCase() === q) ??
    CITIES.find((city) => city.name.toLowerCase() === q)
  )
}

// ── Estimator ────────────────────────────────────────────────────────────
export function distanceKm(a: City, b: City): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step

/** Estimated round-trip economy fare in USD. */
export function estimateFlight(from: City, to: Destination): number {
  const km = distanceKm(from, to)
  if (km < 150) return 40 // train / bus / car
  const fare =
    70 +
    0.12 * Math.min(km, 1500) +
    0.08 * Math.min(Math.max(km - 1500, 0), 3500) +
    0.07 * Math.max(km - 5000, 0)
  return roundTo(fare * to.fareFactor, 10)
}

export interface CostEstimate {
  flight: number
  stay: number
  total: number
}

export function estimateTrip(from: City, to: Destination, nights: number): CostEstimate {
  const flight = estimateFlight(from, to)
  const stay = roundTo(to.daily * nights, 10)
  return { flight, stay, total: flight + stay }
}

export const formatUsd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
