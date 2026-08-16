# TODO

Derived from [PRD.md](./PRD.md). Checkbox items map to milestones.

## Milestone 1: Clean Foundation

- [ ] Fix `use-transaction-todo.ts` — add `await` to `fetchFirefly()` PUT call
- [ ] Fix `fetch-firefly.ts` — check `response.ok`, throw on non-2xx responses
- [ ] Remove hardcoded `start: '2025-11-16'` from `use-transaction-data.ts`
- [ ] Remove hardcoded `limit: 100` or implement pagination
- [ ] Re-enable `formatIdr()` in `TransactionTable.tsx` and `TransactionTable2.tsx`
- [ ] Re-enable or remove `Header` component in `__root.tsx`
- [ ] Delete `src/routes/demo/` (table demo, tanstack-query demo)
- [ ] Delete `TableDemo.tsx` (broken, never fires query)
- [ ] Delete `src/hooks/use-mobile.ts` (unused)
- [ ] Delete `src/pages/transaction/model/account.ts` (unused `sanitizeAccountType`)
- [ ] Fix `auth.tsx` — navigate only after `setToken` succeeds
- [ ] Remove unused `VITE_API_PROXY` env var (proxy configured in vite.config.ts)
- [ ] Remove `demo-table-data.ts` and `Person` type

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
