/**
 * Cities, destinations (200), and the trip-cost estimator.
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
  // North America
  d(c('chicago', 'Chicago', 'United States', 41.88, -87.63), 190, 'Deep dish, lakefront, architecture'),
  d(c('losangeles', 'Los Angeles', 'United States', 34.05, -118.24), 210, 'Beaches, tacos, studio tours'),
  d(c('seattle', 'Seattle', 'United States', 47.61, -122.33), 200, 'Coffee, ferries, mountain views'),
  d(c('boston', 'Boston', 'United States', 42.36, -71.06), 210, 'History walks and seafood'),
  d(c('washington', 'Washington, DC', 'United States', 38.91, -77.04), 200, 'Free museums and monuments'),
  d(c('nashville', 'Nashville', 'United States', 36.16, -86.78), 180, 'Honky-tonks and hot chicken'),
  d(c('sandiego', 'San Diego', 'United States', 32.72, -117.16), 190, 'Surf, tacos, sunshine'),
  d(c('portland', 'Portland', 'United States', 45.52, -122.68), 170, 'Food carts and forest hikes'),
  d(c('savannah', 'Savannah', 'United States', 32.08, -81.09), 170, 'Oak-lined squares, Southern food', 1.1),
  d(c('charleston', 'Charleston', 'United States', 32.78, -79.93), 190, 'Pastel houses and lowcountry food', 1.1),
  d(c('sedona', 'Sedona', 'United States', 34.87, -111.76), 200, 'Red rocks and desert hikes', 1.1),
  d(c('jacksonhole', 'Jackson Hole', 'United States', 43.48, -110.76), 230, 'Tetons, Yellowstone, wildlife', 1.3),
  d(c('anchorage', 'Anchorage', 'United States', 61.22, -149.9), 190, 'Glaciers and wild Alaska', 1.2),
  d(c('maui', 'Maui', 'United States', 20.89, -156.47), 260, 'Road to Hana, snorkelling', 1.15),
  d(c('keywest', 'Key West', 'United States', 24.56, -81.78), 230, 'Sunsets and island bars', 1.1),
  d(c('toronto', 'Toronto', 'Canada', 43.65, -79.38), 170, 'Food from everywhere, Niagara trips'),
  d(c('banff', 'Banff', 'Canada', 51.18, -115.57), 190, 'Turquoise lakes, Rocky Mountains'),
  d(c('quebec', 'Québec City', 'Canada', 46.81, -71.21), 150, 'Old-world streets, poutine', 1.1),
  d(c('tulum', 'Tulum', 'Mexico', 20.21, -87.47), 130, 'Beach ruins and cenotes'),
  d(c('puertovallarta', 'Puerto Vallarta', 'Mexico', 20.65, -105.23), 110, 'Malecón walks and beaches'),
  d(c('cabo', 'Los Cabos', 'Mexico', 22.89, -109.92), 170, 'Desert meets the Pacific'),
  // Caribbean, Central & South America
  d(c('havana', 'Havana', 'Cuba', 23.11, -82.37), 80, 'Vintage cars and salsa', 1.2),
  d(c('nassau', 'Nassau', 'Bahamas', 25.05, -77.36), 220, 'Turquoise water, island hopping'),
  d(c('montegobay', 'Montego Bay', 'Jamaica', 18.47, -77.92), 150, 'Reggae, jerk, waterfalls'),
  d(c('puntacana', 'Punta Cana', 'Dominican Republic', 18.58, -68.4), 140, 'All-inclusive beaches'),
  d(c('barbados', 'Bridgetown', 'Barbados', 13.1, -59.61), 200, 'Rum shops and calm beaches', 1.1),
  d(c('antiguagt', 'Antigua', 'Guatemala', 14.56, -90.73), 70, 'Volcanoes and colonial streets'),
  d(c('panama', 'Panama City', 'Panama', 8.98, -79.52), 100, 'Canal, skyline, old town'),
  d(c('bogota', 'Bogotá', 'Colombia', 4.71, -74.07), 70, 'Street art and mountain views'),
  d(c('quito', 'Quito', 'Ecuador', -0.18, -78.47), 65, 'Andes, markets, the equator'),
  d(c('galapagos', 'Galápagos', 'Ecuador', -0.74, -90.31), 220, 'Wildlife like nowhere else', 1.5),
  d(c('cusco', 'Cusco', 'Peru', -13.53, -71.97), 70, 'Machu Picchu base camp', 1.15),
  d(c('santiago', 'Santiago', 'Chile', -33.45, -70.67), 90, 'Andes views and wine valleys'),
  d(c('saopaulo', 'São Paulo', 'Brazil', -23.55, -46.63), 90, 'Huge food scene, nightlife'),
  d(c('florianopolis', 'Florianópolis', 'Brazil', -27.6, -48.55), 90, 'Island beaches and surf'),
  d(c('montevideo', 'Montevideo', 'Uruguay', -34.9, -56.16), 100, 'Rambla walks and asado'),
  d(c('bariloche', 'Bariloche', 'Argentina', -41.13, -71.31), 100, 'Lakes, chocolate, Patagonia', 1.15),
  d(c('mendoza', 'Mendoza', 'Argentina', -32.89, -68.84), 80, 'Malbec and the Andes'),
  // Europe
  d(c('madrid', 'Madrid', 'Spain', 40.42, -3.7), 130, 'Late dinners and the Prado'),
  d(c('porto', 'Porto', 'Portugal', 41.15, -8.61), 95, 'Port cellars and riverside views'),
  d(c('seville', 'Seville', 'Spain', 37.39, -5.98), 110, 'Flamenco and orange-tree plazas'),
  d(c('granada', 'Granada', 'Spain', 37.18, -3.6), 95, 'The Alhambra and free tapas'),
  d(c('valencia', 'Valencia', 'Spain', 39.47, -0.38), 110, 'Paella, beach, futuristic city'),
  d(c('malaga', 'Málaga', 'Spain', 36.72, -4.42), 115, 'Costa del Sol beaches'),
  d(c('palma', 'Palma de Mallorca', 'Spain', 39.57, 2.65), 150, 'Coves, cathedral, island drives'),
  d(c('tenerife', 'Tenerife', 'Spain', 28.29, -16.63), 120, 'Volcano hikes, year-round sun'),
  d(c('madeira', 'Madeira', 'Portugal', 32.65, -16.91), 110, 'Cliffs, levada walks, wine', 1.1),
  d(c('azores', 'Azores', 'Portugal', 37.74, -25.67), 110, 'Crater lakes and whale watching', 1.1),
  d(c('nice', 'Nice', 'France', 43.7, 7.27), 170, 'Riviera beaches and old town'),
  d(c('lyon', 'Lyon', 'France', 45.76, 4.84), 140, 'France’s food capital'),
  d(c('bordeaux', 'Bordeaux', 'France', 44.84, -0.58), 140, 'Wine country and grand squares'),
  d(c('marseille', 'Marseille', 'France', 43.3, 5.37), 120, 'Calanques and bouillabaisse'),
  d(c('dublin', 'Dublin', 'Ireland', 53.35, -6.26), 180, 'Pubs, music, coastal walks'),
  d(c('edinburgh', 'Edinburgh', 'United Kingdom', 55.95, -3.19), 170, 'Castle, closes, Highlands trips'),
  d(c('brussels', 'Brussels', 'Belgium', 50.85, 4.35), 150, 'Waffles, beer, grand squares'),
  d(c('bruges', 'Bruges', 'Belgium', 51.21, 3.22), 140, 'Canals, chocolate, medieval lanes'),
  d(c('hamburg', 'Hamburg', 'Germany', 53.55, 9.99), 140, 'Harbour, canals, nightlife'),
  d(c('munich', 'Munich', 'Germany', 48.14, 11.58), 160, 'Beer gardens and Alps day trips'),
  d(c('zurich', 'Zürich', 'Switzerland', 47.38, 8.54), 240, 'Lake swims and Alpine trains'),
  d(c('interlaken', 'Interlaken', 'Switzerland', 46.69, 7.86), 230, 'Jungfrau peaks and paragliding'),
  d(c('vienna', 'Vienna', 'Austria', 48.21, 16.37), 150, 'Coffee houses and palaces'),
  d(c('salzburg', 'Salzburg', 'Austria', 47.81, 13.06), 150, 'Mozart, mountains, old town'),
  d(c('milan', 'Milan', 'Italy', 45.46, 9.19), 160, 'Fashion, aperitivo, Lake Como'),
  d(c('venice', 'Venice', 'Italy', 45.44, 12.32), 180, 'Canals, islands, cicchetti'),
  d(c('florence', 'Florence', 'Italy', 43.77, 11.26), 150, 'Renaissance art and Tuscan food'),
  d(c('bologna', 'Bologna', 'Italy', 44.49, 11.34), 130, 'Arcades and fresh pasta'),
  d(c('naples', 'Naples', 'Italy', 40.85, 14.27), 110, 'Pizza, Pompeii, Amalfi Coast'),
  d(c('palermo', 'Palermo', 'Italy', 38.12, 13.36), 100, 'Street food and Sicilian beaches'),
  d(c('valletta', 'Valletta', 'Malta', 35.9, 14.51), 120, 'Fortress city, clear water'),
  d(c('santorini', 'Santorini', 'Greece', 36.39, 25.46), 170, 'Whitewashed cliffs, sunsets', 1.15),
  d(c('thessaloniki', 'Thessaloniki', 'Greece', 40.64, 22.94), 85, 'Seafront, food, nightlife'),
  d(c('split', 'Split', 'Croatia', 43.51, 16.44), 120, 'Roman palace and island ferries'),
  d(c('zagreb', 'Zagreb', 'Croatia', 45.81, 15.98), 85, 'Cafés and Plitvice day trips'),
  d(c('ljubljana', 'Ljubljana', 'Slovenia', 46.06, 14.51), 100, 'Green little capital, Lake Bled'),
  d(c('kotor', 'Kotor', 'Montenegro', 42.42, 18.77), 90, 'Fjord-like bay, walled town', 1.1),
  d(c('sarajevo', 'Sarajevo', 'Bosnia and Herzegovina', 43.86, 18.41), 60, 'Where East meets West'),
  d(c('belgrade', 'Belgrade', 'Serbia', 44.79, 20.45), 70, 'River clubs and late nights'),
  d(c('tirana', 'Tirana', 'Albania', 41.33, 19.82), 60, 'Colourful capital, Riviera trips'),
  d(c('sofia', 'Sofia', 'Bulgaria', 42.7, 23.32), 65, 'Mountains at the city edge'),
  d(c('bucharest', 'Bucharest', 'Romania', 44.43, 26.1), 70, 'Grand boulevards, Transylvania trips'),
  d(c('krakow', 'Kraków', 'Poland', 50.06, 19.94), 75, 'Medieval square, pierogi'),
  d(c('warsaw', 'Warsaw', 'Poland', 52.23, 21.01), 85, 'Rebuilt old town, vodka bars'),
  d(c('gdansk', 'Gdańsk', 'Poland', 54.35, 18.65), 80, 'Baltic port, amber, beaches'),
  d(c('copenhagen', 'Copenhagen', 'Denmark', 55.68, 12.57), 210, 'Bikes, design, New Nordic food'),
  d(c('stockholm', 'Stockholm', 'Sweden', 59.33, 18.07), 190, 'Islands, fika, old town'),
  d(c('oslo', 'Oslo', 'Norway', 59.91, 10.75), 220, 'Fjord city and saunas'),
  d(c('bergen', 'Bergen', 'Norway', 60.39, 5.32), 200, 'Gateway to the fjords', 1.1),
  d(c('helsinki', 'Helsinki', 'Finland', 60.17, 24.94), 170, 'Saunas and Nordic design'),
  d(c('tallinn', 'Tallinn', 'Estonia', 59.44, 24.75), 100, 'Fairytale old town'),
  d(c('riga', 'Riga', 'Latvia', 56.95, 24.11), 85, 'Art nouveau and markets'),
  d(c('vilnius', 'Vilnius', 'Lithuania', 54.69, 25.28), 80, 'Baroque lanes, quirky republic'),
  d(c('antalya', 'Antalya', 'Türkiye', 36.9, 30.7), 85, 'Turquoise coast, ancient ruins'),
  d(c('cappadocia', 'Cappadocia', 'Türkiye', 38.64, 34.83), 90, 'Hot-air balloons, cave hotels', 1.15),
  d(c('tbilisi', 'Tbilisi', 'Georgia', 41.72, 44.79), 60, 'Sulphur baths, wine, feasts'),
  // Middle East & Africa
  d(c('telaviv', 'Tel Aviv', 'Israel', 32.09, 34.78), 190, 'Beaches, hummus, nightlife'),
  d(c('amman', 'Amman', 'Jordan', 31.95, 35.93), 90, 'Petra and Wadi Rum trips'),
  d(c('doha', 'Doha', 'Qatar', 25.29, 51.53), 170, 'Museums and desert dunes'),
  d(c('muscat', 'Muscat', 'Oman', 23.59, 58.41), 130, 'Mountains, wadis, souks'),
  d(c('cairo', 'Cairo', 'Egypt', 30.04, 31.24), 60, 'Pyramids and the Nile'),
  d(c('fes', 'Fes', 'Morocco', 34.03, -5.0), 60, 'Maze-like medina, tanneries'),
  d(c('tunis', 'Tunis', 'Tunisia', 36.81, 10.18), 60, 'Medina, Carthage, Sidi Bou Said'),
  d(c('dakar', 'Dakar', 'Senegal', 14.72, -17.47), 80, 'Surf, music, island trips'),
  d(c('accra', 'Accra', 'Ghana', 5.6, -0.19), 80, 'Markets, beaches, coastal forts'),
  d(c('nairobi', 'Nairobi', 'Kenya', -1.29, 36.82), 100, 'Safari gateway'),
  d(c('arusha', 'Arusha', 'Tanzania', -3.39, 36.68), 110, 'Serengeti and Kilimanjaro', 1.2),
  d(c('zanzibar', 'Zanzibar', 'Tanzania', -6.16, 39.19), 90, 'Spice island beaches', 1.2),
  d(c('kigali', 'Kigali', 'Rwanda', -1.94, 30.06), 80, 'Gorilla treks, green hills', 1.15),
  d(c('victoriafalls', 'Victoria Falls', 'Zimbabwe', -17.93, 25.83), 130, 'The smoke that thunders', 1.3),
  d(c('windhoek', 'Windhoek', 'Namibia', -22.56, 17.08), 100, 'Desert road trips, dunes', 1.2),
  d(c('mauritius', 'Mauritius', 'Mauritius', -20.16, 57.5), 140, 'Lagoons and sugar-cane hills', 1.15),
  d(c('seychelles', 'Seychelles', 'Seychelles', -4.62, 55.45), 220, 'Granite beaches, clear water', 1.2),
  // Asia
  d(c('delhi', 'Delhi', 'India', 28.61, 77.21), 45, 'Forts, bazaars, Taj Mahal trips'),
  d(c('jaipur', 'Jaipur', 'India', 26.91, 75.79), 50, 'Pink City palaces'),
  d(c('mumbai', 'Mumbai', 'India', 19.08, 72.88), 60, 'Street food and seafront'),
  d(c('goa', 'Goa', 'India', 15.3, 74.12), 55, 'Beach shacks and old churches'),
  d(c('kochi', 'Kochi', 'India', 9.93, 76.27), 50, 'Backwaters and spice markets'),
  d(c('colombo', 'Colombo', 'Sri Lanka', 6.93, 79.86), 60, 'Tea country and beaches'),
  d(c('maldives', 'Malé', 'Maldives', 4.18, 73.51), 250, 'Overwater villas, reefs', 1.2),
  d(c('kathmandu', 'Kathmandu', 'Nepal', 27.72, 85.32), 45, 'Temples and Himalaya treks'),
  d(c('almaty', 'Almaty', 'Kazakhstan', 43.24, 76.89), 70, 'Mountain lakes, apple city'),
  d(c('samarkand', 'Samarkand', 'Uzbekistan', 39.65, 66.96), 55, 'Silk Road domes', 1.15),
  d(c('beijing', 'Beijing', 'China', 39.9, 116.41), 90, 'Great Wall and hutongs'),
  d(c('shanghai', 'Shanghai', 'China', 31.23, 121.47), 110, 'The Bund and soup dumplings'),
  d(c('xian', 'Xi’an', 'China', 34.34, 108.94), 70, 'Terracotta Army, Muslim Quarter'),
  d(c('chengdu', 'Chengdu', 'China', 30.57, 104.07), 70, 'Pandas and Sichuan spice'),
  d(c('guilin', 'Guilin', 'China', 25.27, 110.29), 65, 'Karst peaks, river cruises'),
  d(c('hongkong', 'Hong Kong', 'China', 22.32, 114.17), 170, 'Dim sum, harbour, hikes'),
  d(c('taipei', 'Taipei', 'Taiwan', 25.03, 121.57), 100, 'Night markets and hot springs'),
  d(c('osaka', 'Osaka', 'Japan', 34.69, 135.5), 130, 'Street food capital of Japan'),
  d(c('kyoto', 'Kyoto', 'Japan', 35.01, 135.77), 150, 'Temples, gardens, geisha streets'),
  d(c('sapporo', 'Sapporo', 'Japan', 43.06, 141.35), 130, 'Snow, ramen, beer'),
  d(c('okinawa', 'Okinawa', 'Japan', 26.21, 127.68), 130, 'Subtropical beaches, diving'),
  d(c('busan', 'Busan', 'South Korea', 35.18, 129.08), 110, 'Beaches and seafood markets'),
  d(c('jeju', 'Jeju', 'South Korea', 33.5, 126.53), 110, 'Volcanic island, coastal trails'),
  d(c('manila', 'Manila', 'Philippines', 14.6, 120.98), 60, 'Gateway to 7,000 islands'),
  d(c('cebu', 'Cebu', 'Philippines', 10.32, 123.89), 60, 'Whale sharks and waterfalls'),
  d(c('palawan', 'El Nido', 'Philippines', 11.18, 119.39), 75, 'Lagoons and limestone islands', 1.2),
  d(c('hochiminh', 'Ho Chi Minh City', 'Vietnam', 10.82, 106.63), 55, 'Buzzing streets, Mekong trips'),
  d(c('danang', 'Da Nang', 'Vietnam', 16.05, 108.22), 50, 'Beaches and Hoi An lanterns'),
  d(c('siemreap', 'Siem Reap', 'Cambodia', 13.36, 103.86), 50, 'Angkor Wat at sunrise'),
  d(c('phnompenh', 'Phnom Penh', 'Cambodia', 11.56, 104.92), 50, 'Riverside capital, markets'),
  d(c('luangprabang', 'Luang Prabang', 'Laos', 19.89, 102.13), 50, 'Monks, waterfalls, slow pace', 1.15),
  d(c('phuket', 'Phuket', 'Thailand', 7.88, 98.39), 75, 'Beaches and island boat trips'),
  d(c('krabi', 'Krabi', 'Thailand', 8.09, 98.91), 65, 'Cliffs, climbing, islands'),
  d(c('kohsamui', 'Koh Samui', 'Thailand', 9.51, 100.01), 85, 'Palm beaches, full-moon trips', 1.1),
  d(c('kualalumpur', 'Kuala Lumpur', 'Malaysia', 3.14, 101.69), 65, 'Towers, hawker stalls, caves'),
  d(c('penang', 'Penang', 'Malaysia', 5.41, 100.33), 60, 'Street art and street food'),
  d(c('yogyakarta', 'Yogyakarta', 'Indonesia', -7.8, 110.36), 45, 'Borobudur and batik'),
  // Oceania
  d(c('melbourne', 'Melbourne', 'Australia', -37.81, 144.96), 170, 'Laneway coffee, Great Ocean Road'),
  d(c('perth', 'Perth', 'Australia', -31.95, 115.86), 160, 'Beaches and quokkas'),
  d(c('cairns', 'Cairns', 'Australia', -16.92, 145.77), 150, 'Great Barrier Reef'),
  d(c('auckland', 'Auckland', 'New Zealand', -36.85, 174.76), 160, 'Harbour city, volcano walks'),
  d(c('wellington', 'Wellington', 'New Zealand', -41.29, 174.78), 150, 'Craft beer and windy waterfront'),
  d(c('fiji', 'Nadi', 'Fiji', -17.8, 177.42), 150, 'Island resorts and reefs', 1.15),
  d(c('tahiti', 'Papeete', 'French Polynesia', -17.53, -149.57), 260, 'Lagoons and overwater bungalows', 1.3),
]

// ── Departure-only cities (major hubs that are not destinations) ──────────
const OTHER_CITIES: City[] = [
  c('atlanta', 'Atlanta', 'United States', 33.75, -84.39),
  c('dallas', 'Dallas', 'United States', 32.78, -96.8),
  c('houston', 'Houston', 'United States', 29.76, -95.37),
  c('phoenix', 'Phoenix', 'United States', 33.45, -112.07),
  c('philadelphia', 'Philadelphia', 'United States', 39.95, -75.17),
  c('minneapolis', 'Minneapolis', 'United States', 44.98, -93.27),
  c('detroit', 'Detroit', 'United States', 42.33, -83.05),
  c('orlando', 'Orlando', 'United States', 28.54, -81.38),
  c('charlotte', 'Charlotte', 'United States', 35.23, -80.84),
  c('saltlake', 'Salt Lake City', 'United States', 40.76, -111.89),
  c('calgary', 'Calgary', 'Canada', 51.05, -114.07),
  c('manchester', 'Manchester', 'United Kingdom', 53.48, -2.24),
  c('frankfurt', 'Frankfurt', 'Germany', 50.11, 8.68),
  c('jakarta', 'Jakarta', 'Indonesia', -6.21, 106.85),
  c('bangalore', 'Bengaluru', 'India', 12.97, 77.59),
  c('brisbane', 'Brisbane', 'Australia', -27.47, 153.03),
  c('johannesburg', 'Johannesburg', 'South Africa', -26.2, 28.05),
  c('lagos', 'Lagos', 'Nigeria', 6.52, 3.38),
]

// Destinations first, so a destination wins if an id is ever listed twice.
const ALL_CITIES = new Map<string, City>()
for (const { id, name, country, lat, lon } of [...DESTINATIONS, ...OTHER_CITIES]) {
  if (!ALL_CITIES.has(id)) ALL_CITIES.set(id, c(id, name, country, lat, lon))
}
export const CITIES: City[] = [...ALL_CITIES.values()].sort((a, b) => a.name.localeCompare(b.name))

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
