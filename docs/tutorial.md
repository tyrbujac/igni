# Learn Igni — Build a Calculator

This tutorial takes you from zero to a working calculator. No programming experience needed.

## Step 1: Your first screen

Every Igni app starts with a `screen`. A screen is a page — what the user sees.

```igni
screen Hello:
  label "Hello World"
```

That's it. Two lines. `screen Hello:` creates a page called Hello. `label "Hello World"` puts text on it.

**Try it:** Save this as `hello.igni`, transpile it, and run it. You should see "Hello World" in the browser.

## Step 2: Stack things vertically

To put multiple things on screen, use `layout vertical`:

```igni
screen Hello:
  layout vertical:
    label "Hello"
    label "World"
```

`layout vertical:` stacks everything below it top-to-bottom. The colon `:` means "here come the contents." Everything indented under it is inside the layout.

Add spacing with `gap:` and padding with `padding:`:

```igni
screen Hello:
  layout vertical, gap: medium, padding: large:
    label "Hello"
    label "World"
```

## Step 3: Put things side by side

Use `layout horizontal` for a row:

```igni
screen Hello:
  layout vertical, gap: medium, padding: large:
    label "Top"
    layout horizontal, gap: small:
      label "Left"
      label "Right"
    label "Bottom"
```

This gives you: "Top" on its own line, then "Left" and "Right" side by side, then "Bottom" below.

## Step 4: Buttons and actions

Buttons do something when tapped:

```igni
screen Counter:
  count = 0

  layout vertical, gap: medium, padding: large:
    label count, style: heading
    button "Add One", on tap: count = count + 1
```

`count = 0` creates a variable. `label count` shows its value. `button "Add One", on tap: count = count + 1` adds 1 every time you tap. The screen updates automatically — that's reactivity.

## Step 5: Multiple buttons

You can have as many buttons as you want:

```igni
screen Counter:
  count = 0

  layout vertical, gap: medium, padding: large:
    label count, style: heading
    layout horizontal, gap: small:
      button "+1", on tap: count = count + 1
      button "-1", on tap: count = count - 1
      button "Reset", on tap: count = 0
```

## Step 6: Functions

When an action is more than one line, put it in a function:

```igni
screen Counter:
  count = 0

  layout vertical, gap: medium, padding: large:
    label count, style: heading
    button "Add", on tap: add()

  add():
    count = count + 1
```

Functions go inside the screen, after the layout. They can read and change any variable in the screen.

## Step 7: Text input

Get text from the user with `input`:

```igni
screen Greeter:
  name = ""

  layout vertical, gap: medium, padding: large:
    input bind: name, placeholder: "Your name"
    label "Hello, " + name
```

`bind: name` connects the input to the variable — whatever the user types goes into `name`, and the label updates automatically.

## Step 8: Conditionals

Show different things based on conditions:

```igni
screen Greeter:
  name = ""

  layout vertical, gap: medium, padding: large:
    input bind: name, placeholder: "Your name"
    if name is not empty:
      label "Hello, " + name
    else:
      label "Type your name above"
```

## Now: Build the Calculator

You know enough. Here's the plan:

- **Variables:** `display` (what shows on screen), `first_number`, `operator`, `waiting` (are we waiting for the second number?)
- **Layout:** A `label` at the top showing the display, then rows of buttons
- **Each button:** `on tap:` calls a function that updates the display
- **Operators:** Store the first number and operator, then calculate when `=` is pressed

Start with this skeleton:

```igni
screen Calculator:
  display = "0"

  layout vertical, gap: small, padding: large:
    label display, style: heading

    layout horizontal, gap: small:
      button "7", on tap: press("7")
      button "8", on tap: press("8")
      button "9", on tap: press("9")

    layout horizontal, gap: small:
      button "4", on tap: press("4")
      button "5", on tap: press("5")
      button "6", on tap: press("6")

    layout horizontal, gap: small:
      button "1", on tap: press("1")
      button "2", on tap: press("2")
      button "3", on tap: press("3")

    layout horizontal, gap: small:
      button "0", on tap: press("0")
      button "=", on tap: calculate()
      button "C", on tap: clear()

  press(digit):
    if display is "0":
      display = digit
    else:
      display = display + digit

  clear():
    display = "0"

  calculate():
    display = "0"
```

Try this first. It won't do math yet — just digit entry, display, and clear. Get it running, then add the operators.

## Adding operators

Once the basic buttons work, add operator handling:

```igni
screen Calculator:
  display = "0"
  first = 0
  op = ""
  waiting = false

  # ... layout with number buttons as above ...

  # Add operator buttons to a row:
  # button "+", on tap: set_op("+")
  # button "-", on tap: set_op("-")

  press(digit):
    if waiting:
      display = digit
      waiting = false
    else if display is "0":
      display = digit
    else:
      display = display + digit

  set_op(operator):
    first = display
    op = operator
    waiting = true

  clear():
    display = "0"
    first = 0
    op = ""
    waiting = false

  # calculate() would need number parsing — Igni doesn't have
  # string-to-number conversion yet, so the display stays as text
```

**Note:** A full calculator with actual math needs string-to-number conversion, which Igni doesn't have yet. But you can build the UI, the button layout, and the state management — which is what the language is designed for.
