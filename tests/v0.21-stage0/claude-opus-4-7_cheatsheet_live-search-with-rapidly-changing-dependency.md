```igni
# Search.igni

theme:
  color:
    brand: "#E07856"
    surface: "#FFFFFF"
    text: "#1A1A1A"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

screen Search, title: "Find a recipe":
  query = ""              # bound to the input — live, but NOT a fetch dep
  submitted_query = ""    # the trigger variable — only this drives fetch
  max_minutes = 30        # slider value — live fetch dep (drags re-fire)

  results = fetch("https://api.recipes.example/search?q=" + submitted_query + "&max_minutes=" + max_minutes)

  layout vertical, gap: medium, padding: large:
    input bind: query, placeholder: "Search recipes", on submit: submitted_query = query

    layout vertical, gap: small:
      label "Max prep time: " + max_minutes + " min", style: caption
      slider bind: max_minutes, min: 5, max: 120, step: 5

    if results is loading:
      layout horizontal, gap: small, align: center:
        spinner
        label "Searching..."
    else if results is error:
      layout vertical, gap: small, align: center:
        label "Search failed — tap to retry"
        button "Retry", color: brand, on tap: submitted_query = submitted_query + ""
    else:
      if results is empty:
        label "No recipes found", style: caption
      else:
        each recipe in results:
          layout vertical, gap: small, padding: medium, background: card, rounded: medium:
            label recipe.title, style: title
            label recipe.prep_minutes + " min", style: caption
            label recipe.description, style: body
```

### Notes on the choices

**Trigger variable for the input, direct bind for the slider.** The cheatsheet's reactive-fetch rule rejects concatenating an `input bind:` variable straight into a fetch URL (it'd re-fire per keystroke). So `query` stays local to the input, and `submitted_query` — only reassigned in `on submit:` — is the actual fetch dep. The slider has no such restriction; `max_minutes` goes straight into the URL and the cheatsheet's v0.21 reactive-fetch cancellation guarantees the latest drag's response wins (previous in-flight requests are cancelled, stale responses dropped via the generation counter). That's exactly the "see the latest result, not stale results mid-drag" requirement, satisfied with zero debouncing code.

**Retry trick: `submitted_query = submitted_query + ""`.** A fetch only re-fires when a *dependency* is reassigned. Reassigning to the same string value still counts as a reassignment, triggering re-evaluation and a fresh fetch. The `+ ""` is the idiomatic no-op-but-reassign shape — clearer than introducing a separate `retry_nonce` counter for a one-line retry button. (The alternative — a `retry_count = 0` dep concatenated harmlessly into the URL — also works but adds a phantom query param to every request.)

**Card shape over `Card` component.** I used inline `layout vertical, ..., background: card, rounded: medium:` rather than defining a `Card` component, because each result is rendered exactly once in one place. A component would be the right call if cards appeared on multiple screens or had non-trivial internal logic; here it'd just be indirection.

**Empty-results check inside the success branch.** `results is empty` lives under `else:` (the success branch), not as a peer to `is loading` / `is error` — `is empty` on a fetch result only makes sense once the fetch has succeeded and returned a list.