# Product Requirements Document: Firefly Reimburse

## Overview

**Firefly Reimburse** is a personal expense reimbursement tracking tool that connects to a self-hosted Firefly III instance. It helps the user track purchases made using liability accounts and manage ad-hoc reimbursement cycles — marking which transactions have been reimbursed, grouping them by reimbursement period, and providing a dashboard to monitor outstanding balances.

## Problem Statement

The user purchases items using various liability accounts (credit cards, petty cash, etc.). Periodically, they request reimbursement to refill the account balance. Currently, there is no efficient way to:

1. See which transactions on a liability account have **not yet been reimbursed**
2. Group transactions into **reimbursement periods** (ad-hoc, not calendar-based)
3. Get a **summary view** of outstanding amounts per account and per period

Firefly III tracks the transactions but does not natively support a reimbursement workflow.

## Goals

| #   | Goal                            | Success Criteria                                                                   |
| --- | ------------------------------- | ---------------------------------------------------------------------------------- |
| G1  | Track unreimbursed transactions | User can see all transactions and instantly identify which are unreimbursed        |
| G2  | Manage reimbursement periods    | User can assign transactions to named, ad-hoc reimbursement periods                |
| G3  | Dashboard visibility            | User can see total outstanding, total per period, and account balances at a glance |
| G4  | CSV export                      | User can export filtered transaction data for external use                         |
| G5  | Clean, reliable codebase        | All existing bugs fixed, dead code removed, consistent architecture                |

## Non-Goals

- Multi-user support
- Authentication beyond Firefly III Bearer token
- Replacing the Firefly III web UI
- Mobile-first design (desktop-only, local dev via Tailscale)

## Users

**Single user** — the project owner. Access is local-only via Tailscale.

## Data Model

### Core Entities

All data lives in Firefly III. The app is a **read+write frontend** over the Firefly III API.

#### Liability Accounts

Sourced from Firefly III `GET /accounts?type=liability`. Each account has:

| Field                 | Type   | Source      |
| --------------------- | ------ | ----------- |
| `id`                  | number | Firefly III |
| `name`                | string | Firefly III |
| `current_balance`     | number | Firefly III |
| `currency_code`       | string | Firefly III |
| `liability_type`      | string | Firefly III |
| `liability_direction` | string | Firefly III |

#### Transactions

Sourced from Firefly III `GET /accounts/{id}/transactions`. Each transaction has:

| Field             | Type         | Source      |
| ----------------- | ------------ | ----------- |
| `transactionId`   | number       | Firefly III |
| `description`     | string       | Firefly III |
| `amount`          | number       | Firefly III |
| `date`            | string (ISO) | Firefly III |
| `tags`            | string[]     | Firefly III |
| `has_attachments` | boolean      | Firefly III |
| `type`            | string       | Firefly III |

#### Reimbursement Tracking via Tags

Reimbursement state is encoded in Firefly III tags on each transaction:

| Tag Pattern                  | Meaning                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `todo`                       | Transaction is **not yet reimbursed** — needs action                         |
| `reimbursed:{{period_name}}` | Transaction was reimbursed in the named period (e.g., `reimbursed:Jan-2025`) |

**Tag lifecycle:**

1. New transaction arrives → no reimbursement tags → treated as "todo" (unreimbursed)
2. User selects transactions → applies `todo` tag to explicitly mark for review (optional, for visibility)
3. User creates/assigns a reimbursement period → `reimbursed:{{period_name}}` tag is applied, `todo` tag is removed

#### Reimbursement Periods

Periods are **not a separate entity** — they are derived from the set of unique `reimbursed:*` tags found across all transactions. This keeps the data model simple and fully inside Firefly III.

A "period" is simply a name (e.g., `Jan-2025`, `Q1-2025`, `ad-hoc-1`) that the user assigns when marking a batch of transactions as reimbursed.

## Features

### F1: Authentication

**Priority: P0 (MVP)**

- User enters their Firefly III Bearer token on `/auth`
- Token is stored in `localStorage` under key `ff-reimburse:token`
- All subsequent API calls include `Authorization: Bearer {token}`
- If token is missing or invalid, redirect to `/auth`

### F2: Account Selection

**Priority: P0 (MVP)**

- Sidebar displays all liability accounts with current balance
- Clicking an account loads its transactions into the main table
- Default: first account in the list is selected
- Account balance is displayed prominently

### F3: Transaction Table

**Priority: P0 (MVP)**

The primary view. A sortable, filterable table showing all transactions for the selected account.

**Columns:**

| Column      | Description                                     | Sortable |
| ----------- | ----------------------------------------------- | -------- |
| Date        | Transaction date                                | Yes      |
| Description | Transaction description                         | Yes      |
| Amount      | Transaction amount (IDR formatted)              | Yes      |
| Status      | Reimbursement status (todo / reimbursed:period) | Yes      |
| Actions     | Toggle todo, assign period                      | No       |

**Behaviors:**

- Sort by any column (default: date descending)
- Filter by status: All / Todo / Reimbursed
- Filter by date range
- Filter by search term (description)
- Pagination (50 per page, with load-more or page navigation)

### F4: Todo Toggle

**Priority: P0 (MVP)**

- Each row has a toggle switch
- Toggling ON adds the `todo` tag via `PUT /transactions/{id}`
- Toggling OFF removes the `todo` tag
- Visual indicator: unreimbursed rows are highlighted or have a distinct badge

### F5: Assign Reimbursement Period

**Priority: P0 (MVP)**

- User can select one or more transactions (checkbox or bulk select)
- User picks or types a period name (e.g., `Jan-2025`)
- App applies `reimbursed:{{period_name}}` tag and removes `todo` tag via `PUT /transactions/{id}`
- Period names are auto-suggested from existing `reimbursed:*` tags

**Bulk operations:**

- Select multiple rows → "Mark as Reimbursed" → enter period name → apply to all selected

### F6: Dashboard

**Priority: P1 (Post-MVP)**

A summary view above or beside the transaction table.

**Widgets:**

| Widget                   | Data                                                        | Source                            |
| ------------------------ | ----------------------------------------------------------- | --------------------------------- |
| Account Balance          | Current balance of selected account                         | Firefly III account data          |
| Total Unreimbursed       | Sum of amounts where `tags` does not contain `reimbursed:*` | Computed from transactions        |
| Reimbursements by Period | Table: period name → total amount, transaction count        | Computed from `reimbursed:*` tags |
| Monthly Spending Trend   | Bar chart of spending by month                              | Computed from transaction dates   |

### F7: CSV Export

**Priority: P1 (Post-MVP)**

- Export current filtered view to CSV
- Columns: Date, Description, Amount, Status, Account, Tags
- Uses PapaParse (already in dependencies)

### F8: Date Range Filter

**Priority: P1 (Post-MVP)**

- Filter transactions by start/end date
- Default: show all transactions (remove hardcoded `2025-11-16` start date)
- Quick presets: This Month, Last 3 Months, This Year, All Time

## Architecture

### Tech Stack

| Layer           | Technology                   | Version   |
| --------------- | ---------------------------- | --------- |
| Framework       | React                        | 19        |
| Routing         | TanStack Router (file-based) | 1.x       |
| Data Fetching   | TanStack Query (React Query) | 5.x       |
| Tables          | TanStack Table               | 8.x       |
| Styling         | Tailwind CSS + shadcn/ui     | 4.x       |
| Validation      | Zod                          | 4.x       |
| Build           | Vite + TypeScript            | 7.x / 5.x |
| Package Manager | pnpm                         | -         |

### Project Structure

```
src/
  main.tsx                          # Entry point
  routes/                           # TanStack Router file-based routes
    __root.tsx                      # Root layout
    index.tsx                       # "/" → redirect
    auth.tsx                        # Token input
    transactions.tsx                # Main transaction view
  pages/
    transaction/
      api/
        service.ts                  # Firefly III API calls
        query.ts                    # TanStack Query option factories
      model/
        interface.ts                # TypeScript types
        transaction.ts              # Pure functions (tag logic, mapping)
        use-transaction-data.ts     # Hook: fetch transactions
        use-transaction-todo.ts     # Hook: toggle todo tag
        export-csv.ts               # CSV export
      ui/
        TransactionPage.tsx         # Main page layout
        TransactionTable.tsx        # Transaction table
        TodoSwitch.tsx              # Todo toggle component
        AccountList.tsx             # Sidebar account list
        AccountListSidebar.tsx      # Sidebar wrapper
  shared/
    auth/index.ts                   # Token management
    lib/fetch-firefly.ts            # HTTP client
    lib/format-currency.ts          # IDR formatter
  components/
    ui/                             # shadcn/ui components
```

### API Integration

All API calls use the `@billos/firefly-iii-sdk` package with `createClient`:

```typescript
import { createClient } from '@billos/firefly-iii-sdk/client'
import { AccountsService, TransactionsService } from '@billos/firefly-iii-sdk'

const client = createClient({
  baseUrl: `${VITE_FIREFLY_URL}/api/v1`,
  headers: { Authorization: `Bearer ${token}` },
  throwOnError: true,
  responseStyle: 'data',
})
```

**Endpoints used:**

| Method | SDK Service                                                     | Purpose                               |
| ------ | --------------------------------------------------------------- | ------------------------------------- |
| GET    | `AccountsService.listAccount({ query: { type: 'liability' } })` | List liability accounts               |
| GET    | `AccountsService.listTransactionByAccount({ path: { id } })`    | List transactions for account         |
| GET    | `TransactionsService.getTransaction({ path: { id } })`          | Get single transaction (for tag read) |
| PUT    | `TransactionsService.updateTransaction({ path: { id }, body })` | Update transaction tags               |

### State Management

- **Server state:** TanStack Query (cache, invalidation, refetch)
- **Auth state:** `localStorage` token
- **UI state:** React state (selected account, filters, sort)
- **No global client state store needed**

## Known Issues to Fix

| #   | Issue                                                                  | Severity | Status                                                           |
| --- | ---------------------------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| 1   | `use-transaction-todo.ts` PUT mutation does not `await` the fetch call | High     | Fixed — migrated to SDK with `await`                             |
| 2   | `fetch-firefly.ts` has no error handling for non-OK responses          | High     | Fixed — migrated to SDK `createClient` with `throwOnError: true` |
| 3   | Hardcoded `start: '2025-11-16'` in `use-transaction-data.ts`           | Medium   | Fixed — removed hardcoded date                                   |
| 4   | Hardcoded `limit: 100` with no pagination                              | Medium   | Fixed — removed hardcoded limit (pagination in M2)               |
| 5   | `formatIdr()` is commented out in both table components                | Low      | Fixed — re-enabled                                               |
| 6   | `Header` component is disabled in `__root.tsx`                         | Low      | Fixed — removed (referenced deleted demo routes)                 |
| 7   | `TableDemo.tsx` passes `null` accountId, query never fires             | Low      | Fixed — deleted                                                  |
| 8   | `use-mobile.ts` hook is unused                                         | Low      | Kept — used by shadcn sidebar component                          |
| 9   | No tests despite vitest being configured                               | Medium   | Pending — planned for M4                                         |
| 10  | Auth navigates without checking setToken success                       | Low      | Fixed — navigate inside `onSubmit` callback                      |

## Data Flow

```
┌─────────────┐                    ┌─────────────┐
│  Firefly III │◀───────────────────│  React App  │
│  (API v1)    │   SDK (direct)     │             │
└─────────────┘                    └─────────────┘
                                         │
                                    ┌────┴────┐
                                    │  Tags   │
                                    │  todo   │
                                    │  reimbursed:* │
                                    └─────────┘
```

1. App fetches liability accounts → displays in sidebar
2. User selects account → app fetches transactions
3. App reads `tags` array on each transaction to determine status:
   - Has `todo` → unreimbursed
   - Has `reimbursed:*` → reimbursed in that period
   - Neither → also unreimbursed (implicit todo)
4. User toggles todo → `PUT` updates tags
5. User assigns period → `PUT` adds `reimbursed:{{name}}`, removes `todo`
6. Dashboard computes totals from tag states

## Milestones

### Milestone 1: Clean Foundation (Week 1)

- [x] Fix all high-severity bugs (#1, #2)
- [x] Remove dead code (demo pages, unused hooks, commented-out code)
- [x] Re-enable IDR formatting
- [x] Re-enable or remove Header component
- [x] Clean up `TableDemo.tsx`
- [x] Add proper error handling to API calls (via SDK `throwOnError`)
- [x] Remove hardcoded dates

### Milestone 2: Core Reimbursement Workflow (Week 2)

- [ ] Implement period assignment UI (bulk select + period name input)
- [ ] Auto-suggest existing period names from `reimbursed:*` tags
- [ ] Implement bulk tag update (batch PUT for multiple transactions)
- [ ] Add pagination to transaction table
- [ ] Add status filter (All / Todo / Reimbursed)

### Milestone 3: Dashboard (Week 3)

- [ ] Account balance widget
- [ ] Total unreimbursed amount
- [ ] Reimbursements by period table
- [ ] Monthly spending bar chart

### Milestone 4: Polish (Week 4)

- [ ] CSV export with current filters
- [ ] Date range filter with presets
- [ ] Unit tests for tag logic and data transformation
- [ ] Loading states and error boundaries
- [ ] Keyboard shortcuts for power-user workflow

## Appendix

### Tag Naming Convention

| Tag                     | Purpose                                           | Example               |
| ----------------------- | ------------------------------------------------- | --------------------- |
| `todo`                  | Marks transaction as unreimbursed, needs action   | `todo`                |
| `reimbursed:{{period}}` | Marks transaction as reimbursed in a named period | `reimbursed:Jan-2025` |

Period names are freeform strings. Recommended format: `Mon-YYYY` (e.g., `Jan-2025`) or `Q{n}-YYYY` (e.g., `Q1-2025`), but any string is valid.

### Firefly III API Reference

- API docs: https://api-docs.firefly-iii.org/
- Tags endpoint: `GET /tags/{tag}/transactions` — list transactions with a specific tag
- Transaction update: `PUT /transactions/{id}` — update tags array
