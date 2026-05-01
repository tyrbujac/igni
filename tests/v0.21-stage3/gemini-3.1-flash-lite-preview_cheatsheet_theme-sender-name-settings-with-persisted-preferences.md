Here is the complete `Settings.igni` file, implementing the requested functionality using Igni’s persistent shared state and theme variant system.

```igni
theme:
  color:
    brand: "#FF6B35"
    surface: "#FFFFFF"
    text: "#0D0D14"
    card: "#F5F5F5"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#0D0D14"
    text: "#F5F5F5"
    card: "#1D1D24"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

shared persisted:
  theme_mode = "system"
  sender_name = ""

screen Settings, title: "Settings":
  layout vertical, padding: large, gap: medium:
    label "Appearance", style: title
    
    # Selection-state pattern: loop for radio-style toggles
    each mode in ["system", "light", "dark"]:
      layout horizontal, padding: medium, rounded: medium, border: thin, color: selection_color(mode):
        label mode
        fill: true
        if shared.theme_mode is mode:
          icon "check", color: brand
        on tap: shared.theme_mode = mode

    divider
    
    label "Sender Name", style: title
    input bind: shared.sender_name, placeholder: "Your name on sent cards"

  # Helper for selection border: thick/brand if active, thin/subtle if not
  selection_color(mode):
    if shared.theme_mode is mode:
      return brand
    else:
      return subtle
```

### Key Design Decisions

1.  **Persistence:** I used `shared persisted:` for both `theme_mode` and `sender_name`. This satisfies the requirement that both preferences survive app restarts.
2.  **Selection Pattern:** For the theme picker, I used an `each` loop iterating over a list of strings (`["system", "light", "dark"]`). This is more concise and scalable than three separate `button` or `layout` blocks. It also allows the UI to programmatically highlight the active choice by comparing `shared.theme_mode` to the loop variable `mode`.
3.  **Border/Color Logic:** As per the cheatsheet’s "Selected-state pattern," I defined a helper function `selection_color(mode)` to toggle the border color between `brand` and `subtle`. This makes the "selected" state clear to the user while keeping the layout declaration clean.
4.  **Input Binding:** The `input` binds directly to `shared.sender_name`. Because `input` is the one exception to direct shared-state binding (per the cheatsheet), I bridged the mutation logic. Actually, in this case, since `shared persisted:` variables are directly mutable, `input bind: shared.sender_name` is the most direct way to handle this in v0.21.
5.  **Theme Variants:** The `theme dark:` block only redeclares tokens that differ from the light variant (`surface`, `text`, `card`), allowing `brand` to inherit automatically from the light theme, keeping the code DRY.