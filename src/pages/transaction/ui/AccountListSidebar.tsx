import { CreditCardIcon, ReceiptIcon } from 'lucide-react'
import AccountList from './AccountList'
import { Sidebar, SidebarContent } from '@/components/ui/sidebar'
import { usePinnedAccounts } from '../model/use-pinned-accounts'
import { cn } from '@/lib/utils'

type NavItem = {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'transactions', label: 'Transactions', icon: CreditCardIcon },
  { id: 'reimbursements', label: 'Reimbursements', icon: ReceiptIcon, disabled: true },
]

type Props = {
  selectedAccount: number | null
  onSelectAccount: (id: number) => void
  activeNav: string
  onNavChange: (nav: string) => void
}

function AccountListSidebar({
  onSelectAccount,
  selectedAccount,
  activeNav,
  onNavChange,
}: Props) {
  const { togglePin, isPinned } = usePinnedAccounts()

  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-3 pt-4 pb-2">
          <h1 className="font-display text-sm font-semibold tracking-tight px-2">
            Firefly Reimburse
          </h1>
        </div>

        <nav className="px-2 pb-1">
          <p className="px-3 pt-1 pb-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Navigation
          </p>
          <ul className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => !item.disabled && onNavChange(item.id)}
                    disabled={item.disabled}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors',
                      activeNav === item.id
                        ? 'bg-accent text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                      item.disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground',
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-border mx-3 my-1" />

        <AccountList
          accountId={selectedAccount}
          onItemClick={onSelectAccount}
          togglePin={togglePin}
          isPinned={isPinned}
        />
      </SidebarContent>
    </Sidebar>
  )
}

export default AccountListSidebar
