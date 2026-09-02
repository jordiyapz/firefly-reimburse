import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import AccountListSidebar from '@/pages/transaction/ui/AccountListSidebar'
import { useAccountSelection } from '@/pages/transaction/model/use-account-selection'

export function useSelectedAccount() {
  return useAccountSelection()
}

type Props = {
  title: string
  headerActions?: React.ReactNode
  children: React.ReactNode
}

export function AppShell({ title, headerActions, children }: Props) {
  const account = useAccountSelection()

  return (
    <SidebarProvider className="flex max-w-full">
      <AccountListSidebar
        selectedAccount={account.accountId}
        onSelectAccount={account.selectAccount}
      />
      <main className="w-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <SidebarTrigger variant="ghost" size="icon" />
            <h2 className="font-display text-sm font-medium text-muted-foreground capitalize">
              {title}
            </h2>
          </div>
          {headerActions}
        </div>
        {children}
      </main>
    </SidebarProvider>
  )
}
