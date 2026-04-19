### 1. Proposed Syntax

```igni
screen MapView:
  location = fetch_location()

  layout vertical, padding: large:
    if location is loading:
      spinner
    else if location is error:
      label "Unable to get location"
    else:
      label "Lat: " + location.latitude
      label "Lon: " + location.longitude
```

### 2. Justification
This syntax adheres to Igni’s "one way to do everything" principle by treating device location as a special-purpose, reactive async provider identical to the existing `fetch()` pattern. By returning an object that supports the `is loading`, `is error`, and property-access (`.latitude`) patterns, the developer uses the exact same mental model as they do for API network calls, requiring no new control flow or callback structures.

### 3. Ambiguities for Clarification
*   **Permissions Handling:** Should the initial call to `fetch_location()` automatically trigger the system permission dialog, or is a separate `request_permission()` primitive required before the fetch?
*   **Updates:** Does `fetch_location()` return a static snapshot once resolved, or is it a stream that updates automatically as the user moves? (If the latter, we should clarify if it requires an explicit `on location_change` handler to avoid UI jitter).
*   **Precision:** Does the `location` object require a standard schema (e.g., `accuracy`, `timestamp`), or is it strictly constrained to `latitude` and `longitude` for simplicity?