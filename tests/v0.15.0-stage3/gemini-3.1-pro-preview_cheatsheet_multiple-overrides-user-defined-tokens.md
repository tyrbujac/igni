```igni
theme:
  color:
    brand: "#0066CC"
    success: "#00AA00"
    danger_subtle: "#FFEEEE"

screen Dashboard, title: "Status Dashboard":
  layout vertical, padding: large, gap: medium:
    label "Main System: Active", color: brand
    label "API: Healthy", color: success
    label "Queue: Degraded", color: danger_subtle
```