// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { selectAccountId, useAccountSelection } from './use-account-selection'

const actEnv = globalThis as Record<string, unknown>
actEnv.IS_REACT_ACT_ENVIRONMENT = true

describe('useAccountSelection', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('hydrates from localStorage synchronously on first render', () => {
    localStorage.setItem('ff:accountId', '42')
    const { result } = renderHook(() => useAccountSelection())
    expect(result.current.accountId).toBe(42)
  })

  it('starts null when nothing is stored', () => {
    const { result } = renderHook(() => useAccountSelection())
    expect(result.current.accountId).toBeNull()
  })

  it('selectAccount updates state and persists to localStorage', () => {
    const { result } = renderHook(() => useAccountSelection())
    act(() => result.current.selectAccount(7))
    expect(result.current.accountId).toBe(7)
    expect(localStorage.getItem('ff:accountId')).toBe('7')
  })

  it('keeps independent hook instances in sync (regression)', () => {
    const sidebar = renderHook(() => useAccountSelection())
    const page = renderHook(() => useAccountSelection())

    act(() => sidebar.result.current.selectAccount(99))

    expect(page.result.current.accountId).toBe(99)
    expect(sidebar.result.current.accountId).toBe(99)
  })

  it('reflects external localStorage writes on next read', () => {
    const { result } = renderHook(() => useAccountSelection())
    expect(result.current.accountId).toBeNull()
    act(() => selectAccountId(5))
    expect(result.current.accountId).toBe(5)
  })
})
