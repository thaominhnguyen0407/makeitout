import { test, expect } from '@playwright/test'
import { captureConsoleErrors } from './helpers/errors'

/**
 * Core trip flow, anonymous: create a trip, join it, see single and
 * multi-city options, vote for a multi-city route, see it lead.
 */
test('create a trip, join, and vote for a multi-city route', async ({ page }) => {
  const errors = captureConsoleErrors(page)

  await page.goto('/new')
  await expect(page).toHaveURL(/\/t\/[a-z0-9]+$/, { timeout: 15_000 })

  await page.getByLabel('Trip name').fill('Test trip')
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'More nights' }).click() // 4 → 7
  await page.getByRole('button', { name: /Create trip/ }).click()

  await page.getByLabel('Your name').fill('Sam')
  await page.getByLabel('Flying from').fill('New York, United States')
  await page.getByLabel('Total you can spend (USD)').fill('2500')
  await page.getByRole('button', { name: 'Join the trip' }).click()

  // Single destinations come first.
  await expect(page.getByRole('tab', { name: /^One place/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: /^All · 200$/ })).toBeVisible({ timeout: 15_000 })

  // Multi-city routes.
  await page.getByRole('tab', { name: /^Multi-city/ }).click()
  const firstRoute = page.locator('li', { has: page.locator('h3', { hasText: '→' }) }).first()
  await expect(firstRoute).toBeVisible()
  const title = (await firstRoute.locator('h3').textContent())!.trim()
  // 7 nights is enough for 3-stop routes too.
  await expect(page.locator('h3', { hasText: /→.*→/ }).first()).toBeAttached()

  await firstRoute.getByRole('button', { name: /^Vote/ }).click()
  await expect(page.getByText('Group favourite so far')).toBeVisible()
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible()

  // Country A–Z: groups are alphabetical, and a route that crosses a border
  // is listed under each of its countries.
  await page.getByRole('tab', { name: /^All · / }).click()
  await page.getByRole('tab', { name: 'Country A–Z' }).click()
  const groups = await page.getByTestId('country-group').evaluateAll((sections) =>
    sections.map((s) => ({
      country: s.getAttribute('aria-label')!,
      titles: [...s.querySelectorAll('li h3')].map((h) => h.textContent!.trim()),
    })),
  )
  const countries = groups.map((g) => g.country)
  expect(countries).toEqual([...countries].sort((x, y) => x.localeCompare(y)))
  const seen = new Map<string, number>()
  for (const g of groups) for (const t of g.titles) seen.set(t, (seen.get(t) ?? 0) + 1)
  expect([...seen.values()].some((n) => n >= 2), 'a cross-border route appears under 2+ countries').toBe(true)

  expect(errors).toEqual([])
})

/**
 * Two friends in separate browsers: one downvote (−3) outweighs an upvote,
 * so the place stops being the favourite; liking it again takes the
 * downvote back.
 */
test('unlimited votes; a downvote outweighs upvotes, live for everyone', async ({ browser }) => {
  const a = await (await browser.newContext()).newPage()
  const b = await (await browser.newContext()).newPage()
  const errors = [...captureConsoleErrors(a), ...captureConsoleErrors(b)]

  await a.goto('/new')
  await expect(a).toHaveURL(/\/t\/[a-z0-9]+$/, { timeout: 15_000 })
  await a.getByLabel('Trip name').fill('Downvote trip')
  await a.getByRole('button', { name: /Create trip/ }).click()

  async function join(page: typeof a, name: string) {
    await page.getByLabel('Your name').fill(name)
    await page.getByLabel('Flying from').fill('London, United Kingdom')
    await page.getByLabel('Total you can spend (USD)').fill('5000')
    await page.getByRole('button', { name: 'Join the trip' }).click()
    await expect(page.getByRole('tab', { name: /^One place/ })).toBeVisible({ timeout: 15_000 })
  }
  await join(a, 'Ana')
  await b.goto(a.url())
  await join(b, 'Ben')

  const card = (page: typeof a) => page.locator('li', { has: page.locator('h3', { hasText: /^Lisbon$/ }) })

  // Ana likes Lisbon: it leads for both.
  await card(a).getByRole('button', { name: /^Vote/ }).click()
  await expect(b.getByText('Group favourite so far')).toBeVisible()
  await expect(card(b).getByText('Score +1')).toBeVisible()

  // Votes are unlimited: Ana also likes Porto, and keeps her Lisbon vote.
  const porto = (page: typeof a) => page.locator('li', { has: page.locator('h3', { hasText: /^Porto$/ }) })
  await porto(a).getByRole('button', { name: /^Vote/ }).click()
  await expect(porto(b).getByText('Score +1')).toBeVisible()
  await expect(card(b).getByText('Score +1')).toBeVisible()
  await expect(card(a).getByRole('button', { name: /^Voted/ })).toBeVisible()
  await expect(porto(a).getByRole('button', { name: /^Voted/ })).toBeVisible()
  // A tie shows each place as its own pill, not one joined-up line.
  await expect(b.getByText('2 tied for the lead')).toBeVisible()
  const tied = b.getByRole('list', { name: 'Tied options' }).getByRole('listitem')
  await expect(tied).toHaveCount(2)
  await expect(tied.filter({ hasText: /^Lisbon$/ })).toHaveCount(1)
  await expect(tied.filter({ hasText: /^Porto$/ })).toHaveCount(1)
  await expect(a.getByText('voted on 2')).toBeVisible()
  // Taking back the Porto vote leaves Lisbon alone.
  await porto(a).getByRole('button', { name: /^Voted/ }).click()
  await expect(porto(b).getByText(/^Score/)).toHaveCount(0)

  // Ben really doesn't: +1 − 3 = −2, so there's no favourite any more.
  await card(b).getByRole('button', { name: 'Downvote' }).click()
  await expect(card(a).getByText('Score -2')).toBeVisible()
  await expect(card(a).getByText('No from Ben')).toBeVisible()
  await expect(a.getByText('Group favourite so far')).toHaveCount(0)

  // Ben changes his mind and votes for it: the downvote is taken back.
  await card(b).getByRole('button', { name: /^Vote/ }).click()
  await expect(card(a).getByText('Score +2')).toBeVisible()
  await expect(a.getByText('+2 points')).toBeVisible()
  await expect(card(a).getByText('No from Ben')).toHaveCount(0)

  expect(errors).toEqual([])
})
