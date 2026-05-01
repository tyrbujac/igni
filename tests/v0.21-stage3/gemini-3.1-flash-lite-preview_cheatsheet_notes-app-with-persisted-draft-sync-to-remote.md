Here is the `Notes.igni` application.

```igni
theme:
  color:
    brand: "#FF6B35"
    surface: "#FFFFFF"
    text: "#0D0D14"

shared persisted:
  notes = []
  draft = ""

screen List, title: "Notes":
  layout vertical, padding: large, gap: medium:
    if shared.notes is empty:
      label "No notes yet", style: caption
    else:
      each note in shared.notes:
        layout vertical, padding: medium, background: card, rounded: medium, border: thin:
          label note
    
    button "New", on tap: navigate to Editor

screen Editor, title: "New note":
  sync_status = "idle" # "idle" | "loading" | "success" | "error"

  layout vertical, padding: large, gap: medium:
    input bind: shared.draft, placeholder: "Type your note..."
    
    if sync_status is "loading":
      spinner
    else if sync_status is "success":
      label "Saved!", color: green
    else if sync_status is "error":
      label "Sync failed", color: danger

    button "Save", on tap: save()

  save():
    sync_status = "loading"
    # POST and capture response
    # We use a temp var to handle the async flow
    result = fetch("https://api.notes.example/sync", method: "POST", body: {text: shared.draft})
    
    if result is error:
      sync_status = "error"
    else:
      shared.notes = shared.notes + [shared.draft]
      shared.draft = ""
      sync_status = "success"
      navigate back
```

### Design Notes:
*   **State Management:** I used `shared persisted:` for both `notes` and `draft` to satisfy the requirement that both the list and the in-progress writing survive app restarts.
*   **Editor Sync Flow:** Since `fetch()` is reactive, I avoided binding it directly to an `input` keystroke storm. Instead, the sync logic is contained within the `save()` function, triggered by the explicit "Save" button. 
*   **Sync Status:** I used a local `sync_status` variable within `Editor`. While this is local, it effectively manages the UI transition (spinner → success/error) during the network call. 
*   **The `save()` function:** This follows the canonical pattern: initiate the fetch, check the result, then update `shared` state only upon success. The navigation back to `List` happens after the state is successfully updated, ensuring the user sees the new note immediately upon return.
*   **Layout Choice:** For the cards, I used `background: card` and `border: thin`. Per the cheatsheet, `border:` is a layout property, so I wrapped the `label` inside a `layout` container to achieve the card appearance.