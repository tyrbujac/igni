```igni
screen Dashboard, title: "Analytics":
  date_range = "Last 7 days"
  region = "All regions"
  compare = false
  active_section = "Overview"

  date_options = ["Last 7 days", "Last 30 days", "Last 90 days", "Year to date"]
  region_options = ["All regions", "Americas", "EMEA", "APAC"]

  layout vertical, fill: true:

    # ── Header bar ────────────────────────────────
    layout horizontal, padding: medium, background: card, spread: true, align: center:
      label "Analytics", style: heading
      button "Refresh", color: brand, on tap: refresh()

    # ── Three-column body ─────────────────────────
    layout horizontal, fill: true, gap: medium, padding: medium:

      # Left sidebar — navigation (intrinsic width)
      layout vertical, gap: medium, padding: medium, background: card, rounded: medium:
        label "Navigation", style: heading.small
        label "Overview",    on tap: select("Overview")
        label "Traffic",     on tap: select("Traffic")
        label "Conversions", on tap: select("Conversions")
        label "Revenue",     on tap: select("Revenue")

      # Main content — dominant column
      layout vertical, fill: true, gap: medium:
        label active_section, style: heading

        layout horizontal, gap: medium:
          layout vertical, fill: true, padding: large, background: card, rounded: medium, gap: small:
            label "Visitors", style: caption
            label "24,521", style: heading
            label "vs last week", style: caption

          layout vertical, fill: true, padding: large, background: card, rounded: medium, gap: small:
            label "Conversions", style: caption
            label "1,284", style: heading
            label "vs last week", style: caption

          layout vertical, fill: true, padding: large, background: card, rounded: medium, gap: small:
            label "Revenue", style: caption
            label "$48,290", style: heading
            label "vs last week", style: caption

      # Right sidebar — filters (intrinsic width)
      layout vertical, gap: medium, padding: medium, background: card, rounded: medium:
        label "Filters", style: heading.small
        dropdown bind: date_range, options: date_options
        dropdown bind: region, options: region_options
        toggle bind: compare, label: "Compare to last period"

  refresh():
    print("refresh tapped")

  select(item):
    active_section = item
```

### Design notes

**The three-column ratio.** The spec only exposes three width tokens (`phone` / `tablet` / `desktop`) and no numeric widths, so a literal "20% / 60% / 20%" split isn't expressible. Instead I leaned on the asymmetry between *filled* and *intrinsic* layouts in a horizontal row:

- **Main column** is the only one with `fill: true`, so it absorbs **all** remaining horizontal space after the sidebars take their intrinsic widths. On a 1400px+ window this is exactly the "main dominates" behaviour the brief asked for — the wider the monitor, the more the main column grows, while the sidebars stay put.
- **Left sidebar** sizes to its longest menu label ("Conversions") plus padding — naturally narrow, never larger than its content needs.
- **Right sidebar** sizes to its widest dropdown — slightly wider than the left, but still a small fraction of the screen.

This is deliberately the opposite of putting `fill: true` on all three: equal thirds would make sidebars dominate at desktop widths, which the brief explicitly forbids.

**The three stat cards.** Inside the main column, each card *does* use `fill: true`, so the three siblings split the main column's width equally — they grow together as the main column grows, keeping the row balanced.

**Vertical fill.** The outer `layout vertical, fill: true` and the body's `layout horizontal, fill: true` together push the three-column section to occupy the entire viewport below the header, so the sidebars' card backgrounds extend the full height of the dashboard.

**Header.** A horizontal layout with `spread: true` pins "Analytics" to the left and "Refresh" to the right, against a `card` background to visually separate it from the working area.