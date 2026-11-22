# makeitout — writeup (DRAFT)

> Draft prepared with Claude Code. Sections marked **[YOU]** must be written
> by me in my own words. Everything else is a factual starting point I should
> check, correct, and rephrase.

**Live:** https://makeitout.app.space

## What it does

A friend group shares one link. Each person adds where they're flying from
and the total they can spend. The app ranks 45 destinations by whether the
estimated cost (round-trip flight + share of the stay) fits **everyone's**
budget, and the group votes live. No accounts.

Core path: Start a trip → name it and set nights → share link → each friend
joins → see what fits → vote → favourite shown to everyone in real time.

## Scope decision

One complete flow, done end to end, instead of many partial features. Left
out on purpose: dates, accommodation booking, real-time fares (see
Integrations), chat (the group already has a group chat).

## How it uses DeepSpace

| Need | DeepSpace primitive | Where |
|---|---|---|
| Isolate each group's data | One `RecordRoom` per trip: `<RecordScope roomId="trip:<id>">` | `src/pages/(app)/t/[tripId].tsx` |
| Data model + server-enforced rules | `CollectionSchema` with `permissions`, `writableFields`, `required`, `immutable` | `src/schemas/trip-schemas.ts` |
| One vote per traveler | `uniqueOn: ['travelerId']`, enforced in the Durable Object | `votesSchema` |
| Exactly one trip settings row | `uniqueOn: ['key']` (first creator wins; a concurrent create is rejected) | `tripInfoSchema` |
| Live updates | `useQuery` subscriptions; `useMutations` (`*Confirmed` where the next step depends on success) | `src/components/trip/useTrip.ts` |
| No-signup access | `RecordProvider allowAnonymous`; anonymous role `viewer`/`'*'` granted in schemas | `src/pages/(app)/_layout.tsx` |
| Fast public landing | Static prerendered page outside `(app)/` | `src/pages/index.tsx` |

Ranking and price estimates are computed on the client from the live
records (`useTrip.ts`, `src/lib/places.ts`). No secrets are involved: the
app calls no paid APIs, and `.dev.vars` is git-ignored.

## The main tradeoff: no sign-in vs. trustworthy data

Friends open the link and use it immediately — no account, which matters
because one person who won't sign up stalls the whole group. The cost:

- Anyone with the link can edit or remove any traveler and vote "as" anyone.
  The server enforces one vote **per traveler row**, not per real person.
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
- **The fan-out is wrong for the main view.** Ranking 45 destinations for 5
  people is 225 searches ≈ $7.30 per trip, and slow, every time inputs change.
- **Estimates are good enough to filter**, which is the job of this screen.

Where it *would* earn its place: an on-demand "check real fares" for the
group's top pick, once dates are set — N calls (one per traveler), cached in
the trip room, called from a server action so the cost is capped per trip.

**[YOU]** Decide: build that, or leave it as described. Either is defensible
if the reasoning is stated.

## Known limitations (honest edges)

- Prices are heuristics: distance-based fare (tapering per-km rate ×
  per-destination factor) + nights × typical daily cost. USD only.
  **Not yet compared against real fares.**
- Fixed list: 45 destinations, ~105 departure cities. Unlisted cities can't
  be entered.
- Open permissions (see tradeoff). No rate limiting, and trips never expire.
- Leaving deletes your vote and then your traveler row as two writes; if the
  second fails, the votes list filters out orphaned votes anyway.
- No automated tests for the trip flow inside the repo yet (the end-to-end
  check below was a scratch script).

## What the agent did

Claude Code (Opus) scaffolded the app, read the DeepSpace docs (auth,
permissions, data model, scopes) and SDK source to confirm that nested
`RecordScope`s resolve to the nearest scope, then wrote the schemas, data
hook, UI, theme, and price model; deployed; and ran checks.

## Verification

Done by the agent:
- `tsc`, ESLint, unit tests, production build + prerender: all pass.
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
