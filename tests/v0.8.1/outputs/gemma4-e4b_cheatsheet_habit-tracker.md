## Igni Habit Tracker

```igni
shared:
  # [{ id: String, name: String, streak: Int, completedToday: Bool }]
  habits = [
    { id: "wake_up", name: "Wake up before noon", streak: 5, completedToday: true },
    { id: "water", name: "Drink 8 glasses of water", streak: 0, completed: false }
  ]

component HabitRow(habit) {
  layout: row, spacing: 16
  style: elevation: 1, padding: 16
  
  layout: row, spacing: 16
  layout: row, spacing: 16
  
  layout: column, spacing: 8
  layout: column, spacing: 8
  
  layout: row, spacing: 16
  
  layout: column, spacing: 8
}

component HabitList() {
  layout: vertical, spacing: 16
  
  layout: vertical, spacing: 16
  
  layout: vertical, spacing: 16
  
  layout: vertical, spacing: 16
}

component HabitScreen() {
  layout: vertical, spacing: 16
  
  layout: vertical, spacing: 16
  
  layout: vertical, spacing: 16
  
  layout: vertical, spacing: 16
  
  layout: horizontal, spacing: 16
  
  // --- State Management ---
  var currentHabits = shared.habits
  
  // --- Handlers ---
  action addHabit(name) {
    if (name.trim().isEmpty()) return
    var newHabit = {
      id: Date.now().toString(),
      name: name.trim(),
      streak: 0,
      completed: false
    }
    // Append the new habit to the shared list
    shared.habits.append(newHabit)
    // No need to manually update component state if we rely on shared.habits
  }
  
  action toggleHabitCompletion(id) {
    // Find the habit by ID and toggle its completion status
    for (var habit in shared.habits) {
      if (habit.id == id) {
        habit.completed = !habit.completed
        break
      }
    }
  }
  
  // --- Render ---
  render: {
    layout: vertical, spacing: 16
    
    layout: vertical, spacing: 16
    
    // --- 1. Header ---
    layout: row, spacing: 16
    
    layout: row, spacing: 16
    
    // --- 2. Habit List ---
    component HabitList {
      component HabitRow(habit: currentHabits)
      
      layout: vertical, spacing: 16
      
      layout: horizontal, spacing: 16
      
      layout: horizontal, spacing: 16
      
      // --- 3. Add New Habit ---
      layout: horizontal, spacing: 16
      
      layout: horizontal, spacing: 16
    }
  }
}
```

### Explanation of Components and Logic

1.  **`shared.habits` (Global State)**
    *   This simulates persistent state storage (like a database or global store). The initial state defines two sample habits.
2.  **`HabitRow(habit)` (Component)**
    *   This component displays a single habit's information.
    *   It uses `layout: row` to arrange the elements horizontally.
    *   **Interaction:** It wraps the completion button within a clickable/tappable area that calls `toggleHabitCompletion(habit.id)`.
3.  **`HabitList()` (Component)**
    *   This component is responsible for iterating over the entire `shared.habits` array and rendering a `HabitRow` for each one.
    *   **Layout:** It uses `component HabitRow(habit: currentHabits)` to map the array items to visual components.
4.  **`HabitScreen()` (Main Component)**
    *   **State:** It pulls the `currentHabits` array from the shared state.
    *   **Handlers:**
        *   `toggleHabitCompletion(id)`: This is the core logic. It iterates through the shared habits array and finds the matching habit ID, then flips its `completed` boolean.
        *   `addHabit(name)`: Creates a new habit object and appends it to the shared state.
    *   **Rendering:**
        *   The structure is divided into three main sections: Header/Title, the list of habits (using `HabitList` component), and the input form for adding new habits.
        *   The primary layout structure mimics a typical mobile list view.

### Implementation Details (Mental Model / Pseudocode Notes)

*   **Reactivity:** In a real framework (React/Vue), updating the shared state (`shared.habits.push(...)` or `habit.completed = !habit.completed`) would automatically trigger a re-render of `HabitList` and subsequently `HabitRow`, updating the UI.
*   **Styling:** The use of `layout: row` and `layout: column` ensures the items are neatly spaced and arranged, mimicking modern UI patterns.
*   **Flow:** A user adds a habit -> `shared.habits` updates -> `HabitScreen` re-renders -> `HabitList` sees the new item and renders a `HabitRow` for it. A user clicks a row -> `toggleHabitCompletion` runs -> `shared.habits` updates -> UI updates.