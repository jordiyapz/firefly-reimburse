import { useQuery } from '@tanstack/react-query'
import { ChevronRightIcon } from 'lucide-react'
import { getToken } from '@/shared/auth'
import { formatIdr } from '@/shared/lib/format-currency'
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/ui/item'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { listAccountsOptions } from '../api/query'

type Props = { accountId: number | null; onItemClick?: (id: number) => void }

function AccountList({ accountId, onItemClick }: Props) {
  const queryRes = useQuery({
    ...listAccountsOptions(getToken(), {
      type: 'liability',
    }),
    refetchOnWindowFocus: false,
  })

  return (
    <ul className="flex flex-col gap-1 mx-4 my-2">
      {queryRes.isLoading && (
        <div className="flex gap-1 items-center">
          <Spinner /> Loading...
        </div>
      )}
      {queryRes.data?.map((r) => (
        <Item
          variant="outline"
          className={cn(accountId === r.id && 'border-blue-500')}
          size="sm"
          key={r.id}
          aria-disabled={!r.active}
          asChild
        >
          <button
            className="hover:bg-gray-400/40"
            onClick={() => onItemClick?.(r.id)}
          >
            <ItemContent className="flex-row justify-between">
              <ItemTitle className="text-left">{r.name}</ItemTitle>
              <ItemDescription
                className={cn(
                  'text-right',
                  r.current_balance < 0 && 'text-red-400',
                  r.current_balance > 0 && 'text-green-400',
                )}
              >
                {formatIdr(r.current_balance)}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <ChevronRightIcon className="size-4" />
            </ItemActions>
          </button>
        </Item>
      ))}
    </ul>
  )
}
export default AccountList
