import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { useTransactionData } from '../model/use-transaction-data'
import { downloadCsvBlob, exportCsv } from '../model/export-csv'
import AccountListSidebar from './AccountListSidebar'
import TransactionTable2 from './TransactionTable2'
import { formatIdr } from '@/shared/lib/format-currency'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

function HomePage() {
  const [accountId, setAccountId] = useState<number | null>(null)
  const initialData = useTransactionData(accountId)

  const currentTotal = initialData.reduce((acc, row) => acc + row.amount, 0)

  useEffect(() => {
    if (accountId !== null) return
    const acc = Number(localStorage.getItem('ff:accountId'))
    if (!isNaN(acc)) {
      setAccountId(acc)
    }
  }, [])

  const handleAccountSelect = (id: number) => {
    setAccountId(id)
    localStorage.setItem('ff:accountId', '' + id)
  }

  return (
    <SidebarProvider className="flex max-w-full">
      <AccountListSidebar
        selectedAccount={accountId}
        onSelectAccount={handleAccountSelect}
      />
      <main className="w-full">
        <SidebarTrigger variant={'outline'} size={'icon-lg'} />
        <div className="container mx-auto max-w-4xl">
          <div className="flex gap-4 items-center justify-end py-2">
            <Button
              onClick={() =>
                downloadCsvBlob(
                  exportCsv(initialData),
                  `transactions-account-${accountId}.csv`,
                )
              }
            >
              <Download />
              Export CSV
            </Button>
            <p className="text-right font-bold">
              Total: {formatIdr(currentTotal)}
            </p>
          </div>
          <TransactionTable2 rows={initialData} />
        </div>
      </main>
    </SidebarProvider>
  )
}
export default HomePage
