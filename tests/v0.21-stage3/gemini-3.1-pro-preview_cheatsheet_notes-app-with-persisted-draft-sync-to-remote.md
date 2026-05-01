 save?
    Maybe gate it:
    ```igni
      save():
        if local_draft is not empty:
          shared.notes = shared.notes + [{text: local_draft}]
          shared.draft = ""
          sync_payload = {text: local_draft}
    ```
    If it IS empty, do nothing.

    Let's double check `input` with `on change:`.
    ```igni
    input bind: local_draft, placeholder: "Write your note...", on change: shared.draft = local_draft
    ```
    This completely matches the cheatsheet. "Every keystroke for input... reassigns the bound variable. ... The bound variable is already updated when the handler fires."
    So `local_draft` updates automatically on type, and `on change:` fires, doing `shared.draft = local_draft`. This keeps the persisted `shared.draft` in sync with every keystroke! If the user kills the app, it's saved.

    Let's review the visual states:
    "The sync POST has loading/error/success states — the user sees a spinner during the POST and an inline 'Saved!' or 'Sync failed' status after."
    This is handled perfectly by the conditional block.

    Let's review the navigation:
    "navigate back to List."
    The `Editor` shows "Saved!" and a "Back to Notes" button which does `navigate back`. Since there's no imperative `wait 1