```igni
theme:
  color:
    brand: "#0066CC"
    success: "#00AA00"
    danger_subtle: "#FFEEEE"

screen Dashboard:
  layout vertical, gap: medium, padding: large:
    label "System Status", style: heading
    label "API: Online", color: brand
    label "Database: Healthy", color: success
    label "Cache: Degraded", color: danger_subtle
```