# Design Notes

Non-technical reference for design decisions and preferences. Read this before making visual or structural changes to keep the interface consistent.

## Visual identity

The app has a cool, technical personality. It is a personal financial tool, not a consumer product. The design should feel precise, trustworthy, and efficient — closer to a well-built instrument than a marketing page.

**Avoid:** warm/cream palettes, decorative serifs, rounded "friendly" shapes, bright accent colors, gradient backgrounds, unnecessary illustration. These choices are deliberate, not defaults — they exist because the app's subject (money, precision, personal accountability) calls for them.

## Color

The palette is cool-toned with steel blue as the accent. Positive amounts use a muted green, negative amounts use a muted brick red. These greens and reds are intentionally subdued — they signal status without shouting.

Dark mode is the primary mode. Light mode exists but is secondary. When adding new elements, design for dark first.

## Typography

Three typefaces, each with a specific job:

- **Space Grotesk** — headings and the app name. Used sparingly, only where visual hierarchy needs weight.
- **DM Sans** — all body text, labels, descriptions, navigation items. The workhorse.
- **JetBrains Mono** — all financial figures, dates, IDs, and any data that needs to align in columns. Monospace is used here because tabular alignment matters, not for aesthetic decoration.

The outstanding total on the transactions page is the one place where type size makes a statement: it is large, light-weight, and monospace. This is the app's signature element. Do not add other large display numbers unless they serve the same purpose (showing a critical at-a-glance figure).

## Layout and spacing

The sidebar is a navigation panel, not just an account list. It has three zones from top to bottom:

1. **Navigation** — links to major views (Transactions, and later Reimbursements).
2. **Favorites** — accounts the user has pinned for quick access.
3. **All accounts** — the full list, with a star toggle to pin/unpin.

The main content area has a toolbar at the top, then the outstanding total (when an account is selected), then the transaction table. Keep this vertical rhythm. Do not add sections between the total and the table.

## The outstanding total

This is the most important element on the transactions page. It answers the user's first question: "how much do I still need to be reimbursed?" It should always be visible when an account is selected, positioned between the toolbar and the table. Do not move it to a sidebar, footer, or modal.

## Account items

Account items in the sidebar are two lines: the account name on the first line, the balance on the second line. They are not side-by-side. This layout is intentional — it gives the name enough space to breathe and makes the balance easy to scan independently.

## The star (pin) toggle

A small star icon on each account row controls whether the account appears in the Favorites section. Filled star = pinned. Outline star = not pinned. The star is subtle (small, low-contrast when not hovered) so it does not compete with the account name. Do not make it larger or add a label — the icon is self-explanatory.

## Motion

Animation is minimal and purposeful. No page-load sequences, no scroll-triggered reveals, no ambient effects. The only animation that exists is for UI state changes (sidebar toggle, hover feedback). If you are considering adding animation, ask: does this help the user understand something, or is it decoration? If decoration, skip it.

## Writing

All text is sentence case. No ALL CAPS except for small section labels in the sidebar (e.g., "FAVORITES", "ALL ACCOUNTS") where uppercase with wide tracking is used as a structural device. Buttons use active verbs ("Export CSV", "Connect"). Error messages explain what happened and what to do, not what went wrong in system terms.

## Empty states

An empty state (no accounts, no transactions, no results) should tell the user what to do next, not just say "nothing here." The message should be short, specific, and in the app's voice.

## What not to add

- Do not add a dashboard or summary charts to the transactions page. The outstanding total is the summary.
- Do not add color-coded status badges to table rows. The muted green/red on amounts is sufficient.
- Do not add tooltips or popovers to explain what "Todo" means. The toggle is self-explanatory.
- Do not add a dark/light mode toggle to the sidebar or header. The theme follows system preference by default, and the setting is accessible elsewhere if needed.
