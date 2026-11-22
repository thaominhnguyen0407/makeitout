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

  expect(errors).toEqual([])
})
