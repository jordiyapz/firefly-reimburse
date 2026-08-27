import { createFileRoute, redirect } from '@tanstack/react-router'
import { ReimbursementsPage } from '@/pages/reimbursements'
import { getToken } from '@/shared/auth'

export const Route = createFileRoute('/reimbursements')({
  component: ReimbursementsPage,
  loader: async (_ctx) => {
    const token = getToken()
    if (!token) throw redirect({ to: '/auth' })
  },
})
