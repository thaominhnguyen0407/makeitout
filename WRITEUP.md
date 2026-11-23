# makeitout

**Live:** https://makeitout.app.space ·
**Code:** https://github.com/thaominhnguyen0407/makeitout

## What I built

A group trip planner for friends. One person shares a link; everyone adds
where they're flying from and what they can spend. The app ranks 200
destinations and 2–3 stop multi-city trips by whether the estimated cost fits
**everyone's** budget, and the group votes live (+1 per vote, −3 per
downvote). No accounts. Prices are estimates for brainstorming, not live
fares.

Core path: start a trip → share link → friends join → see what could fit →
vote → favourite updates for everyone in real time.

## How it uses DeepSpace

- **One `RecordRoom` per trip** (`<RecordScope roomId="trip:<id>">`), so each
  group's data is isolated and syncs live via `useQuery` / `useMutations`.
- **Server-enforced rules** in `CollectionSchema`: `permissions`,
  `writableFields`, `immutable`, and `uniqueOn` for one vote / one downvote
  per person per place.
- **Anonymous access** (`allowAnonymous`), so friends join without signing up.
- **Static prerendered homepage** outside the app shell, for a fast first load.

## Integrations

None used, on purpose. The relevant one is `serpapi/flights` (Google Flights,
$0.0325/request), but live fares need dates the app doesn't ask for yet, and
ranking 200 places for 5 people would be ~1,000 searches (~$32.50) every time
inputs change. Estimates are enough for this screen's job: narrowing down
ideas. It would make sense later as a "check real fares" button for the
group's top pick once dates are set.

## Main tradeoff

**No sign-in vs. trustworthy votes.** Anyone with the link can join right
away, which matters because one friend who won't sign up stalls the group.
The cost: anyone with the link can edit travelers or vote as anyone, so the
link is the only access control. Fine for friends, not for strangers;
optional sign-in (`userBound` columns, `update: 'own'`) is the upgrade path.

## What the agent did

Claude Code scaffolded the app, read the DeepSpace docs and SDK source, and
wrote the schemas, data hook, UI and price model; added tests; deployed; and
drafted this writeup. Problems it found by forming and testing a hypothesis:

- A stray `wrangler.json` left after moving the project folder overrode
  `wrangler.toml`, so the server was built from an old bundle.
- Changing `uniqueOn` on an existing collection wouldn't reach live trips (the
  SDK never drops old unique indexes), so unlimited votes use a new `likes`
  collection instead.

## What I verified and changed

[Add your own.]

## Limitations and next steps

- Prices are estimates: straight-line distance fares (halved inside
  budget-airline markets) + nights × a typical daily cost. No dates or
  seasons; not compared against real fares.
- Fixed list of 200 destinations and 218 starting cities.
- Unlimited votes can create big ties; no cap per person yet.

[Add what you'd do next.]
