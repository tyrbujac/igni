```igni
screen LocationDemo:
  location = locate()

  if location is loading:
    label "Loading"
  else if location is error:
    label "Error"
  else:
    label round(location.latitude, 6) + ", " + round(location.longitude, 6)
```

This fits Igni by following the existing async pattern used by `fetch(...)`: a single expression assigned to a screen variable, then handled with `is loading` / `is error` / success branches. The resolved value is an object-shaped result with stable field access, so `location.latitude` and `location.longitude` feel consistent with the rest of the language.

Ambiguities to clarify before shipping:
- Whether `locate()` requests permission automatically, and whether denied permission is represented as generic `error` or a distinct state/value.
- Whether the result is a one-time current fix or a live-updating stream as the device moves.
- Whether extra fields are included on success, such as `accuracy`, `altitude`, or `timestamp`, and whether web/simulator unsupported cases also map to `error`.