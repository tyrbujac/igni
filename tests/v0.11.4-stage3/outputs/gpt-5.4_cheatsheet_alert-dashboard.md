```igni
component AlertRow(level, message, color):
  layout horizontal, gap: medium, align: center:
    badge upper(level), color: color
    label message

screen Alerts, title: "ALERTS":
  alerts = [
    {level: "critical", message: "Database connection lost"},
    {level: "warning", message: "API latency is elevated"},
    {level: "info", message: "Nightly backup completed"},
    {level: "critical", message: "Payment service unavailable"},
    {level: "warning", message: "Disk usage above 80%"}
  ]

  critical_count = length(filter(alerts, alert => alert.level is "critical"))
  warning_count = length(filter(alerts, alert => alert.level is "warning"))
  info_count = length(filter(alerts, alert => alert.level is "info"))

  summary_color = green
  if critical_count > 0:
    summary_color = danger
  else if warning_count > 0:
    summary_color = orange

  layout vertical, gap: medium, padding: large:
    label critical_count + " critical, " + warning_count + " warnings, " + info_count + " info", color: summary_color

    each alert in alerts:
      AlertRow alert.level, message: alert.message, color: level_color(alert.level)

  level_color(level):
    if level is "critical":
      return danger
    else if level is "warning":
      return orange
    return green
```

Design decisions:
- `AlertRow` is reusable and receives `color` as an argument, per your requirement.
- The screen-level `level_color(level)` function is the single place that maps severity to colour.
- I used `upper(level)` for the badge text so the displayed labels are `CRITICAL`, `WARNING`, and `INFO`.
- Counts use `length(filter(...))` because the alerts are objects, and the spec says field-based counting should be done that way.
- The summary colour follows the highest-severity-present rule by checking critical first, then warning, otherwise green.