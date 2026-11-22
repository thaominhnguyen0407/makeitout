/**
 * Landing page — a STATIC page (no DeepSpace providers), prerendered at build.
 * "Start a trip" is a real link to /new (which mints the trip id), so it
 * works even if tapped before the page hydrates.
 */

import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Seo } from '../components/Seo'
import { seo } from '../seo'

const STEPS = [
  ['Send one link', 'Start a trip and drop the link in the group chat. Nobody has to sign up.'],
  ['Everyone adds two things', 'Where they’re flying from and what they can spend, all in.'],
  ['See what fits', 'Destinations ranked by whether everyone can afford them, with estimated flights and stay.'],
  ['Vote it out', 'Votes update live for the whole group. The favourite rises to the top.'],
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
                that fit every budget, and the group votes live.
              </p>
              <Link
                to="/new"
                className="mt-9 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Start a trip <ArrowRight className="size-4" />
              </Link>
              <p className="mt-3 text-sm text-muted-foreground">Free. No accounts. Takes a minute.</p>
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
        </main>

        <footer className="mx-auto max-w-6xl border-t border-border px-5 py-6 text-xs text-muted-foreground sm:px-8">
          Prices are rough estimates from distance and typical local costs, not live fares.
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
      </div>
    </div>
  )
}
