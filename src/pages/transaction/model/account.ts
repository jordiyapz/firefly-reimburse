import type { AccountType } from './interface'

export function sanitizeAccountType(type?: string): AccountType | undefined {
  switch (type) {
    case 'all':
    case 'asset':
    case 'cash':
    case 'expense':
    case 'revenue':
    case 'special':
    case 'hidden':
    case 'liability':
    case 'liabilities':
    case 'Default account':
    case 'Cash account':
    case 'Asset account':
    case 'Expense account':
    case 'Revenue account':
    case 'Initial balance account':
    case 'Beneficiary account':
    case 'Import account':
    case 'Reconciliation account':
    case 'Loan':
    case 'Debt':
    case 'Mortgage':
      return type
    default:
      return undefined
  }
}
