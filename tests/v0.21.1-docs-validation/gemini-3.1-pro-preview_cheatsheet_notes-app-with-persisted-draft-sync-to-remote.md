Here is the complete, idiomatic Igni `Notes.igni` app. 

It satisfies all constraints: durable shared state for the notes list and draft, a local-variable bridge for the `input` binding, the trigger-variable pattern for reactive data fetching, and declarative state-driven rendering for the POST states.

```igni
theme:
  color:
    brand: "#3B82F6"
    card: "#FFFFFF"
    surface: "#F8FAFC"
  scaffold:
    background: surface

shared persisted:
  notes = []
  draft = ""

screen List, title: "Notes":
  layout vertical, padding: large, gap: medium:
    
    # Content section with fill: true pushes the CTA to the bottom
    layout vertical, fill: true:
      if shared.notes is empty:
        layout vertical, fill: true, align: center:
          label "No notes yet", color: subtle
      else:
        layout vertical, gap: medium:
          each note in shared.notes:
            layout vertical, padding: medium, background: card, rounded: medium, border: thin:
              label note.text
    
    button "+ New", color: brand, on tap: navigate to Editor

screen Editor, title: "New note":
  # Bridge variable for input (input bind: shared.draft is rejected by rule)
  local_draft = shared.draft
  
  # Trigger variable pattern for the reactive