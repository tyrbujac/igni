```igni
screen Tasks, title: "Tasks":
  tasks = [
    {name: "Buy milk", done: false, priority: "high"},
    {name: "Call Mom", done: false, priority: "high"},
    {name: "Read book", done: true, priority: "medium"},
    {name: "Gym", done: false, priority: "medium"},
    {name: "Clean room", done: false, priority: "low"},
    {name: "Pay bills", done: true, priority: "low"}
  ]

  # Breakdown counts
  high_count = count(tasks, item => item.priority is "high")
  med_count  = count(tasks, item => item.priority is "medium")
  low_count  = count(tasks, item => item.priority is "low")

  layout vertical, padding: large, gap: medium:
    label high_count + " high, " + med_count + " medium, " + low_count + " low"
    
    divider
    
    each task in tasks:
      layout horizontal, align: center, gap: medium:
        checkbox bind: task.done
        label task.name

  # Note: The checkbox bind: task.done works because the 
  # checkbox primitive handles the object identity update 
  # internally when the state is toggled.
```

### Design Decisions:

*   **State Initialization:** The list is initialized directly in the screen body. Because Igni uses lexical reactivity, calculating the `high_count`, `med_count`, and `low_count` as local variables at the top of the screen ensures they are automatically recalculated every time a checkbox is toggled and the screen re-renders.
*   **Reactivity:** By binding the checkbox to `task.done`, we leverage Igni's automatic re-render trigger. When a user checks a box, the screen state updates, the screen re-evaluates from the top, and the summary labels refresh with the new counts.
*   **Layout:** I used a vertical layout for the main body to stack the summary and the list, and a horizontal layout for each row to keep the `checkbox` and `label` aligned side-by-side.
*   **Simplicity:** No custom functions were needed for this implementation, keeping the code strictly focused on declarative UI construction as per the Igni philosophy.