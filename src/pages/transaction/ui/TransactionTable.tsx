import type {ColumnDef} from '@tanstack/react-table';
import LocalizedFormat from 'dayjs/plugin/localizedFormat'
import dayjs from 'dayjs'
import type {Dayjs} from 'dayjs';
import 'dayjs/locale/id'
import {
  ArrowUpDown,
  Check,
  Download,
  ExternalLink,
  Upload,
} from 'lucide-react'
import { DataTable } from '../../../components/data-table/DataTable'
import type { TransactionRecord } from '../model/interface'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatIdr } from '@/shared/lib/format-currency'

dayjs.locale('id')
dayjs.extend(LocalizedFormat)

export const columns: Array<ColumnDef<TransactionRecord>> = [
  { accessorKey: 'transactionId', header: 'TID' },
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => {
      const id = row.getValue('id')
      return <p className="font-light">{id}</p>
    },
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue('date')
      return <p className="font-mono">{date.format('DD MMM YYYY')}</p>
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  // {
  //   accessorKey: 'account',
  //   header: ({ column }) => (
  //     <Button
  //       variant="ghost"
  //       onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
  //     >
  //       Account
  //       <ArrowUpDown className="ml-2 h-4 w-4" />
  //     </Button>
  //   ),
  // },
  {
    accessorKey: 'amount',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = row.getValue('amount')
      return (
        <div
          className={cn(
            'text-right font-medium',
            amount < 0 && 'text-red-600',
            amount > 0 && 'text-green-700',
          )}
        >
          {formatIdr(amount)}
        </div>
      )
    },
  },
  {
    accessorKey: 'has_attachments',
    header: 'Attachments',
    cell: ({ row }) => {
      const has = row.getValue('has_attachments')
      if (!has) return null
      return <Check />
    },
  },
  {
    header: 'Action',
    cell: ({ row }) => {
      const id = row.getValue('transactionId')
      return (
        <div>
          <Button variant="ghost" size="icon-sm" asChild>
            <a
              href={`${import.meta.env.VITE_FIREFLY_URL}/transactions/show/${id}`}
              rel="noopener"
              target="_blank"
            >
              <ExternalLink />
            </a>
          </Button>
          <Button variant="ghost" size="icon-sm">
            <Upload />
          </Button>
          <Button variant="ghost" size="icon-sm">
            <Download />
          </Button>
        </div>
      )
    },
  },
]

type Props = { rows: Array<TransactionRecord> }

/** @deprecated use `TransactionTabel2` instead */
function TransactionTable({ rows }: Props) {
  return <DataTable columns={columns} data={rows} />
}
export default TransactionTable
