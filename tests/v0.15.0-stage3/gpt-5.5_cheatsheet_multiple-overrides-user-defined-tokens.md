```igni
theme:
  color:
    brand: "#0066CC"
    success: "#00AA00"
    danger_subtle: "#FFEEEE"

screen StatusDashboard:
  layout vertical, gap: medium, padding: large:
    label "API: Operational", color: success
    label "Deploy: In progress", color: brand
    label "Billing: Needs attention", color: danger_subtle
```