import { createFileRoute, redirect } from '@tanstack/react-router'
import * as z from 'zod'
import { ReimbursementsPage } from '@/pages/reimbursements'
import { getToken } from '@/shared/auth'

const reimbursementsSearchSchema = z.object({
  bucket: z.string().default('pool'),
})

export type ReimbursementsSearch = z.infer<typeof reimbursementsSearchSchema>

export const Route = createFileRoute('/reimbursements')({
  component: ReimbursementsPage,
  validateSearch: reimbursementsSearchSchema,
  loader: async (_ctx) => {
    const token = getToken()
    if (!token) throw redirect({ to: '/auth' })
  },
})
