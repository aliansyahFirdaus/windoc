import { useState, useEffect } from 'react'

const CACHE_KEY = 'windoc_npm_version'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CacheEntry {
  version: string
  timestamp: number
}

export function useNpmVersion(packageName: string, fallback = '0.0.0'): string {
  const [version, setVersion] = useState(() => {
    if (typeof window === 'undefined') return fallback
    try {
      const cached: CacheEntry = JSON.parse(localStorage.getItem(`${CACHE_KEY}_${packageName}`) || '')
      if (Date.now() - cached.timestamp < CACHE_TTL) return cached.version
    } catch {}
    return fallback
  })

  useEffect(() => {
    fetch(`https://registry.npmjs.org/${packageName}/latest`)
      .then(res => res.json())
      .then(data => {
        if (data.version) {
          setVersion(data.version)
          localStorage.setItem(
            `${CACHE_KEY}_${packageName}`,
            JSON.stringify({ version: data.version, timestamp: Date.now() })
          )
        }
      })
      .catch(() => {})
  }, [packageName])

  return version
}
