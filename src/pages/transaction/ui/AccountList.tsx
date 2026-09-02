import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { StarIcon } from 'lucide-react'
import { AccountTypeFilter } from '@billos/firefly-iii-sdk'
import { listAccountsOptions } from '../api/query'
import type { usePinnedAccounts } from '../model/use-pinned-accounts'
import { useToken } from '@/shared/auth'
import { formatIdr } from '@/shared/lib/format-currency'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

type AccountRecord = {
  id: number
  name: string
  current_balance: number
  active: boolean
}

type Props = {
  accountId: number | null
  onItemClick?: (id: number) => void
  togglePin: ReturnType<typeof usePinnedAccounts>['togglePin']
  isPinned: ReturnType<typeof usePinnedAccounts>['isPinned']
}

function AccountItem({
  account,
  isSelected,
  isPinned,
  onClick,
  onTogglePin,
}: {
  account: AccountRecord
  isSelected: boolean
  isPinned: boolean
  onClick: () => void
  onTogglePin: (e: React.MouseEvent) => void
}) {
  return (
    <Item
      variant="outline"
      className={cn(
        'border-transparent transition-colors group',
        isSelected && 'border-primary bg-accent',
      )}
      size="sm"
      aria-disabled={!account.active}
      asChild
    >
      <button className="hover:bg-accent/60 text-left" onClick={onClick}>
        <ItemContent>
          <ItemTitle className="text-sm font-medium truncate">
            {account.name}
          </ItemTitle>
          <ItemDescription
            className={cn(
              'font-mono text-xs tabular-nums',
              account.current_balance < 0 && 'text-negative',
              account.current_balance > 0 && 'text-positive',
            )}
          >
            {formatIdr(account.current_balance)}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <div
            onClick={onTogglePin}
            className="p-0.5 rounded hover:bg-muted/80 transition-colors"
            aria-label={isPinned ? 'Unpin account' : 'Pin account'}
          >
            <StarIcon
              className={cn(
                'size-3.5 transition-colors',
                isPinned
                  ? 'fill-primary text-primary'
                  : 'fill-none text-muted-foreground/40 group-hover:text-muted-foreground',
              )}
            />
          </div>
        </ItemActions>
      </button>
    </Item>
  )
}

function AccountList({ accountId, onItemClick, togglePin, isPinned }: Props) {
  const token = useToken()
  const queryRes = useQuery({
    ...listAccountsOptions(token, { type: AccountTypeFilter.LIABILITY }),
    refetchOnWindowFocus: false,
  })

  const accounts = queryRes.data ?? []

  useEffect(() => {
    if (!onItemClick || accounts.length === 0) return
    if (accountId !== null && accounts.some((a) => a.id === accountId)) return
    const favorites = accounts.filter((a) => isPinned(a.id))
    const others = accounts
      .filter((a) => !isPinned(a.id) && a.active)
      .sort((a, b) => a.name.localeCompare(b.name))
    const fallbackId = favorites.at(0)?.id ?? others.at(0)?.id
    if (fallbackId !== undefined && fallbackId !== accountId) onItemClick(fallbackId)
  }, [accounts, accountId, isPinned, onItemClick])

  if (queryRes.isLoading) {
    return (
      <div className="flex gap-1 items-center px-5 py-3 text-sm text-muted-foreground">
        <Spinner /> Loading accounts...
      </div>
    )
  }

  const favoriteAccounts = accounts.filter((a) => isPinned(a.id))
  const otherAccounts = accounts.filter((a) => !isPinned(a.id) && a.active).sort((a,b) => a.name.localeCompare(b.name))

  return (
    <div className="flex flex-col">
      {favoriteAccounts.length > 0 && (
        <div className="mt-1">
          <p className="px-5 pt-1 pb-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Favorites
          </p>
          <ul className="flex flex-col gap-0.5 px-2">
            {favoriteAccounts.map((r) => (
              <AccountItem
                key={r.id}
                account={r}
                isSelected={accountId === r.id}
                isPinned={isPinned(r.id)}
                onClick={() => onItemClick?.(r.id)}
                onTogglePin={(e) => {
                  e.stopPropagation()
                  togglePin(r.id)
                }}
              />
            ))}
          </ul>
        </div>
      )}

      <div className="mt-1">
        <p className="px-5 pt-3 pb-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          All accounts
        </p>
        <ul className="flex flex-col gap-0.5 px-2 pb-2">
          {otherAccounts.map((r) => (
            <AccountItem
              key={r.id}
              account={r}
              isSelected={accountId === r.id}
              isPinned={isPinned(r.id)}
              onClick={() => onItemClick?.(r.id)}
              onTogglePin={(e) => {
                e.stopPropagation()
                togglePin(r.id)
              }}
            />
          ))}
          {otherAccounts.length === 0 && favoriteAccounts.length > 0 && (
            <p className="px-2 py-2 text-xs text-muted-foreground">
              All accounts are pinned
            </p>
          )}
          {accounts.length === 0 && (
            <p className="px-2 py-2 text-xs text-muted-foreground">
              No liability accounts found
            </p>
          )}
        </ul>
      </div>
    </div>
  )
}

export default AccountList
