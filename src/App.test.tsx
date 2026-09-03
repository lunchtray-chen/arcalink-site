import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./components/Artifact3D', () => ({ SplashViewer: () => <div data-testid="splash-model" /> }))
vi.mock('./components/Customize3D', () => ({ CustomizeCanvas: () => <div data-testid="customize-models" /> }))

describe('landing page interactions', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('starts with every FAQ closed and allows multiple answers to remain open', async () => {
    await act(async () => render(<App />))
    const first = screen.getByRole('button', { name: 'What is the Artifact Mini?' })
    const comparison = screen.getByRole('button', { name: /How does the Artifact Mini compare/i })

    expect(first).toHaveAttribute('aria-expanded', 'false')
    expect(comparison).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(first)
    fireEvent.click(comparison)
    expect(first).toHaveAttribute('aria-expanded', 'true')
    expect(comparison).toHaveAttribute('aria-expanded', 'true')
  })

  it('advances the slideshow every three and a half seconds and supports manual dots', async () => {
    vi.useFakeTimers()
    await act(async () => render(<App />))
    const slideOne = screen.getByRole('button', { name: 'Show slide 1' })
    const slideTwo = screen.getByRole('button', { name: 'Show slide 2' })

    expect(slideOne).toHaveAttribute('aria-current', 'true')
    act(() => vi.advanceTimersByTime(3500))
    expect(slideTwo).toHaveAttribute('aria-current', 'true')
    fireEvent.click(slideOne)
    expect(slideOne).toHaveAttribute('aria-current', 'true')
  })

  it('keeps unavailable destinations inert', async () => {
    await act(async () => render(<App />))
    const preorders = screen.getAllByText('Preorder Now!')
    expect(preorders.every((item) => item.getAttribute('aria-disabled') === 'true')).toBe(true)
  })
})
