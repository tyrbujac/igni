Here is the complete Alert Dashboard app written in Igni. 

```igni
screen Alerts, title: "ALERTS":
  alerts = [
    {level: "critical", message: "Database connection lost"},
    {level: "warning", message: "Memory usage high"},
    {level: "info", message: "Nightly backup complete"},
    {level: "critical", message: "Payment gateway timeout"},
    {level: "info", message: "New user registered"}
  ]

  # Count by field requires length(filter(...)) since count() is for whole values
  count_critical = length(filter(alerts, a => a.level is "critical"))
  count_warning = length(filter(alerts, a => a.level is "warning"))
  count_info = length(filter(alerts, a => a.level is "info"))

  # Determine summary text color using the default-then-override pattern
  summary_color = green
  if count_critical > 0:
    summary_color = danger
  else if count_warning > 0:
    summary_color = orange

  summary_text = count_critical + " critical, " + count_warning + " warnings, " + count_info + " info"

  layout vertical, gap: medium, padding: large:
    label summary_text, color: summary_color, style: heading.small
    divider
    
    each alert in alerts:
      AlertRow alert, badge_color: get_color(alert.level)

  # Screen-internal function to compute colors for the loop
  get_color(level):
    color_value = green
    if level is "critical":
      color_value = danger
    else if level is "warning":
      color_value = orange
    return color_value

component AlertRow(alert, badge_color):
  layout horizontal, gap: medium, align: center:
    badge upper(alert.level), color: badge_color
    label alert.message
```

### Design Decisions & Igni Idioms Used:

*   **Counting by Field:** As the cheat sheet notes, `count()` is strictly for exact-value matching. Because we are matching specific fields inside objects, we compose `length(filter(alerts, a => a.level is ...))` to calculate the summary values.
*   **Default-then-Override for Conditionals:** Igni conditionals are statements, not expressions. Both `summary_color` and the `get_color` function initialize with a default fallback (`green`) and then reassign if higher severity conditions are met.
*   **Screen-Internal Function:** The `get_color()` function is defined entirely within the `Alerts` screen body, adhering to the rule that screen/component functions belong to their specific lexical scope. 
*   **Immutable Component Arguments:** `AlertRow` receives `alert` and `badge_color` explicitly. It handles the string manipulation via the `upper()` builtin internally but delegates the colour logic back to the caller context, fulfilling the requirement while keeping the component strictly presentational.