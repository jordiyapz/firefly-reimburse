import { queryOptions } from '@tanstack/react-query'
import { listAllAttachments } from './service'

export const listAttachmentsOptions = (token: string | null) =>
  queryOptions({
    queryKey: ['attachments', 'all'],
    queryFn: () => listAllAttachments(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })
