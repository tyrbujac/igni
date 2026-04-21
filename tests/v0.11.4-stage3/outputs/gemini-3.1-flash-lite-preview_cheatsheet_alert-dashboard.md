```igni
screen AlertDashboard, title: "ALERTS":
  alerts = [
    {level: "critical", message: "Server unreachable"},
    {level: "warning", message: "High latency detected"},
    {level: "info", message: "Backup completed"},
    {level: "critical", message: "Database lock"},
    {level: "info", message: "User logged in"}
  ]

  # Compute counts
  crit = length(filter(alerts, a => a.level is "critical"))
  warn = length(filter(alerts, a => a.level is "warning"))
  info = length(filter(alerts, a => a.level is "info"))

  # Determine summary color
  summary_color = green
  if crit > 0:
    summary_color = danger
  else if warn > 0:
    summary_color = orange

  layout vertical, padding: large, gap: medium:
    label crit + " critical, " + warn + " warnings, " + info + " info", color: summary_color
    divider
    each alert in alerts:
      AlertRow alert.message, level_text: upper(alert.level), color: get_color(alert.level)

  get_color(level):
    if level is "critical": return danger
    if level is "warning": return orange
    return green

component AlertRow(message, level_text, color):
  layout horizontal, gap: medium, align: center:
    badge level_text, color: color
    label message
```

### Design Decisions

*   **Reactivity:** The screen-level state (`alerts`) is defined locally. Since Igni re-evaluates the screen body on any variable reassignment, the counts and the summary color logic automatically stay in sync if I were to add functionality to remove or add alerts later.
*   **Separation of Concerns:** 
    *   `get_color` is defined as a screen-internal function to keep the layout code clean and strictly declarative.
    *   `AlertRow` is a thin, reusable component. Per the requirements, it accepts the `color` as an argument (pre-computed by the screen), ensuring the component remains a "dumb" visual shell that doesn't need to know the business rules of what color "critical" should be.
*   **Styling:** I used the `upper()` builtin to satisfy the requirement that the badge text be uppercase. 
*   **Layout:** I used a `vertical` layout as the root, with a `divider` for visual clarity between the summary stats and the actual list of alerts.
*   **Calculations:** Because Igni doesn't support predicate-based `count`, I used `length(filter(...))` as dictated by the spec to accurately derive the counts for the summary line.