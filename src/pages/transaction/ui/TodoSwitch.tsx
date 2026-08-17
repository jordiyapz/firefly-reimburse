import { useToggleTodo } from '../model/use-toggle-todo'
import { useToken } from '@/shared/auth'
import type { TransactionRecord } from '../model/interface'
import { Switch } from '@/components/ui/switch'

type Props = { transaction: TransactionRecord }
function TodoSwitch({ transaction }: Props) {
  const token = useToken()
  const { toggleTodo, isPending } = useToggleTodo(token)
  return (
    <Switch
      size="sm"
      checked={transaction.isTodo}
      disabled={isPending}
      onCheckedChange={(checked) => toggleTodo(transaction, checked)}
    />
  )
}

export default TodoSwitch
