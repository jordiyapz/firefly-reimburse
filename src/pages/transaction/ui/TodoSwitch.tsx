import { useToggleTodo } from '../model/use-toggle-todo'
import type { TransactionRecord } from '../model/interface'
import { Switch } from '@/components/ui/switch'

type Props = { transaction: TransactionRecord }
function TodoSwitch({ transaction }: Props) {
  const { toggleTodo, isPending } = useToggleTodo()
  return (
    <Switch
      size="sm"
      checked={transaction.status === 'todo'}
      disabled={isPending || transaction.status === 'assigned'}
      title={
        transaction.status === 'assigned'
          ? 'Assigned to a group — unassign first'
          : undefined
      }
      onCheckedChange={(checked) => toggleTodo(transaction, checked)}
    />
  )
}

export default TodoSwitch
