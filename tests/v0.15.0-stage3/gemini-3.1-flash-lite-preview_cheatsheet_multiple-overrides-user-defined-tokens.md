```igni
theme:
  color:
    brand: "#0066CC"
    success: "#00AA00"
    danger_subtle: "#FFEEEE"

screen Dashboard:
  layout vertical, padding: large, gap: medium:
    label "System Status", style: heading
    
    layout vertical, padding: medium, background: brand, rounded: medium:
      label "Connection: Stable", color: white
      
    layout vertical, padding: medium, background: success, rounded: medium:
      label "Database: Operational", color: white
      
    layout vertical, padding: medium, background: danger_subtle, rounded: medium:
      label "Security: Alert", color: black
```