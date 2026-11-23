# makeitout — writeup (DRAFT)

> Draft prepared with Claude Code. Sections marked **[YOU]** must be written
> by me in my own words. Everything else is a factual starting point I should
> check, correct, and rephrase.

**Live:** https://makeitout.app.space

## What it does

A friend group shares one link. Each person adds where they're flying from
and the total they can spend. The app ranks 200 destinations, plus 2–3 stop
multi-city trips, by whether the estimated cost (flights + stay) fits
**everyone's** budget. The group votes live: as many upvotes as they like
(+1 each) and downvotes for places they really don't want (−3 each). No
accounts. Prices are estimates for brainstorming, and the homepage says so.

Core path: Start a trip → name it and set nights → share link → each friend
joins → see what could fit (one place or multi-city, sorted by budget or by
country) → vote → favourite shown to everyone in real time.

## Scope decision

One complete flow, done end to end, instead of many partial features. Left
out on purpose: dates, accommodation booking, real-time fares (see
Integrations), chat (the group already has a group chat).

## How it uses DeepSpace

| Need | DeepSpace primitive | Where |
|---|---|---|
| Isolate each group's data | One `RecordRoom` per trip: `<RecordScope roomId="trip:<id>">` | `src/pages/(app)/t/[tripId].tsx` |
| Data model + server-enforced rules | `CollectionSchema` with `permissions`, `writableFields`, `required`, `immutable` | `src/schemas/trip-schemas.ts` |
| One upvote per traveler **per place** (unlimited places) | `uniqueOn: ['travelerId', 'destinationId']`, enforced in the Durable Object | `likesSchema` |
| One downvote per traveler per place | same composite `uniqueOn` | `downvotesSchema` |
| Keep votes cast before unlimited voting | legacy `votes` collection (`uniqueOn: ['travelerId']`) still read and removable, never written | `votesSchema` |
| Exactly one trip settings row | `uniqueOn: ['key']` (first creator wins; a concurrent create is rejected) | `tripInfoSchema` |
| Live updates | `useQuery` subscriptions; `useMutations` (`*Confirmed` where the next step depends on success) | `src/components/trip/useTrip.ts` |
| No-signup access | `RecordProvider allowAnonymous`; anonymous role `viewer`/`'*'` granted in schemas | `src/pages/(app)/_layout.tsx` |
| Fast public landing | Static prerendered page outside `(app)/` | `src/pages/index.tsx` |

Ranking, scores and price estimates are computed on the client from the live
records (`useTrip.ts`, `src/lib/places.ts`, `src/lib/routes.ts`). No secrets are involved: the
app calls no paid APIs, and `.dev.vars` is git-ignored.

## The main tradeoff: no sign-in vs. trustworthy data

Friends open the link and use it immediately — no account, which matters
because one person who won't sign up stalls the whole group. The cost:

- Anyone with the link can edit or remove any traveler and vote "as" anyone.
  The server enforces one upvote and one downvote **per traveler row per
  place**, not per real person.
- "Who am I" is a traveler id in the browser's localStorage; a new device
  re-claims it via "I'm Sam".
- Trip ids are 10 random characters (~50 bits), so links aren't guessable,
  but the link is the only access control.

Acceptable for a group of friends; not for strangers. The upgrade path is
optional sign-in with `userBound` columns and `update: 'own'`, which
DeepSpace supports directly.

## Integrations: what I checked and decided

I listed the platform's integrations (`npx deepspace integrations list`):
38 providers. The relevant one is **`serpapi/flights`** (Google Flights,
$0.0325/request). Others (hotels, weather) are nice-to-have, not core.

Why the app uses estimates instead of live fares for now:

- **It needs inputs the app doesn't have yet.** Real fares need specific
  dates and airport codes; this flow happens *before* a group picks dates.
- **The fan-out is wrong for the main view.** Ranking 200 destinations for 5
  people is 1,000 searches ≈ $32.50 per trip, and slow, every time inputs change.
- **Estimates are good enough to filter**, which is the job of this screen.

Where it *would* earn its place: an on-demand "check real fares" for the
group's top pick, once dates are set — N calls (one per traveler), cached in
the trip room, called from a server action so the cost is capped per trip.

**[YOU]** Decide: build that, or leave it as described. Either is defensible
if the reasoning is stated.

## Known limitations (honest edges)

- Prices are heuristics: distance-based fare (tapering per-km rate ×
  per-destination factor × 0.5 inside budget-airline markets) + nights ×
  typical daily cost. USD only. No dates or seasons. **Not compared against
  real fares.** Evidence for the budget markets is 2012–2018 (IATA, ICAO,
  Rome2rio, Kiwi.com); the 0.5 is an average, not fitted.
- Distances are straight-line (haversine) between city coordinates, not
  real routes; < 150 km is treated as ground travel even across water.
- Fixed list: 200 destinations, 218 departure cities. Unlisted cities can't
  be entered.
- Multi-city trips: 2–3 stops, each ≤ 900 km from the next and ≥ 2 nights
  long. A one-way fare is estimated as half a round trip; short hops are
  priced as train/bus. At most 40 routes are shown (half 2-stop, half
  3-stop), each city in ≤ 2 per length, so the list stays varied (`src/lib/routes.ts`).
- Open permissions (see tradeoff). No rate limiting, and trips never expire.
- Unlimited upvotes mean someone who votes for everything creates a big tie
  (shown as separate pills, "8 tied for the lead"). No cap per person yet.
- Downvotes only affect the score and the favourite, not the list order
  (the list is sorted by budget fit or country).
- The sort choice (Budget / Country A–Z) isn't remembered across reloads.
- Leaving deletes your votes and then your traveler row as separate writes;
  if one fails, votes from people who left are filtered out anyway.
- Reading legacy votes (trips created before unlimited voting) was checked by
  reading code and type-checking, not end to end: tests can only create new
  trips, which never write to the legacy collection.

## Decisions I made after the first version

Each is live. What changed and where is factual; the *why* is mine to write.

1. **200 destinations (was 45)** — 41 departure-only cities promoted, 114
   added; existing ids kept so votes survive. `src/lib/places.ts`
   **[YOU] Why:**
2. **Multi-city trips (2–3 stops)** — stops ≤ 900 km apart, ≥ 2 nights each,
   one-way in/out + travel between stops; votable as `route:a+b(+c)` ids
   with no schema change. `src/lib/routes.ts`
   **[YOU] Why:**
3. **Downvotes worth −3** — one strong "no" outweighs three "yes"es; the
   favourite is the best score above zero. `downvotesSchema`, `DOWNVOTE_WEIGHT`
   **[YOU] Why −3 (and not a veto or −1):**
4. **Sort by budget or by country A–Z** — a multi-city trip is listed under
   every country it visits. `DestinationList.tsx`
   **[YOU] Why:**
5. **Unlimited upvotes per person** — new `likes` collection; legacy `votes`
   still counted. Ties shown as separate pills.
   **[YOU] Why, and whether to cap votes per person:**
6. **Cheaper flights in budget-airline markets** — × 0.5 inside Europe (incl.
   Türkiye, Morocco) and Southeast Asia, and within India, Mexico and Brazil;
   researched which markets qualify before choosing. `isBudgetMarket`
   **[YOU] Why this approach over live fares or a per-route table:**
7. **Homepage "What to expect"** — states that prices are estimates for
   brainstorming, what's not included, how estimates work, and to check real
   prices before booking. `src/pages/index.tsx`
   **[YOU] Why:**

## What the agent did

Claude Code (Opus) scaffolded the app, read the DeepSpace docs (auth,
permissions, data model, scopes) and SDK source to confirm that nested
`RecordScope`s resolve to the nearest scope, then wrote the schemas, data
hook, UI, theme, and price model; deployed; and ran checks.

Later, for the decisions above, it implemented each change, added tests,
deployed, and checked the live bundle for the new code each time. Problems it
found along the way, each by forming a hypothesis and testing it:

- **Stale build config after moving the project folder.** A stray
  `wrangler.json` (old build output, pointing at the previous path) in the
  project root took precedence over `wrangler.toml`, so the server was built
  from an old bundle, not `worker.ts`. Confirmed from the build's recorded
  config path; fixed by moving the stray files out. The move had also left
  `.git` and `.gitignore` behind in the old folder; restored.
- **Changing `uniqueOn` wouldn't reach existing trips.** The SDK creates
  unique indexes with `CREATE UNIQUE INDEX IF NOT EXISTS` and never drops
  them, so editing the one-vote rule would have kept failing on live trips
  while tests (fresh trips) passed. Used a new `likes` collection instead.
- **"I don't see the feature"** (twice) — the change was committed or local
  but not deployed; confirmed by searching the live bundle, with a control
  string to prove the search worked.
- **Tied favourites read like one long trip** — the banner joined tied
  titles with " · "; now one pill per option.
- Two false alarms caught before acting: a test selector that also matched an
  unrelated `<section>`, and a live-bundle search whose pattern didn't match
  how the build minifies string arrays.

## Verification

Done by the agent:
- `tsc`, ESLint, 22 unit tests, production build + prerender: all pass.
- Unit tests (`src/lib/*.test.ts`): 200 unique destinations, route
  construction and pricing, budget-market fares (7 routes must be $40–150,
  5 others must not change — run red before the change, green after).
- Browser tests in the repo (`tests/trip.spec.ts`, run by
  `npx deepspace test run e2e`): create a trip, join, multi-city routes incl.
  3-stop, vote, country grouping (A–Z, cross-border route under 2+
  countries); and a two-browser test of unlimited votes, ties, a downvote
  outweighing an upvote live, and voting taking back a downvote.
- Two-browser end-to-end script (desktop "Sam" in New York, phone "Ana" in
  London) against **localhost and the live URL**: create trip, both join, Sam
  sees Ana live, vote, Ana sees the leader live, second vote → "2 of 2",
  nights change syncs, Ana still recognised after reload, no console errors.
- **Bug found only on the live site:** tapping "Start a trip" before the
  prerendered page hydrated did nothing (an `onClick` button in static HTML).
  Hypothesis confirmed by clicking after full load (worked). Fixed by making
  it a real link to `/new`; re-tested live. (commit "Fix Start a trip…")

**[YOU] What I verified myself:** (devices, browsers, what I tried to break)

**[YOU] What I changed or disagreed with:** (e.g. the fare formula,
permissions, wording — and why)

## If I had more time

**[YOU]** Pick 1–3, in priority order, with a reason each.
