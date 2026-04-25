```igni
screen Dashboard:
  # State
  selected_tab = "Overview"
  date_range = "Last 7 days"
  region = "Global"
  compare = false

  # Hardcoded Dropdown Options
  tabs = ["Overview", "Traffic", "Conversions", "Revenue"]
  dates = ["Today", "Last 7 days", "Last 30 days", "This Year"]
  regions = ["Global", "North America", "Europe", "Asia"]

  # Hardcoded Data
  stats = [
    {name: "Total Visitors", value: "124.5K", caption: "+12% vs last week"},
    {name: "Bounce Rate", value: "42.1%", caption: "-2% vs last week"},
    {name: "Avg Session", value: "3m 12s", caption: "+15s vs last week"}
  ]

  # Header Bar
  layout horizontal, padding: medium, spread: true, align: center:
    label "Analytics", style: heading
    button "Refresh", on tap: refresh()

  divider

  # Main 3-Column Workspace
  layout horizontal, fill: true, padding: large, gap: large:

    # 1. Left Sidebar (Navigation)
    layout vertical, fill: true, max_width: phone, gap: medium:
      each tab in tabs:
        tab_color = subtle
        if tab is selected_tab:
          tab_color = brand
        label tab, style: heading.small, color: tab_color, on tap: selected_tab = tab

    # 2. Main Content (Center)
    layout vertical, fill: true, gap: large:
      layout horizontal, gap: medium:
        each stat in stats:
          layout vertical, fill: true, padding: medium, background: card, rounded: medium, gap: small:
            label stat.name, style: heading.small
            label stat.value, style: heading
            label stat.caption, style: caption, color: subtle

    # 3. Right Sidebar (Filters)
    layout vertical, fill: true, max_width: phone, gap: medium:
      label "Filters", style: heading.small
      dropdown bind: date_range, options: dates
      dropdown bind: region, options: regions
      toggle bind: compare, label: "Compare to last period"

  # Internal Functions
  refresh():
    selected_tab = selected_tab  # Reassigning state triggers a manual UI rebuild
```

### Design Decisions & Sizing

*   **Column Widths (Desktop Targeting):** The main horizontal layout uses `fill: true` to take up the remaining vertical space under the header. Inside it, all three columns declare `fill: true`. However, the left and right sidebars also declare `max_width: phone` (which caps them at 480px). According to Igni's CSS-like layout rules, the capped sidebars will freeze at their limit on a wide screen (≥1400px), and the center layout (which is uncapped) will dynamically stretch to absorb all the remaining space. This ensures the main analytics area stays visually dominant.
*   **Horizontal Stat Cards:** Inside the main content column, the three stat cards are arranged in a `layout horizontal`. Each card uses `fill: true`. Since none of them have a `max_width` cap, they will inherently split the center column's width into three perfect equal thirds. 
*   **Header Arrangement:** By utilizing `layout horizontal, spread: true, align: center`, the title stays anchored to the far left, and the "Refresh" button pushes to the far right, matching standard desktop dashboard patterns.
*   **Active Navigation Styling:** Igni achieves conditional styling through reassignment. In the sidebar loop, `tab_color` defaults to `subtle`, but is overridden to `brand` if `tab is selected_tab`. Since tapping a label updates the `selected_tab` variable, the screen re-evaluates and dynamically updates the highlight.