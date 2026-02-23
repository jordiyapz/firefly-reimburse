import { createFileRoute, redirect } from '@tanstack/react-router'

import { getToken } from '@/shared/auth'
import { TransactionPage } from '@/pages/transaction'

export const Route = createFileRoute('/')({
  component: TransactionPage,
  loader: async (_ctx) => {
    const token = getToken()
    if (!token) throw redirect({ to: '/auth' })
    return redirect({ to: '/transactions' })
  },
})
