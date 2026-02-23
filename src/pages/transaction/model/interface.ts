import { type Dayjs } from 'dayjs'

export interface TransactionRaw {
  id: number
  description: string
  amount: number
  date: string
  has_attachments: boolean
}

export interface TransactionRecord extends Omit<TransactionRaw, 'date'> {
  date: Dayjs
  account?: string
}

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
