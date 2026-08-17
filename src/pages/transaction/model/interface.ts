import type { Dayjs } from 'dayjs'

export interface TransactionRaw {
  id: number
  transactionId: number
  description: string
  amount: number
  date: string
  has_attachments: boolean
  tags: Array<string>
  transaction_journal_id: string
  type: TransactionType
}

export interface TransactionRecord {
  transactionId: number
  id: number
  description: string
  amount: number
  date: Dayjs
  has_attachments: boolean
  tags: Array<string>
  transaction_journal_id: string
  type: TransactionType
  account?: string
  isTodo: boolean
}

export type TransactionID = TransactionRecord['transactionId']

export type TransactionType =
  | 'all'
  | 'withdrawal'
  | 'withdrawals'
  | 'expense'
  | 'deposit'
  | 'deposits'
  | 'income'
  | 'transfer'
  | 'transfers'
  | 'opening_balance'
  | 'reconciliation'
  | 'special'
  | 'specials'
  | 'default'
