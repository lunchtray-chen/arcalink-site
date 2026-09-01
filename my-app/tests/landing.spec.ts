import { expect, test } from '@playwright/test'

test('renders every landing-page section without horizontal overflow', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Artifact Mini', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Frequently Asked Questions!' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})

test('starts the splash projection without user interaction', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith('mobile'))
  await page.goto('/')
  const projection = page.locator('video[data-artifact-projection="true"]')
  await expect(projection).toHaveCount(1, { timeout: 15_000 })
  await expect.poll(
    () => projection.evaluate((video: HTMLVideoElement) => !video.paused && video.currentTime > 0.05),
    { timeout: 15_000 },
  ).toBe(true)
})

test('keeps both videos playing after the splash leaves and re-enters the viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith('mobile'))
  await page.goto('/')

  const projection = page.locator('video[data-artifact-projection="true"]')
  const background = page.locator('.animation-section .background-video')

  await expect.poll(
    () => projection.evaluate((video: HTMLVideoElement) => !video.paused && video.currentTime > 0.05),
    { timeout: 15_000 },
  ).toBe(true)

  await page.locator('.animation-section').evaluate((element) => {
    document.documentElement.style.scrollBehavior = 'auto'
    element.scrollIntoView()
  })
  await expect.poll(
    () => background.evaluate((video: HTMLVideoElement) => !video.paused && video.currentTime > 0.05),
    { timeout: 15_000 },
  ).toBe(true)

  await page.locator('.splash-section').evaluate((element) => element.scrollIntoView())
  await expect.poll(
    () => projection.evaluate((video: HTMLVideoElement) => !video.paused),
    { timeout: 5_000 },
  ).toBe(true)
})

test('renders all supplied app slides and exposes the active image', async ({ page }, testInfo) => {
  await page.goto('/')
  const slides = page.locator('.slide-frame > .slide-image')
  await expect(slides).toHaveCount(4)
  await expect(slides.nth(0)).toHaveAttribute('src', /How it works - 1|How%20it%20works%20-%201/)
  await expect(slides.nth(0)).toHaveCSS('opacity', '1')
  const nextButton = page.getByRole('button', { name: 'Next image' })
  await expect(nextButton).toHaveCSS('opacity', '0.6')
  if (testInfo.project.name.startsWith('desktop')) {
    await nextButton.hover()
    await expect(nextButton).toHaveCSS('opacity', '1')
  }
  await page.getByRole('button', { name: 'Show slide 2' }).click()
  await expect(slides.nth(1)).toHaveCSS('opacity', '1')
})

test('mobile menu and configurator carousel are usable', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'))
  await page.goto('/')
  await expect(page.locator('.splash-viewer')).toHaveCount(0)
  await expect(page.locator('.specs-drawing')).toBeHidden()
  await expect(page.getByText('Drag and drop props to rearrange.')).toHaveCount(0)
  const previousButton = page.getByRole('button', { name: 'Previous casing' })
  const previousImage = previousButton.locator('img')
  await expect(previousImage).toHaveCSS('opacity', '1')
  await expect.poll(() => previousImage.evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight])).toEqual([42, 41])
  const stageBox = await page.locator('.customize-stage').boundingBox()
  const previousBox = await previousButton.boundingBox()
  expect(Math.abs((stageBox!.y + stageBox!.height / 2) - (previousBox!.y + previousBox!.height / 2))).toBeLessThan(2)
  await page.getByRole('button', { name: 'Toggle navigation' }).click()
  await expect(page.getByRole('navigation')).toBeVisible()
  await page.getByRole('button', { name: 'Next casing' }).click()
  await expect(page.getByText('Secret Academy', { exact: true }).first()).toBeVisible()
})
