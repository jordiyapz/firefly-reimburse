import { Download } from 'lucide-react'
import { useTransactionData } from '../model/use-transaction-data'
import { downloadCsvBlob, exportCsv } from '../model/export-csv'
import {
  computeOutstandingTotal,
  countTodoTransactions,
} from '../lib/transaction'
import TransactionTable2 from './TransactionTable2'
import { AppShell, useSelectedAccount } from '@/components/layout/AppShell'
import { useToken } from '@/shared/auth'
import { formatIdr } from '@/shared/lib/format-currency'
import { Button } from '@/components/ui/button'

function HomePage() {
  const token = useToken()
  const { accountId } = useSelectedAccount()
  const transactions = useTransactionData(accountId, token)
  const outstandingTotal = computeOutstandingTotal(transactions)
  const todoCount = countTodoTransactions(transactions)

  return (
    <AppShell
      title="transactions"
      headerActions={
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadCsvBlob(
              exportCsv(transactions),
              `transactions-account-${accountId}.csv`,
            )
          }
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      }
    >
      <div className="container mx-auto max-w-5xl px-4 py-6">
        {accountId !== null && transactions.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
              Outstanding
            </p>
            <p className="font-mono text-4xl font-light tracking-tight text-foreground">
              {formatIdr(outstandingTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {todoCount} of {transactions.length} transactions marked
            </p>
          </div>
        )}
        <TransactionTable2 rows={transactions} />
      </div>
    </AppShell>
  )
}
export default HomePage
