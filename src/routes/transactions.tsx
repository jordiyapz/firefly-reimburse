import { createFileRoute, redirect } from '@tanstack/react-router'
import * as z from 'zod'
import dayjs from 'dayjs'
import { TransactionPage } from '@/pages/transaction'
import { getToken } from '@/shared/auth'

const transactionSearchSchema = z.object({
  q: z.string().default(''),
  status: z.enum(['all', 'todo', 'assigned', 'non-reimbursable']).default('all'),
  from: z.string().default(dayjs().subtract(3, 'month').format('YYYY-MM-DD')),
  to: z.string().default(dayjs().format('YYYY-MM-DD')),
})

export type TransactionSearch = z.infer<typeof transactionSearchSchema>

export const Route = createFileRoute('/transactions')({
  component: TransactionPage,
  validateSearch: transactionSearchSchema,
  loader: async (_ctx) => {
    const token = getToken()
    if (!token) throw redirect({ to: '/auth' })
  },
})
