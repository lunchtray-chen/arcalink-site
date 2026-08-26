import { useEffect, useState, type RefObject } from 'react'

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])

  return matches
}

export function useDocumentVisible() {
  const [visible, setVisible] = useState(() =>
    typeof document === 'undefined' || document.visibilityState === 'visible',
  )

  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  return visible
}

export function useHasApproachedViewport(
  ref: RefObject<Element | null>,
  rootMargin = '600px 0px',
) {
  const [hasApproached, setHasApproached] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (!('IntersectionObserver' in window)) {
      setHasApproached(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setHasApproached(true)
      observer.disconnect()
    }, { rootMargin })

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, rootMargin])

  return hasApproached
}

export function useVisualTestMode() {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('visual-test')
}
