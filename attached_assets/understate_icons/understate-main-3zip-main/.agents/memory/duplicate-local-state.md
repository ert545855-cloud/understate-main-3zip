---
name: Duplicate local state bug pattern (gangs/parties)
description: Why some screens failed to show newly-created gangs/parties/families and how it was fixed
---
UNDERSTATE keeps authoritative `gangs` and `parties` arrays as top-level React state in src/app.js, kept in sync
with the server via socket events (`gangUpdate`/`partyUpdate`) which dispatch a `fb-sync` window CustomEvent that
`useLs()` listens for.

Some external screens (GangPage.js, PoliticsScreen.js) previously called `useLs('gangs', [])` /
`useLs('parties', [])` themselves instead of receiving `gangs`/`setGangs`/`parties`/`setParties` as props from
app.js's `pageProps`. Because it's a *separate* React state instance, it initializes fine and updates
immediately on local optimistic mutation (so creation looked like it worked for a split second), but never
receives the server's authoritative broadcast update via the shared top-level state — causing "founded a
gang/party but it doesn't show" symptoms after navigation or reconnect.

**Why:** each `useState`/`useLs` call is an independent instance; writing to localStorage or dispatching a
custom event from one instance does not automatically update another instance unless that instance's own
effect explicitly listens for it (useLs does listen for `fb-sync`, but only if the *same* component instance
mounted the hook — a second, parallel hook call on the same key is still a fully separate subscriber, so it's
not inherently broken, but mixing "local optimistic state" and "central synced state" for the same data in two
different components is the real hazard: one becomes stale relative to the other whenever mutation logic
differs between them).

**How to apply:** any new screen that creates/joins/mutates gangs, parties, alliances, etc. must receive
`gangs`/`setGangs`/`parties`/`setParties` from `pageProps` in app.js — never call `useLs('gangs'|'parties', [])`
locally in a screen component.
