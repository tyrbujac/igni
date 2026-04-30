# Settings.igni

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
    card: "#1A1A24"
    # brand inherits from light variant

shared persisted:
  theme_mode = "system"
  sender_name = ""

screen Settings, title: "Settings":
  draft_name = shared.sender_name

  layout vertical, padding: large, gap: medium:
    label "Appearance", style: title

    layout vertical, gap: small:
      ModePicker "system", "Follow system"
      ModePicker "light", "Light"
      ModePicker "dark", "Dark"

    label "Sender", style: title

    input bind: draft_name,
      placeholder: "Your name on sent cards",
      on change: shared.sender_name = draft_name

component ModePicker(mode_value, mode_label):
  layout horizontal, gap: medium, align: center,
      padding: medium, rounded: medium,
      background: bg_for(mode_value),
      border: width_for(mode_value),
      color: color_for(mode_value),
      on tap: shared.theme_mode = mode_value:
    icon icon_for(mode_value), color: color_for(mode_value)
    label mode_label

  bg_for(m):
    if m is shared.theme_mode:
      return card
    return surface

  width_for(m):
    if m is shared.theme_mode:
      return thick
    return thin

  color_for(m):
    if m is shared.theme_mode:
      return brand
    return subtle

  icon_for(m):
    if m is shared.theme_mode:
      return "radio_checked"
    return "radio_unchecked"
```

## Design choices where two shapes were equally canonical

**1. `input bind:` for sender name uses the local-draft + `on change:` bridge.**
The cheatsheet is explicit that `input bind: shared.X` is rejected at parse time — `input` is the documented exception to direct shared binding. So `draft_name = shared.sender_name` (initial-capture) plus `on change: shared.sender_name = draft_name` is the only legal shape, not a stylistic pick.

**2. Radio options as a custom `ModePicker` component, not three inline `layout horizontal` blocks.**
Three near-identical rows that each need selection-state styling on two axes (border width + colour) is exactly the case for component extraction. Inlining would repeat `width_for` / `color_for` logic three times, or force a single function with three branches. The component reads as a list of three options at the call site, which matches how the user thinks about the picker.

**3. Selection signalled through border width *and* colour (not background alone).**
The cheatsheet's selected-state pattern explicitly recommends two axes — "either alone is ambiguous." I used `border: thick/thin` + `color: brand/subtle`, plus a filled-vs-empty radio icon for redundancy. Background swap (`card` for selected) is a third reinforcement, not the primary signal.

**4. `theme: color: card` is declared even though the cheatsheet grandfathers `card` as background-only.**
The constraints listed `card` in the required token set; declaring it in both variants gives the selected-row background a themed surface that flips correctly on dark mode. The background-only restriction is preserved — `card` is only used in `background:` positions in the screen.

**5. Tokens missing in `theme dark:` rely on auto-fall-back.**
`brand` is declared once in light and inherits in dark per the cheatsheet's auto-fall-back rule. Redeclaring it in dark would be noise — the colour doesn't change between modes.