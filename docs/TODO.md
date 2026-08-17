# TODO

Derived from [PRD.md](./PRD.md). Checkbox items map to milestones.

## Milestone 1: Clean Foundation

- [x] Fix `use-transaction-todo.ts` — add `await` to `fetchFirefly()` PUT call
- [x] Fix `fetch-firefly.ts` — refactor to use `firefly-iii-sdk` `createClient` (replaces manual fetch + adds error handling via `throwOnError`)
- [x] Refactor `service.ts` to use SDK `AccountsService` / `TransactionsService`
- [x] Remove hardcoded `start: '2025-11-16'` from `use-transaction-data.ts`
- [x] Remove hardcoded `limit: 100` from `use-transaction-data.ts`
- [x] Re-enable `formatIdr()` in `TransactionTable.tsx` and `TransactionTable2.tsx`
- [x] Remove `Header` component (was disabled, referenced deleted demo routes)
- [x] Delete `src/routes/demo/` (table demo, tanstack-query demo)
- [x] Delete `TableDemo.tsx` (broken, never fires query)
- [x] Delete `src/pages/transaction/model/account.ts` (unused `sanitizeAccountType`)
- [x] Fix `auth.tsx` — navigate only after `setToken` succeeds
- [x] Remove unused `VITE_API_PROXY` env var from `.env.example`
- [x] Remove `demo-table-data.ts` and `Person` type
- [x] Delete `reportWebVitals.ts` (CRA leftover) and remove import from `main.tsx`
- [x] Delete static data files (`liability-accounts.json`, `result.json`)
- [x] Remove `@faker-js/faker` dependency
- [x] Remove Vite dev proxy (SDK talks directly to Firefly III URL)
- [x] Remove unused `TransactionTable` import from `TransactionPage.tsx`
- [x] Remove unused `Switch` import from `TransactionTable2.tsx`

> **Note:** `src/hooks/use-mobile.ts` was kept — it's used by `src/components/ui/sidebar.tsx` (shadcn/ui component).

## Milestone 2: Core Reimbursement Workflow

- [ ] Add status filter to transaction table (All / Todo / Reimbursed)
- [ ] Add search filter (description text match)
- [ ] Implement pagination (50 per page)
- [ ] Build period assignment UI — select rows → enter/pick period name
- [ ] Auto-suggest existing period names from `reimbursed:*` tags
- [ ] Implement bulk tag update (batch PUT for multiple transactions)
- [ ] Add "Assign Period" action to bulk actions bar
- [ ] Ensure `todo` tag is removed when `reimbursed:*` is applied
- [ ] Add date range filter with presets (This Month, Last 3 Months, This Year, All Time)

## Milestone 3: Dashboard

- [ ] Account balance widget (current balance of selected account)
- [ ] Total unreimbursed amount (sum of amounts without `reimbursed:*` tag)
- [ ] Reimbursements by period table (period name → total, count)
- [ ] Monthly spending bar chart

## Milestone 4: Polish

- [ ] CSV export respects current filters (status, date range, search)
- [ ] Unit tests for tag logic (`isTodoTransaction`, `appendTodoField`, `updateTodoTagsImmutable`)
- [ ] Unit tests for `mapRawTransactionToRecord`
- [ ] Loading states (skeletons) for transaction table and dashboard
- [ ] Error boundary for API failures
- [ ] Keyboard shortcuts (e.g., `R` to mark selected as reimbursed)
