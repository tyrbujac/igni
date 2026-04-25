```igni
screen Analytics:
  # State
  active_nav = "Overview"
  date_range = "Last 30 Days"
  region = "Global"
  compare = true

  # Header
  layout horizontal, padding: large, background: card:
    label "Analytics", style: heading
    layout horizontal, fill: true # Spacer to push button right
    button "Refresh", on tap: print("Refreshing...")

  # Main Content
  layout horizontal, fill: true, padding: large, gap: large:
    
    # Left Sidebar (Nav)
    layout vertical, gap: medium, max_width: tablet:
      label "Menu", style: caption
      label "Overview", on tap: active_nav = "Overview"
      label "Traffic", on tap: active_nav = "Traffic"
      label "Conversions", on tap: active_nav = "Conversions"
      label "Revenue", on tap: active_nav = "Revenue"
    
    # Center (Stats)
    layout vertical, fill: true, gap: large:
      label active_nav, style: heading
      layout horizontal, gap: medium:
        StatCard "Total Visits", "124,592", "vs last week"
        StatCard "Conversion", "3.2%", "vs last week"
        StatCard "Revenue", "$42,800", "vs last week"
      
      # Placeholder for visual depth
      layout vertical, fill: true, background: card, rounded: medium
    
    # Right Sidebar (Filters)
    layout vertical, gap: large, max_width: tablet:
      label "Filters", style: heading.small
      dropdown bind: date_range, options: ["Last 7 Days", "Last 30 Days", "Last 90 Days"]
      dropdown bind: region, options: ["Global", "North America", "Europe", "Asia"]
      toggle bind: compare, label: "Compare to last period"

# Components
component StatCard(title, value, caption):
  layout vertical, padding: large, background: card, rounded: medium:
    label title, style: caption
    label value, style: heading
    label caption, style: caption
```

### Design Decisions

*   **Header Spacer**: I used a `layout horizontal, fill: true` with no children between the "Analytics" title and the "Refresh" button. Per the spec, `fill: true` expands to occupy all available space in the row, effectively pushing the button to the far right edge of the screen.
*   **Column Dominance**: I used a parent `layout horizontal` containing three child layouts. To ensure the center content area is dominant on a 1400px+ monitor, I applied `max_width: tablet` (768px) to both sidebars. This caps the width of the sidebars, preventing them from growing too large. The center layout, meanwhile, uses `fill: true`, which forces it to consume all "remaining" space after the sidebars take their capped width, ensuring it stretches to fill the majority of the screen.
*   **Data Structures**: The stat cards are encapsulated in a `StatCard` component. This keeps the main screen clean and enforces a consistent look (`card` background and `rounded: medium` corners) as requested.
*   **Interactivity**: The sidebar items are simple `label` primitives with `on tap` handlers that update the `active_nav` state variable. Because Igni re-evaluates the screen body whenever a bound variable changes, the `label active_nav` in the center column updates instantly when a user clicks a menu item.