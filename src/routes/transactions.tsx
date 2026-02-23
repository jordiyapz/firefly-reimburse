import { TransactionPage } from '@/pages/transaction'
import { getToken } from '@/shared/auth'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/transactions')({
  component: TransactionPage,
  loader: async (_ctx) => {
    const token = getToken()
    if (!token) throw redirect({ to: '/auth' })
  },
})
