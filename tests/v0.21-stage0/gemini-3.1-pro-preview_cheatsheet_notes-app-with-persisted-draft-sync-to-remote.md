Here is the complete `Notes.igni` app. It implements every constraint requested, using idiomatic Igni v0.20+ patterns like `shared persisted:`, reactive cross-screen fetches, the `input` / `shared:` bridge, and `transition: fade` for smooth insertions.

```igni
# Notes.igni

# A clean, modern theme with automatic dark mode fallbacks.
theme:
  color:
    brand: "#2563EB"
    card: "#F3F4F6"

theme dark:
  color:
    card: "#1F2937"

# -----------------------------------------------------------------------------
# State
# -----------------------------------------------------------------------------

shared persisted:
  notes = []
  draft = ""

shared:
  # Trigger variable for our sync POST. Stored in volatile shared state so
  # the List screen can pick it up when we navigate back from the Editor.
  pending_sync = null

# -----------------------------------------------------------------------------
# Screens
# -----------------------------------------------------------------------------

screen List, title: "Notes":
  # ---------------------------------------------------------------------------
  # DECISION: Sync Location
  # The prompt requires navigating back to List while showing sync loading states.
  # If we put `fetch` on the Editor screen and immediately `navigate back`, Igni's
  # screen-dispose cycle would cancel the in-flight POST (v0.21 reactive fetch rule).
  # By placing the