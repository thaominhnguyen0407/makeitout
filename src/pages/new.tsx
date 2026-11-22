/**
 * /new — mints a trip id and redirects to /t/<id>.
 *
 * "Start a trip" links here with a real <a href> rather than an onClick, so a
 * tap works even before the prerendered landing page has hydrated (on the
 * live site an early tap on a JS-only button did nothing). Static page: no
 * providers needed, and the id is only minted in the browser.
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { newTripId } from '../lib/trips'

export default function NewTrip() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate(`/t/${newTripId()}`, { replace: true })
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      <title>New trip · makeitout</title>
      <meta name="robots" content="noindex" />
      Setting up your trip…
    </div>
  )
}
