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

Reimbursement state is encoded in Firefly III tags on each transaction journal. Presence of the `todo` tag means a transaction is **reimbursable**; its absence means it is **non-reimbursable**.

| Tag Pattern                  | Meaning                                                        |
| ---------------------------- | -------------------------------------------------------------- |
| `todo`                       | Reimbursable and pending assignment (lives in the Todo pool)   |
| `reimbursed:{{group_name}}`  | Assigned to reimbursement group `{{group_name}}`               |
| *(no tags)*                  | Non-reimbursable — excluded from outstanding amounts           |

**Status derivation (checked in order):**

1. Any tag starting with `reimbursed:` → **assigned** (a transaction carries **at most one** such tag)
2. Tag `todo` present → **todo** (Todo pool)
3. Otherwise → **non-reimbursable**

**Tag lifecycle:**

1. New transaction arrives → no tags → non-reimbursable
2. User marks it reimbursable → `todo` tag applied
3. User assigns a group → `reimbursed:{{group_name}}` replaces `todo` (the two never coexist)
4. Unrelated tags (e.g., personal categories) are always preserved through every transition

#### Reimbursement Groups

Groups are **not a separate entity** — they are derived from the set of unique `reimbursed:*` tags found across the selected account's transactions. This keeps the data model simple and fully inside Firefly III.

A "group" is simply a name (e.g., `Jan-2025`, `Q1-2025`, `ad-hoc-1`) that the user assigns when marking a batch of transactions as reimbursed. Every account view partitions its transactions into three buckets: **Todo pool**, **groups**, and **non-reimbursable**.

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
| Status      | Badge: Todo / group name / dimmed `—` (non-reimbursable) | Yes    |
| Select      | Checkbox for bulk operations                    | No       |
| Actions     | Toggle reimbursable, open in Firefly III        | No       |

**Behaviors:**

- Sort by any column (default: date descending)
- Filter by status: All / Todo / Assigned / Non-reimbursable
- Checkbox selection enables the bulk actions bar (assign / move / unassign / exclude)
- Filter by date range
- Filter by search term (description)
- Pagination (50 per page, with load-more or page navigation)

### F4: Reimbursable Toggle

**Priority: P0 (MVP)**

- Each row has a toggle switch
- Toggling ON adds the `todo` tag → transaction enters the Todo pool (counted as outstanding)
- Toggling OFF removes the `todo` tag → transaction becomes non-reimbursable
- Disabled while the transaction is assigned to a group (unassign first)
- Visual indicator: Todo pool rows highlighted with a distinct badge

### F5: Assign Reimbursement Period

**Priority: P0 (MVP)**

- One or more transactions selected via row checkboxes (or from any group view)
- User picks a group name — auto-suggested from existing `reimbursed:*` tags — or types a new one
- App applies `reimbursed:{{name}}` and removes `todo`; all unrelated tags are preserved
- A transaction belongs to **exactly one** group: assigning/moving replaces the previous tag

**Group operations:**

| Operation     | Result                                                                    |
| ------------- | ------------------------------------------------------------------------- |
| Assign        | Move into an existing group or create a new one                            |
| Move          | Replace current `reimbursed:X` with `reimbursed:Y`                         |
| Unassign      | Remove `reimbursed:X`, restore `todo` → back to the Todo pool              |
| Mark excluded | Remove `todo` (and any `reimbursed:*`) → transaction becomes non-reimbursable |

**Bulk execution:** Firefly III has no bulk endpoint, so N transactions require N sequential `PUT`s. Updates run **best-effort**: progress indicator (`12/30…`), failures collected and reported at the end (with the failed IDs), and a single cache refetch when done.

### F6: Dashboard

**Priority: P1 (Post-MVP)**

A summary view above or beside the transaction table.

**Widgets:**

| Widget                   | Data                                                        | Source                            |
| ------------------------ | ----------------------------------------------------------- | --------------------------------- |
| Account Balance          | Current balance of selected account                         | Firefly III account data          |
| Total Unreimbursed       | Sum of amounts tagged `todo` (Todo pool only)               | Computed from transactions        |
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

### F9: Reimbursements Management Page

**Priority: P0 (Phase 2)**

A dedicated `/reimbursements` route (fills the existing sidebar nav placeholder), scoped to the selected liability account.

**Layout: master–detail**

- Left column: group list — **Todo pool** (count + pending total), then one entry per derived group (count + total), then a collapsible **Non-reimbursable** section
- Right column: member table of the selected bucket with checkbox multi-select
- Contextual toolbar: *New reimbursement…*, *Move to…*, *Unassign* (→ Todo pool), *Mark non-reimbursable*
- "New reimbursement…" dialog offers free-text name with autocomplete from existing groups
- Both this page and the transaction table expose the same operations via a shared mutation layer

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
    reimbursements.tsx              # Reimbursement groups view
  pages/
    transaction/
      api/
        service.ts                  # Firefly III API calls (fetch-all-pages loop lives here)
        query.ts                    # TanStack Query option factories
      lib/
        transaction.ts              # Pure functions: status derivation, tag transitions, deriveGroups
      model/
        interface.ts                # TypeScript types
        use-transaction-data.ts     # Hook: fetch transactions
        use-toggle-todo.ts          # Hook: reimbursable toggle (single row)
        use-batch-update-tags.ts    # Hook: sequential best-effort bulk updates
        use-account-selection.ts    # Hook: shared selected account state
        export-csv.ts               # CSV export
      ui/
        TransactionPage.tsx         # Main page layout
        TransactionTable2.tsx       # Transaction table (+ bulk selection)
        TodoSwitch.tsx              # Reimbursable toggle component
        AccountList.tsx             # Sidebar account list
        AccountListSidebar.tsx      # Sidebar wrapper
    reimbursements/
      ui/
        ReimbursementsPage.tsx      # Master–detail layout
        GroupList.tsx               # Master column: Todo pool, groups, excluded
        GroupDetail.tsx             # Detail: member table + bulk toolbar
  shared/
    auth/index.ts                   # Token management
    lib/fetch-firefly.ts            # HTTP client
    lib/format-currency.ts          # IDR formatter
  components/
    layout/AppShell.tsx             # SidebarProvider + AccountListSidebar shell shared by both routes
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
| GET    | `AccountsService.listTransactionByAccount({ path: { id } })`    | List ALL transactions for account (loops `?page=N&limit=100` until last page) |
| GET    | `TransactionsService.getTransaction({ path: { id } })`          | Get single transaction (for tag read) |
| PUT    | `TransactionsService.updateTransaction({ path: { id }, body })` | Update tags (journal-scoped via `transaction_journal_id`) |

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
| 9   | No tests despite vitest being configured                               | Medium   | Partial — tag-transition tests landed in Phase 2; rest in M4     |
| 10  | Auth navigates without checking setToken success                       | Low      | Fixed — navigate inside `onSubmit` callback                      |
| 11  | Only the FIRST page of transactions fetched — totals silently wrong    | High     | Fixed — Phase 2 fetch-all-pages loop in `service.ts`             |

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
3. All account transactions are fetched across every page before anything is derived
4. App reads `tags` on each transaction journal to determine status:
   - Any `reimbursed:*` tag → assigned to that group (at most one exists)
   - Else has `todo` → Todo pool (reimbursable, pending assignment)
   - Else → non-reimbursable (excluded from outstanding totals)
5. Toggle reimbursable → `PUT` adds/removes `todo`
6. Assign/move/unassign → `PUT` rewrites the single `reimbursed:*` tag and restores/removes `todo` accordingly
7. Outstanding = sum of `todo`-tagged amounts; per-group totals come from `reimbursed:*` tags

## Milestones

### Milestone 1: Clean Foundation (Week 1)

- [x] Fix all high-severity bugs (#1, #2)
- [x] Remove dead code (demo pages, unused hooks, commented-out code)
- [x] Re-enable IDR formatting
- [x] Re-enable or remove Header component
- [x] Clean up `TableDemo.tsx`
- [x] Add proper error handling to API calls (via SDK `throwOnError`)
- [x] Remove hardcoded dates

### Milestone 2: Core Reimbursement Workflow (Phase 2)

- [x] Fetch-all-pages loop in `getTransactionByAccountId` (fixes #11)
- [x] Status/tag pure functions (`getStatus`, `getPeriodName`, `buildTransitionTags`, `deriveGroups`, `validatePeriodName`) + unit tests
- [x] Shared `updateTransactionTags` mutation + `useBatchUpdateTags` (sequential, best-effort, progress, failure report)
- [x] Extract shared `AppShell` (sidebar + account selection) used by both routes
- [x] `/reimbursements` route: master–detail (Todo pool, groups, collapsible non-reimbursable)
- [x] Group detail table with checkbox multi-select + contextual toolbar (assign / move / unassign / exclude)
- [x] Transactions table: selection column, bulk actions bar, Status column badges
- [x] Auto-suggest group names from existing `reimbursed:*` tags
- [x] Client-side pagination (50/page), search filter, status filter (All / Todo / Assigned / Non-reimbursable)

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

| Tag                     | Purpose                                                  | Example               |
| ----------------------- | -------------------------------------------------------- | --------------------- |
| `todo`                  | Reimbursable, pending assignment (Todo pool)             | `todo`                |
| `reimbursed:{{group}}`  | Assigned to reimbursement group `{{group}}`              | `reimbursed:Jan-2025` |
| *(no tags)*             | Non-reimbursable — excluded from outstanding amounts     | —                     |

Constraints:

- A transaction carries **at most one** `reimbursed:*` tag (enforced by the app's transition helpers)
- `todo` and `reimbursed:*` never coexist on the same transaction
- Unrelated tags (e.g., the user's own categories) are always preserved through every transition

Group names are validated on entry: non-empty, must not contain `:` (would break the prefix parser), must not be the reserved word `todo`. Recommended format: `Mon-YYYY` (e.g., `Jan-2025`) or `Q{n}-YYYY` (e.g., `Q1-2025`), but any valid string works.

### Firefly III API Reference

- API docs: https://api-docs.firefly-iii.org/
- Tags endpoint: `GET /tags/{tag}/transactions` — list transactions with a specific tag
- Transaction update: `PUT /transactions/{id}` — update tags array
