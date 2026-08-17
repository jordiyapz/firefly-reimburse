import { useState } from 'react'
import { Download, ReceiptIcon } from 'lucide-react'
import { useTransactionData } from '../model/use-transaction-data'
import { downloadCsvBlob, exportCsv } from '../model/export-csv'
import { computeOutstandingTotal, countTodoTransactions } from '../lib/transaction'
import { useAccountSelection } from '../model/use-account-selection'
import { useToken } from '@/shared/auth'
import AccountListSidebar from './AccountListSidebar'
import TransactionTable2 from './TransactionTable2'
import { formatIdr } from '@/shared/lib/format-currency'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

function HomePage() {
  const token = useToken()
  const { accountId, selectAccount } = useAccountSelection()
  const [activeNav, setActiveNav] = useState('transactions')
  const transactions = useTransactionData(accountId, token)

  const outstandingTotal = computeOutstandingTotal(transactions)
  const todoCount = countTodoTransactions(transactions)

  return (
    <SidebarProvider className="flex max-w-full">
      <AccountListSidebar
        selectedAccount={accountId}
        onSelectAccount={selectAccount}
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />
      <main className="w-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <SidebarTrigger variant="ghost" size="icon" />
            <h2 className="font-display text-sm font-medium text-muted-foreground capitalize">
              {activeNav}
            </h2>
          </div>
          {activeNav === 'transactions' && (
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
          )}
        </div>
        <div className="container mx-auto max-w-4xl px-4 py-6">
          {activeNav === 'transactions' && (
            <>
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
            </>
          )}
          {activeNav === 'reimbursements' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ReceiptIcon className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Reimbursements coming soon
              </p>
            </div>
          )}
        </div>
      </main>
    </SidebarProvider>
  )
}
export default HomePage
