```igni
screen Analytics:
  section = "Overview"

  date_ranges = ["Last 7 days", "Last 30 days", "This quarter", "Year to date"]
  regions = ["All regions", "North America", "Europe", "Asia Pacific"]

  date_range = "Last 30 days"
  region = "All regions"
  compare = true

  layout horizontal, padding: medium, background: card, spread: true, align: center:
    label "Analytics", style: heading
    button "Refresh", color: brand, on tap: print("Refresh requested")

  layout horizontal, fill: true, gap: large, padding: large:
    layout vertical, gap: small, padding: medium, background: card, rounded: medium, max_width: phone:
      label "Navigation", style: caption

      if section is "Overview":
        layout vertical, padding: small, background: brand, rounded: small, on tap: section = "Overview":
          label "Overview", color: white
      else:
        layout vertical, padding: small, background: subtle, rounded: small, on tap: section = "Overview":
          label "Overview"

      if section is "Traffic":
        layout vertical, padding: small, background: brand, rounded: small, on tap: section = "Traffic":
          label "Traffic", color: white
      else:
        layout vertical, padding: small, background: subtle, rounded: small, on tap: section = "Traffic":
          label "Traffic"

      if section is "Conversions":
        layout vertical, padding: small, background: brand, rounded: small, on tap: section = "Conversions":
          label "Conversions", color: white
      else:
        layout vertical, padding: small, background: subtle, rounded: small, on tap: section = "Conversions":
          label "Conversions"

      if section is "Revenue":
        layout vertical, padding: small, background: brand, rounded: small, on tap: section = "Revenue":
          label "Revenue", color: white
      else:
        layout vertical, padding: small, background: subtle, rounded: small, on tap: section = "Revenue":
          label "Revenue"

    layout horizontal, fill: true, gap: medium:
      layout vertical, fill: true, gap: small, padding: medium, background: card, rounded: medium:
        label "Visitors", style: caption
        label "128,430", style: heading, color: brand
        label "vs last week", style: caption

      layout vertical, fill: true, gap: small, padding: medium, background: card, rounded: medium:
        label "Conversion Rate", style: caption
        label "7.8%", style: heading, color: green
        label "vs last week", style: caption

      layout vertical, fill: true, gap: small, padding: medium, background: card, rounded: medium:
        label "Revenue", style: caption
        label "$84,210", style: heading, color: purple
        label "vs last week", style: caption

    layout vertical, gap: medium, padding: medium, background: card, rounded: medium, max_width: phone:
      label "Filters", style: caption

      label "Date range", style: caption
      dropdown bind: date_range, options: date_ranges

      label "Region", style: caption
      dropdown bind: region, options: regions

      toggle bind: compare, label: "Compare to last period"
```

Design notes:

- The header is a horizontal layout with `spread: true`, so `"Analytics"` stays on the left and the `"Refresh"` button moves to the right.
- The dashboard body uses `layout horizontal, fill: true`, so it fills the remaining vertical space below the header.
- The centre column is the only column marked `fill: true`, so it takes the remaining horizontal space after the sidebars.
- The sidebars are intentionally **not** marked `fill: true`; they size around their content instead of competing equally with the main area.
- Both sidebars use `max_width: phone` as a guardrail so they never grow too large on wide desktop windows.
- Inside the centre area, each stat card uses `fill: true`, so the three cards split the main content width evenly.