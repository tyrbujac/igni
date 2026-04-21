# Alert Dashboard

```igni
screen Alerts, title: "ALERTS":
  alerts = [
    {level: "critical", message: "Database connection lost"},
    {level: "warning", message: "High memory usage on node-3"},
    {level: "info", message: "Backup completed successfully"},
    {level: "critical", message: "Payment service unreachable"},
    {level: "warning", message: "SSL certificate expires in 7 days"}
  ]

  layout vertical, gap: medium, padding: large:
    label summary(), color: summary_color(), style: heading.small
    divider
    each alert in alerts:
      AlertRow alert, color: color_for(alert.level)

  color_for(level):
    result = green
    if level is "critical":
      result = danger
    else if level is "warning":
      result = orange
    return result

  critical_count():
    return length(filter(alerts, a => a.level is "critical"))

  warning_count():
    return length(filter(alerts, a => a.level is "warning"))

  info_count():
    return length(filter(alerts, a => a.level is "info"))

  summary():
    return round(critical_count(), 0) + " critical, " + round(warning_count(), 0) + " warnings, " + round(info_count(), 0) + " info"

  summary_color():
    result = green
    if critical_count() > 0:
      result = danger
    else if warning_count() > 0:
      result = orange
    return result

component AlertRow(alert, color):
  layout horizontal, gap: medium, align: center, padding: small:
    badge upper(alert.level), color: color
    label alert.message
```

## Design decisions

- **`color_for(level)` as the single source of truth.** Both the badge colours and the summary-line colour call this helper, so the mapping (critical → danger, warning → orange, info → green) lives in one place. The screen computes the colour and passes it to `AlertRow` as an argument — the component stays dumb, matching the requirement.

- **Counts via `length(filter(...))`.** The spec explicitly warns that `count(alerts, "critical")` returns 0 on a list of objects because `count` only matches whole values, not predicates. So each count is `length(filter(alerts, a => a.level is "..."))`.

- **`round(n, 0)` for number-to-string.** Igni has no string interpolation and `+` requires strings on both sides, so integer counts get stringified via `round(n, 0)` before concatenation.

- **`upper(alert.level)` at the render site.** The spec recommends storing strings in their natural form and converting at render time, so the stored `level` stays lowercase and the badge uppercases it when drawn.

- **Summary colour mirrors `color_for` but keyed on counts, not a single level.** It walks the severity ladder (`critical > 0` → danger, then `warning > 0` → orange, else green) using the same "default + override" pattern the spec shows for conditional values.

- **`AlertRow` takes the whole `alert` plus pre-computed `color`.** Passing the alert keeps the component cohesive (one argument describes one row's data); passing `color` separately honours the "don't recompute internally" rule.