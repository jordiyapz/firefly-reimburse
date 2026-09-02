import dayjs from 'dayjs'
import LocalizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/id'
import type { TransactionRecord } from '@/pages/transaction/model/interface'
import { formatIdr } from '@/shared/lib/format-currency'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

dayjs.locale('id')
dayjs.extend(LocalizedFormat)

type Props = {
  rows: Array<TransactionRecord>
  selectedIds: Set<number>
  onToggle: (id: number, checked: boolean) => void
  onToggleAll: (checked: boolean) => void
}

function MemberTable({ rows, selectedIds, onToggle, onToggleAll }: Props) {
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id))

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border h-24 flex items-center justify-center text-sm text-muted-foreground">
        No transactions here.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground h-9 w-[110px]">
              Date
            </TableHead>
            <TableHead className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground h-9">
              Description
            </TableHead>
            <TableHead className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground h-9 text-right w-[130px]">
              Amount
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const isSelected = selectedIds.has(row.id)
            return (
              <TableRow
                key={row.id}
                data-state={isSelected && 'selected'}
                className={cn(
                  'border-b border-border/50 transition-colors',
                  index % 2 === 0 ? 'bg-transparent' : 'bg-muted/30',
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onToggle(row.id, checked === true)}
                    aria-label={`Select ${row.description}`}
                  />
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {row.date.format('DD MMM YYYY')}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm truncate max-w-60 block">
                    {row.description}
                  </span>
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-mono text-sm tabular-nums font-medium',
                    row.amount < 0 && 'text-negative',
                    row.amount > 0 && 'text-positive',
                  )}
                >
                  {formatIdr(row.amount)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default MemberTable
