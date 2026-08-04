import { expect, test } from '@playwright/test'

test('renders every landing-page section without horizontal overflow', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Artifact Mini', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Frequently Asked Questions!' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})

test('starts the splash projection without user interaction', async ({ page }) => {
  await page.goto('/')
  const projection = page.locator('video[data-artifact-projection="true"]')
  await expect(projection).toHaveCount(1, { timeout: 15_000 })
  await expect.poll(
    () => projection.evaluate((video: HTMLVideoElement) => video.paused && video.currentTime > 0.05),
    { timeout: 15_000 },
  ).toBe(true)
  const firstTime = await projection.evaluate((video: HTMLVideoElement) => video.currentTime)
  await expect.poll(
    () => projection.evaluate((video: HTMLVideoElement, previousTime) => Math.abs(video.currentTime - previousTime), firstTime),
    { timeout: 5_000 },
  ).toBeGreaterThan(0.01)
})

test('mobile menu and configurator carousel are usable', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'))
  await page.goto('/')
  await page.getByRole('button', { name: 'Toggle navigation' }).click()
  await expect(page.getByRole('navigation')).toBeVisible()
  await page.getByRole('button', { name: 'Next casing' }).click()
  await expect(page.getByText('Secret Academy', { exact: true }).first()).toBeVisible()
})
