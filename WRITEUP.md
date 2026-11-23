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

**How I tested.** I used it on different devices, joining as different
people, and tried 3 departure countries with 3 different budgets each to see
what it suggested. I also shared it with my own friend group: it helped us
start the planning conversation and agree on where to go before searching
for real flights and hotels.

**What I changed from that testing:**

- **More options.** The point of the app is to show an international group
  the variety of places they could go, so I expanded it from 45 to 200
  destinations and added 2–3 city, multi-country trips.
- **Better price estimates.** I checked a few real flight prices against the
  estimates. Most were close, but flights with layovers or in peak season
  were still significantly off, and short flights where budget airlines
  dominate were overestimated. I halved the fare inside those budget-airline
  markets (Europe, Southeast Asia, and within India, Mexico and Brazil).
- **Clear that prices are estimates.** The homepage now says what the app is
  for (starting the conversation), what isn't included, and to check real
  prices before booking.
- **Voting.** Testing the voting myself, I realised that for a conversation
  starter, votes shouldn't be capped, so everyone can vote for every place
  they like. And if one person really doesn't want to go somewhere, that
  should count more than others liking it (a downvote is −3), because the
  whole point is finding where everyone, from everywhere, can go together.

## Limitations and next steps

- Prices are estimates: straight-line distance fares (halved inside
  budget-airline markets) + nights × a typical daily cost. No dates, seasons
  or layovers, so they can be well off for peak-season or connecting
  flights; only spot-checked against a few real fares.
- Fixed list of 200 destinations and 218 starting cities.
- Votes are uncapped by design, so big ties are possible.

**Next steps:**

1. **Real prices and travel dates.** A real fare and hotel scanner for the
   group's top picks, once dates are set. This needs a pricing structure
   first, because each search costs money: credits, usage-based, or a
   subscription.
2. **Group rules.** Let each group set its own rules, such as how many votes
   each person gets, or what kind of places and culture they want.
3. **Photos of each place**, so people get the vibe of a city immediately.
