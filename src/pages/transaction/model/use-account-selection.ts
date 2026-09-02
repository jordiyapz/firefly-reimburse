import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'ff:accountId'

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emitChange() {
  listeners.forEach((listener) => listener())
}

function readAccountId(): number | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  const acc = Number(raw)
  return isNaN(acc) ? null : acc
}

export function selectAccountId(id: number) {
  localStorage.setItem(STORAGE_KEY, String(id))
  emitChange()
}

export function useAccountSelection() {
  const accountId = useSyncExternalStore(subscribe, readAccountId)

  const selectAccount = useCallback((id: number) => {
    selectAccountId(id)
  }, [])

  return { accountId, selectAccount }
}
