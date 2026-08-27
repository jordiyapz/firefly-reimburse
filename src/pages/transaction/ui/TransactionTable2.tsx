import type { ColumnDef } from '@tanstack/react-table'
import LocalizedFormat from 'dayjs/plugin/localizedFormat'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import 'dayjs/locale/id'
import {
  ArrowUpDown,
  Check,
  Download,
  ExternalLink,
  Upload,
} from 'lucide-react'
import { DataTable } from '../../../components/data-table/DataTable'
import TodoSwitch from './TodoSwitch'
import type { TransactionRecord } from '../model/interface'
import { formatIdr } from '@/shared/lib/format-currency'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

dayjs.locale('id')
dayjs.extend(LocalizedFormat)

export const columns: Array<ColumnDef<TransactionRecord>> = [
  {
    id: 'date',
    accessorKey: 'date',
    header: ({ column }) => (
      <Button
        variant={column.getIsSorted() ? 'outline' : 'ghost'}
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2 text-xs font-medium"
      >
        Date
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue('date') as Dayjs
      return (
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {date.format('DD MMM YYYY')}
        </span>
      )
    },
    size: 110,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <Button
        variant={column.getIsSorted() ? 'outline' : 'ghost'}
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2 text-xs font-medium"
      >
        Description
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const desc = row.getValue('description') as string
      return (
        <span className="text-sm truncate max-w-60 block">{desc}</span>
      )
    },
  },
  {
    id: 'amount',
    accessorKey: 'amount',
    header: ({ column }) => (
      <Button
        variant={column.getIsSorted() ? 'outline' : 'ghost'}
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2 text-xs font-medium ml-auto"
      >
        Amount
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = row.getValue('amount') as number
      return (
        <div
          className={cn(
            'text-right font-mono text-sm tabular-nums font-medium',
            amount < 0 && 'text-negative',
            amount > 0 && 'text-positive',
          )}
        >
          {formatIdr(amount)}
        </div>
      )
    },
    size: 130,
  },
  {
    id: 'todo',
    accessorKey: 'Todo',
    accessorFn: (row) => row.tags,
    header: ({ column }) => (
      <Button
        variant={column.getIsSorted() ? 'outline' : 'ghost'}
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2 text-xs font-medium ml-auto"
      >
        Todo
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      return <TodoSwitch transaction={row.original} />
    },
    size: 60,
  },
  {
    accessorKey: 'has_attachments',
    header: ({ column }) => (
      <Button
        variant={column.getIsSorted() ? 'outline' : 'ghost'}
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2 text-xs font-medium ml-auto"
      >
        Has File
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const has = row.getValue('has_attachments')
      if (!has) return null
      return <Check className="size-4 text-positive" />
    },
    size: 40,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const id = row.original.transactionId
      return (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-xs" asChild>
            <a
              href={`${import.meta.env.VITE_FIREFLY_URL}/transactions/show/${id}`}
              rel="noopener"
              target="_blank"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon-xs">
            <Upload className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs">
            <Download className="size-3.5" />
          </Button>
        </div>
      )
    },
    size: 90,
  },
]

type Props = { rows: Array<TransactionRecord> }
function TransactionTable2({ rows }: Props) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      initialSorting={[{ id: 'date', desc: true }]}
    />
  )
}
export default TransactionTable2
