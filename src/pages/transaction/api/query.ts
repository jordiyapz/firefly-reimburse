import { queryOptions } from '@tanstack/react-query'
import {
  getTransactionByAccountId,
  getTransactionById,
  listAccounts,
} from './service'
import type { GetTransactionByAccountIdOptions, ListAccountsOptions } from './service'

export const getTransactionByAccountIdOptions = (args: {
  id: number | null
  token: string | null
  options: GetTransactionByAccountIdOptions
}) =>
  queryOptions({
    queryKey: ['transactions', { account: args.id, options: args.options }],
    queryFn: () =>
      getTransactionByAccountId(args.id!, args.token!, args.options),
    enabled: !!args.id && !!args.token,
  })

export const getTransactionByIdOptions = (args: {
  id: number
  token: string | null
}) =>
  queryOptions({
    queryKey: ['transaction', args.id],
    queryFn: () => getTransactionById(args.id, args.token!),
    enabled: !!args.token,
  })

export const listAccountsOptions = (
  token: string | null,
  options?: ListAccountsOptions,
) =>
  queryOptions({
    queryKey: ['accounts', 'list', options],
    queryFn: () => listAccounts(token, options),
    enabled: !!token,
  })
