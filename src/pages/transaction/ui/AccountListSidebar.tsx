import { Sidebar, SidebarContent } from '@/components/ui/sidebar'
import AccountList from './AccountList'

type Props = {
  selectedAccount: number | null
  onSelectAccount(id: number): void
}
function AccountListSidebar({ onSelectAccount, selectedAccount }: Props) {
  return (
    <Sidebar>
      <SidebarContent>
        <AccountList
          accountId={selectedAccount}
          onItemClick={onSelectAccount}
        />
      </SidebarContent>
    </Sidebar>
  )
}
export default AccountListSidebar
