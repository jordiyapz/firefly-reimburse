import { useTransactionTodo } from '../model/use-transaction-todo'
import type { TransactionID } from '../model/interface'
import { Switch } from '@/components/ui/switch'

type Props = { tid: TransactionID }
function TodoSwitch({ tid }: Props) {
  const { isTodo, isLoading, setTodo, transaction } = useTransactionTodo(tid)
  if (!transaction) return null
  if (isLoading)
    return <span className="text-xs text-muted-foreground">...</span>
  return (
    <Switch
      size="sm"
      checked={isTodo}
      onCheckedChange={(checked) => setTodo(transaction, checked)}
    />
  )
}

export default TodoSwitch
