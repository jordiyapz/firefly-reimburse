import { useCallback, useState } from 'react'

const STORAGE_KEY = 'ff-reimburse:pinned-accounts'

function readPinned(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writePinned(ids: number[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export function usePinnedAccounts() {
  const [pinned, setPinned] = useState<number[]>(readPinned)

  const togglePin = useCallback((id: number) => {
    setPinned((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
      writePinned(next)
      return next
    })
  }, [])

  const isPinned = useCallback((id: number) => pinned.includes(id), [pinned])

  return { pinned, togglePin, isPinned }
}
