import { type Dayjs } from 'dayjs'

export interface TransactionRaw {
  id: number
  transactionId: number
  description: string
  amount: number
  date: string
  has_attachments: boolean
  tags: string[]
  transaction_journal_id: string
  type: TransactionType
}

export interface TransactionRecord extends Omit<TransactionRaw, 'date'> {
  date: Dayjs
  account?: string
  isTodo: boolean
}

export type TransactionID = TransactionRecord['transactionId']

export type AccountType =
  | 'all'
  | 'asset'
  | 'cash'
  | 'expense'
  | 'revenue'
  | 'special'
  | 'hidden'
  | 'liability'
  | 'liabilities'
  | 'Default account'
  | 'Cash account'
  | 'Asset account'
  | 'Expense account'
  | 'Revenue account'
  | 'Initial balance account'
  | 'Beneficiary account'
  | 'Import account'
  | 'Reconciliation account'
  | 'Loan'
  | 'Debt'
  | 'Mortgage'

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
