---
name: Design System v2 Palette
description: Full DS redesign palette, typography, and shared component locations — applied across all 51 screen files.
---

# Design System v2

## Palette
| Token | Value |
|-------|-------|
| bg | #11151C |
| surface | #1B212B |
| gold (primary accent) | #C9A227 |
| text | #EDE7DA |
| muted | #8893A1 |
| dim | #6B7785 |
| success | #4C9A6B |
| error | #C24B43 |
| border | rgba(237,231,218,0.08) |

## Typography
- Titles: `'Syne',sans-serif` weight 700/800/900
- UI / body: `'Inter',sans-serif` (replaced DM Sans everywhere)
- Numbers / money: `'JetBrains Mono',monospace`

**Why:** DM Sans was removed from the project spec; Inter is more legible at small sizes; JetBrains Mono gives a ledger/financial look to numbers.

## Shared Components (src/components/UI.js)
All exported as `window.*` globals (loaded first in SCREEN_FILES):
- `window.LedgerValue` — money/XP display with JetBrains Mono
- `window.PrimaryButton` — gold (#C9A227) filled button, dark text
- `window.SecondaryButton` — subtle border button
- `window.Card` — surface #1B212B card with border
- `window.GoldDivider` — thin gold horizontal rule
- `window.SectionTitle` — Syne bold section header

## Design tokens file
`src/theme.js` — exports `window.DS` with all palette token constants.

## How to apply
- Always use `#C9A227` for primary actions (buttons, active tabs, highlights)
- Never use `#3B82F6` (blue) as a primary accent
- Background: `#11151C` for page, `#1B212B` for cards/panels
- Use `rgba(237,231,218,0.08)` for subtle borders (not `rgba(255,255,255,0.08)`)
- Progress bars: `linear-gradient(90deg,#C9A227,#E5C14B)` for gold fill
- Success states: `#4C9A6B` (not `#10B981`)
- Error states: `#C24B43` (not `#EF4444`)
