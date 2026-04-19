### 1. Syntax

```igni
screen Locator:
  loc = location()

  if loc is loading:
    label "Loading"
    spinner
  else if loc is error:
    label "Error"
  else:
    label round(loc.latitude, 4) + ", " + round(loc.longitude, 4)
```

### 2. Justification

By modeling a `location()` builtin directly after the existing `fetch()` primitive, we reuse Igni's established pattern for asynchronous data states (`is loading`, `is error`). This avoids introducing callbacks or an `await` keyword, keeping device hardware APIs perfectly aligned with the simple, declarative, and reactive flow used for network requests. Using the `round()` builtin handles the number-to-string conversion safely while formatting the coordinates for the UI.

### 3. Ambiguities to Clarify

* **Permissions:** Does invoking `location()` automatically trigger the native OS permission prompt, and does a user denial immediately resolve the state to `is error`?
* **One-shot vs. Continuous:** Is `location()` a one-time read (like `fetch`), or does it continuously subscribe to GPS updates? If it's one-shot, we need to define how a developer triggers a manual refresh without violating the "reactive-fetch footgun" rules.
* **Accuracy and Timeouts:** Because Igni enforces "one way to do everything" (no config objects/parameters), we must determine what the hardcoded native defaults are for GPS accuracy and timeout duration before it yields an error.