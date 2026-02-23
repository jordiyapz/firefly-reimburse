import { useTransactionData } from '../model/use-transaction-data'
import TransactionTable from './TransactionTable'
import { useState } from 'react'
import { formatIdr } from '@/shared/lib/format-currency'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import AccountListSidebar from './AccountListSidebar'

function HomePage() {
  const [accountId, setAccountId] = useState<number | null>(null)
  const initialData = useTransactionData(accountId)

  const currentTotal = initialData.reduce((acc, row) => acc + row.amount, 0)

  return (
    <SidebarProvider className="flex max-w-full">
      <AccountListSidebar
        selectedAccount={accountId}
        onSelectAccount={setAccountId}
      />
      <main className="w-full">
        <SidebarTrigger variant={'outline'} size={'icon-lg'} />
        <div className="container mx-auto max-w-4xl">
          <p className="text-right">Total: {formatIdr(currentTotal)}</p>
          <TransactionTable rows={initialData} />
        </div>
      </main>
    </SidebarProvider>
  )
}
export default HomePage
