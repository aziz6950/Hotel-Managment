import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Page change hole upor theke shuru hobe (#about, #contact thakle skip)
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
