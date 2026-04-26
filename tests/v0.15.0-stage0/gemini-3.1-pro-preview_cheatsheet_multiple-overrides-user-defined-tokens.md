```igni
theme:
  color:
    brand: "#0066CC"
    success: "#00AA00"
    danger_subtle: "#FFEEEE"

screen Dashboard, title: "Status Dashboard":
  layout vertical, padding: large, gap: medium:
    label "Main System", color: brand, style: heading
    label "API Gateway: Online", color: success
    label "Database: High Load", color: danger_subtle
```