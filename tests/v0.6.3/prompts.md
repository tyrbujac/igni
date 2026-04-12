# Igni Cold-LLM Test Prompts (v0.6.3)

Re-run of the v0.6.2 Contacts prompt against v0.6.3. Goal: does the spec patch (map, toggle label, contains case-insensitivity, floats, random) improve output quality? Can we hit zero fixes needed to transpile?

## How to use

Paste the full contents of `spec/v0.6.3.md` FIRST, then paste the prompt BELOW it in the same chat message. Fresh conversation, no prior context.

---

## 1. Contacts app (same as v0.6.2)

> Using only the Igni language spec above, write a contacts app in Igni. The main screen shows a list of contacts sorted alphabetically by name. Each contact has a name, phone number, and a "favourite" boolean. There's a search bar at the top that filters contacts as you type. A toggle switches between showing all contacts and showing only favourites. Tapping a contact navigates to a detail screen showing their full info. The detail screen has a button to toggle the favourite status. Use filter, sorted, and contains from the spec's builtins.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.
