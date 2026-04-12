# Igni Cold-LLM Test Prompts (v0.6.2)

First end-to-end transpiler-validated test against v0.6.2. Exercises the v0.6.x additions: lambdas, `filter`/`sorted`/`reversed`, `and`/`or`, comparison operators, implicit vertical layout — plus core features from v0.5.x.

## How to use these prompts

**Paste the full contents of `spec/v0.6.2.md` FIRST, then paste one prompt BELOW it in the same chat message.** The prompt must be the last thing the model sees. Use a fresh conversation with no prior context.

---

## 1. Contacts app

> Using only the Igni language spec above, write a contacts app in Igni. The main screen shows a list of contacts sorted alphabetically by name. Each contact has a name, phone number, and a "favourite" boolean. There's a search bar at the top that filters contacts as you type. A toggle switches between showing all contacts and showing only favourites. Tapping a contact navigates to a detail screen showing their full info. The detail screen has a button to toggle the favourite status. Use filter, sorted, and contains from the spec's builtins.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What this exercises:**

- **Lambdas + list builtins:** `filter(contacts, c => ...)`, `sorted(contacts, c => c.name)`, `contains(c.name, query)`
- **Boolean operators:** `and`/`or` for combining search + favourites filter
- **Comparison operators:** potentially for sorting or conditional logic
- **Shared state:** contacts list needs to persist across list → detail navigation (favourite toggle on detail must reflect on list)
- **Navigation:** `navigate to Detail contact` / `navigate back`
- **Data binding:** `input bind:` for search, `toggle bind:` for favourites filter
- **`on tap:`** on labels/layouts for tappable contact rows
- **Implicit vertical layout:** screen bodies without explicit `layout vertical:`

**Predicted gaps:**

- **Search + filter composition** — the model needs to chain `filter` and `sorted` together, potentially with `and`/`or` in the lambda. This is the complexity test.
- **Shared vs local state** — contacts should be `shared:` (persists across screens), but the search query and favourites toggle should be local. Models that put everything in `shared:` or nothing in `shared:` have misunderstood the boundary.
- **Favourite toggle from detail screen** — needs `replace` on `shared.contacts` from the detail screen. Tests whether the model understands cross-screen mutation via shared state.
