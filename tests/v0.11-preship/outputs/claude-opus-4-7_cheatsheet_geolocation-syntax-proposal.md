## 1. Proposed syntax

```igni
screen Weather:
  here = locate()

  layout vertical, padding: large, align: center:
    if here is loading:
      spinner
    else if here is error:
      label "Couldn't get location"
    else:
      label here.latitude
      label here.longitude
```

`locate()` is a builtin that returns a location resource with fields `.latitude` and `.longitude` (decimals). It follows the exact same shape as `fetch()` — top-level assignment, re-evaluated reactively, with `is loading` / `is error` / `is null` guards.

## 2. Justification

Reusing `fetch()`'s async pattern means there's **one way** to handle async in Igni — no new keywords, no new state machine, no callbacks. `locate()` reads like a design spec ("get the user's location") and the familiar `is loading / is error` ladder keeps the render-site code identical to any other async resource. Field access via `.latitude` / `.longitude` matches the existing object-field vocabulary (`user.name`, `item.price`).

## 3. Ambiguities to resolve before shipping

- **Permission denial vs. hardware failure vs. timeout** — do all three collapse into `is error`, or do we need `is denied` as a distinct state so UX can prompt "enable location in settings" separately from "try again"?
- **Freshness / re-querying semantics** — does `locate()` fire once per screen mount, or does it stream updates as the device moves? If it streams, we need a way to opt out (one-shot read for a weather app vs. continuous for a map). A property like `locate(watch: true)` would echo `fetch`'s option style.
- **Accuracy and extra fields** — beyond lat/lon, real apps often want `.accuracy`, `.altitude`, `.heading`. Ship minimal (just lat/lon) and extend, or commit to the full shape now?
- **Reactive-fetch footgun interaction** — if a user writes `fetch("/weather?lat=" + here.latitude)`, does the transpiler treat `here` as a reactive input the same way it treats `bind:` variables? Probably should, since it changes on re-read.