Here is the complete `Settings.igni` app, implementing the requested UI, themes, and durable state according to the v0.21.1 specification.

```igni
theme:
  color:
    brand: "#FF6B35"
    surface: "#FAFAFA"
    text: "#0F0F14"
    card: "#FFFFFF"
    subtle: "#E0E0E0"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#0D0D14"
    text: "#F5F5F5"
    card: "#1A1A24"
    subtle: "#333340"
    # `brand` is omitted here — it automatically inherits "#FF6B35" from light

shared persisted:
  theme_mode = "system"
  sender_name = ""

screen Settings, title: "Settings":
  draft_name = shared.sender_name

  width_for(mode):
    if shared.theme_mode is mode:
      return thick
    return thin

  color_for(mode):
    if shared.theme_mode is mode:
      return brand
    return subtle

  layout vertical, padding: large, gap: large:
    
    # --- Theme Mode Section ---
    layout vertical, gap: medium:
      label "Appearance", style: title

      layout horizontal, padding: medium, rounded: medium, background: card, border: width_for("system"), color: color_for("system"), on tap: shared.theme_mode = "system":
        label "System default"

      layout horizontal, padding: medium, rounded: medium, background: card, border: width_for("light"), color: color_for("light"), on tap: shared.theme_mode = "light":
        label "Force Light"

      layout horizontal, padding: medium, rounded: medium, background: card, border: width_for("dark"), color: color_for("dark"), on tap: shared.theme_mode = "dark":
        label "Force Dark"

    # --- Sender Name Section ---
    layout vertical, gap: small:
      label "Card defaults", style: title
      input bind: draft_name, placeholder: "Your name on sent cards", on change: shared.sender_name = draft_name
```

### Idiomatic Decisions & Explanations

**1. Bridging the `input bind:` (Parse-time rule)**
Notice that the input is bound to `draft_name`, not `shared.sender_name` directly:
```igni
draft_name = shared.sender_name
input bind: draft_name, ..., on change: shared.sender_name = draft_name
```
*Why this shape:* Igni relies on a stable, local identifier for the underlying Flutter text controller. Calling `input bind: shared.sender_name` directly is a parse-time error. The canonical shape is to capture the shared state into a local top-level variable (`draft_name`), bind to that, and write back to the shared scope using `on change:`.

**2. The Selected-State Pattern**
To achieve "visibly selected radio buttons", we map both the `border:` width and `color:` properties through two screen-internal functions (`width_for` and `color_for`). 
*Why this shape:* A selected element needs to signal via both width (`thick`) and colour (`brand`) to be unambiguous. By returning token values from helper functions, we keep the layout code flat, declarative, and easy to read without nesting deep `if/else` conditionals inside the layout hierarchy.

**3. `shared persisted:` for durability**
We placed both `theme_mode` and `sender_name` in a `shared persisted:` block instead of a standard `shared:` block.
*Why this shape:* Both are user preferences that must survive app restart. Variables in a persisted block act identical to standard shared state (lexical reactivity on assignment, global namespace access via `shared.`), but evaluate disk values on startup instead of resetting to defaults.

**4. Dark Mode Auto-Fallback**
In the `theme dark:` block, we redefined `surface`, `text`, `card`, and `subtle` to suit dark mode, but we left out `brand`. 
*Why this shape:* Igni natively supports auto-fallback for variant pairs. Because the brand colour remains exactly the same in both light and dark environments, redeclaring it is unnecessary. The runtime will automatically inherit the light variant's `"#FF6B35"` when the app shifts to dark mode.