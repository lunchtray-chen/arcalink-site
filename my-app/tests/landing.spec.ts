import { expect, test } from '@playwright/test'

test('renders every landing-page section without horizontal overflow', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Artifact Mini', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Frequently Asked Questions!' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})

test('mobile menu and configurator carousel are usable', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'))
  await page.goto('/')
  await page.getByRole('button', { name: 'Toggle navigation' }).click()
  await expect(page.getByRole('navigation')).toBeVisible()
  await page.getByRole('button', { name: 'Next casing' }).click()
  await expect(page.getByText('Secret Academy', { exact: true }).first()).toBeVisible()
})
