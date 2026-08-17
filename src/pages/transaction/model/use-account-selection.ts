import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'ff:accountId'

function readAccountId(): number | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  const acc = Number(raw)
  return isNaN(acc) ? null : acc
}

export function useAccountSelection() {
  const [accountId, setAccountId] = useState<number | null>(null)

  useEffect(() => {
    const stored = readAccountId()
    if (stored !== null) setAccountId(stored)
  }, [])

  const selectAccount = useCallback((id: number) => {
    setAccountId(id)
    localStorage.setItem(STORAGE_KEY, String(id))
  }, [])

  return { accountId, selectAccount }
}
