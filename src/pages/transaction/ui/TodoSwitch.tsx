import { Switch } from '@/components/ui/switch'
import type { TransactionID } from '../model/interface'
import { useTransactionTodo } from '../model/use-transaction-todo'

type Props = { tid: TransactionID }
function TodoSwitch({ tid }: Props) {
  const { isTodo, isLoading, setTodo, transaction } = useTransactionTodo(tid)
  if (!transaction) return null
  if (isLoading) return <p>Loading</p>
  return (
    <Switch
      checked={isTodo}
      onCheckedChange={(checked) => setTodo(transaction, checked)}
    />
  )
}

export default TodoSwitch
