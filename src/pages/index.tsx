/**
 * Landing page — a STATIC page (no DeepSpace providers), prerendered at build.
 * "Start a trip" is a real link to /new (which mints the trip id), so it
 * works even if tapped before the page hydrates.
 */

import { Link } from 'react-router-dom'
import { ArrowRight, Check, X } from 'lucide-react'
import { Seo } from '../components/Seo'
import { seo } from '../seo'

const STEPS = [
  ['Send one link', 'Start a trip and drop the link in the group chat. Nobody has to sign up.'],
  ['Everyone adds two things', 'Where they’re flying from and what they can spend, all in.'],
  ['See what could fit', 'Places ranked by whether everyone could afford them, using rough estimates of flights and stay.'],
  ['Vote it out', 'Votes update live for the whole group. The favourite rises to the top.'],
] as const

const GOOD_FOR = [
  'Brainstorming where the group could go, including 2–3 city trips',
  'Spotting places that are clearly out of someone’s budget',
  'Getting everyone’s starting city, budget and votes in one place',
]

const NOT_FOR = [
  'Live fares or hotel prices — nothing is searched or booked',
  'Your dates: no seasons, holidays or last-minute price jumps',
  'Extras like activities, visas, insurance or baggage fees',
]

const HOW = [
  ['Flights', 'From the straight-line distance between cities, cheaper inside budget-airline markets (Europe, Southeast Asia, and within India, Mexico and Brazil).'],
  ['Stay', 'Nights × a typical mid-range daily cost per person for shared lodging, food and getting around.'],
  ['Multi-city', 'A one-way flight in, travel between stops, a one-way flight home, and the nights split across the stops.'],
] as const

export default function Landing() {
  return (
    <>
      <Seo {...seo} path="/" />
      <div data-testid="static-landing" className="min-h-screen bg-background text-foreground">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <span className="font-display text-lg font-semibold tracking-tight">makeitout</span>
          <a href="/home" className="text-sm text-muted-foreground hover:text-foreground">
            Your trips
          </a>
        </header>

        <main className="mx-auto max-w-6xl px-5 sm:px-8">
          <section className="grid items-center gap-10 py-12 sm:py-20 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <p className="mb-5 text-xs uppercase tracking-[0.25em] text-primary">Group trips, minus the spreadsheet</p>
              <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
                Where can we <em className="text-primary">all</em> afford to go?
              </h1>
              <p className="mt-6 max-w-lg text-lg text-muted-foreground">
                Everyone says where they’re flying from and what they can spend. makeitout shows the places
                that could fit every budget, and the group votes live.
              </p>
              <Link
                to="/new"
                className="mt-9 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Start a trip <ArrowRight className="size-4" />
              </Link>
              <p className="mt-3 text-sm text-muted-foreground">
                Free. No accounts. Takes a minute.{' '}
                <a href="#what-to-expect" className="underline underline-offset-2 hover:text-foreground">
                  Prices are estimates
                </a>
                .
              </p>
            </div>

            <BoardingPass />
          </section>

          <section className="border-t border-border py-14">
            <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(([title, body], i) => (
                <li key={title}>
                  <span className="font-display text-3xl font-semibold text-primary">{String(i + 1).padStart(2, '0')}</span>
                  <h2 className="mt-2 font-semibold">{title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="what-to-expect" className="scroll-mt-6 border-t border-border py-14">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-primary">What to expect</p>
            <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              A starting point for the group chat, not a price search
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Every price in makeitout is an estimate, worked out from distance and typical local costs. It’s
              meant to help your group narrow down ideas quickly. Real prices can be quite a bit higher or lower,
              so the research and booking are up to you.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-semibold">Good for</h3>
                <ul className="mt-3 space-y-2.5 text-sm">
                  {GOOD_FOR.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#1f7a4d]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-semibold">Not included</h3>
                <ul className="mt-3 space-y-2.5 text-sm">
                  {NOT_FOR.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <X className="mt-0.5 size-4 shrink-0 text-[#b4442a]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <h3 className="mt-10 font-semibold">How the estimates work</h3>
            <dl className="mt-3 grid gap-5 text-sm sm:grid-cols-3">
              {HOW.map(([term, body]) => (
                <div key={term}>
                  <dt className="font-medium">{term}</dt>
                  <dd className="mt-1 text-muted-foreground">{body}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-sm text-muted-foreground">
              All prices are per person, in USD. You can pick from 200 destinations and 218 starting cities.
            </p>

            <div className="mt-8 rounded-2xl bg-foreground px-6 py-5 text-background">
              <p className="font-semibold">Before anyone books</p>
              <p className="mt-1 text-sm opacity-80">
                Once the group has a favourite, check real flights and places to stay for your actual dates on
                a flight or travel search site. Treat the numbers here as a rough guide.
              </p>
            </div>
          </section>
        </main>

        <footer className="mx-auto max-w-6xl border-t border-border px-5 py-6 text-xs text-muted-foreground sm:px-8">
          Prices are rough estimates from distance and typical local costs, not live fares. Check real prices
          before you book.
        </footer>
      </div>
    </>
  )
}

/** Illustrative sample of the result — static markup, prerender-safe. */
function BoardingPass() {
  const rows = [
    { city: 'Lisbon', price: '$780–$1,140', votes: 3, fits: true },
    { city: 'Mexico City', price: '$690–$1,020', votes: 2, fits: true },
    { city: 'Tokyo', price: '$1,480–$2,210', votes: 0, fits: false },
  ]
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md rotate-[-1.5deg]">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_24px_48px_-24px_rgba(60,40,10,0.35)]">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span>Spring break</span>
          <span>4 nights · 5 friends</span>
        </div>
        <div className="my-5 border-t-2 border-dashed border-border" />
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.city} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-xl font-semibold">{r.city}</p>
                <p className={r.fits ? 'text-xs text-[#1f7a4d]' : 'text-xs text-[#b4442a]'}>
                  {r.price} · {r.fits ? 'fits everyone' : 'fits 2 of 5'}
                </p>
              </div>
              <span
                className={
                  r.votes >= 3
                    ? 'rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground'
                    : 'rounded-full border border-border px-3 py-1 text-sm'
                }
              >
                {r.votes} {r.votes === 1 ? 'vote' : 'votes'}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Sample · estimated prices</p>
      </div>
    </div>
  )
}
