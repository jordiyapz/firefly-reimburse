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

## Milestone 2: Reimbursement Management (Phase 2)

> Semantics (locked): `todo` = reimbursable & pending · exactly one `reimbursed:X` = in group X · **no tags = non-reimbursable**. The M1 implicit-todo rule is gone; outstanding totals count `todo` rows only.

**Data foundation**

- [x] Fetch-all-pages loop in `getTransactionByAccountId` (`limit=100`, iterate until last page) — fixes silent first-page-only truncation
- [x] Pure functions in `lib/transaction.ts`: `getStatus`, `getPeriodName`, `buildTransitionTags` (assign/move/unassign/exclude), `deriveGroups`, `validatePeriodName`
- [x] Unit tests for the full tag-transition matrix (brought forward from M4)

**Mutations**

- [x] Single `updateTransactionTags` SDK mutation (journal-scoped PUT, preserves unrelated tags); refactor `use-toggle-todo.ts` onto it
- [x] `useBatchUpdateTags` hook — sequential PUTs, progress (`i/n`), collects `{succeeded, failed}`, reports failed IDs, one cache invalidation at the end

**UI**

- [x] Extract `AppShell` (SidebarProvider + AccountListSidebar) shared by `/transactions` and `/reimbursements`; sidebar nav switched from in-page state to router links
- [x] `/reimbursements` route replacing the nav placeholder — scoped to selected account
- [x] Master list: Todo pool (count + total) → derived groups (count + total) → collapsible Non-reimbursable section
- [x] Detail pane: member table with checkbox multi-select + toolbar — New reimbursement… / Move to… / Unassign (→ Todo pool) / Mark non-reimbursable (+ reverse toggle in excluded bucket)
- [x] Group-name dialog auto-suggests existing `reimbursed:*` tags; validates via `validatePeriodName`
- [x] Transactions table: checkbox selection column + bulk actions bar (same four ops)
- [x] Transactions table: Status column badge (Todo / group name / dimmed `—`)
- [x] Status filter: All / Todo / Assigned / Non-reimbursable
- [x] Description search filter + client-side pagination (50 per page)
- [x] Shift+click range selection on row checkboxes (`lib/selection.ts` `buildSelectionPatch` + tests) — single state patch, graceful fallback when anchor leaves the visible page/filter
- [x] Bulk bar: "Mark reimbursable (N)" targeting only the non-reimbursable subset of a mixed selection (blind `mark-todo` would unassign group rows)

**Post-Phase fixes**

- [x] `useAccountSelection` rewritten as an external store (`useSyncExternalStore` + listener set + localStorage) — pages consumed account context *above* its provider and permanently saw `accountId: null`
- [x] Synchronous hydration from localStorage on first render (was async `useEffect`, causing a null flash)
- [x] Auto-select first visible account (pinned favorites first) when selection is empty or stale, per PRD F2

## Milestone 3: Dashboard

- [ ] Account balance widget (current balance of selected account)
- [ ] Total unreimbursed amount (sum of `todo`-tagged amounts only)
- [ ] Reimbursements by period table (period name → total, count)
- [ ] Monthly spending bar chart

## Milestone 4: Polish

- [ ] Date range filter with presets (This Month, Last 3 Months, This Year, All Time)
- [ ] CSV export respects current filters (status, date range, search)
- [ ] Unit tests for `mapRawTransactionToRecord`
- [ ] Loading states (skeletons) for transaction table and dashboard
- [ ] Error boundary for API failures
- [ ] Keyboard shortcuts (e.g., `R` to mark selected as reimbursed)
