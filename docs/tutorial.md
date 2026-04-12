# Learn Igni

Build your first app in 10 steps. No programming experience needed.

Every step you save the file and see the result in the browser. Do this → see that.

---

## Step 1: Show text

```igni
screen Hello:
  label "Hello World"
```

Save this as a `.igni` file. Transpile it. You see "Hello World" in the browser. That's your first app.

`screen Hello:` creates a page. `label "Hello World"` puts text on it. The colon `:` means "here's what's inside."

---

## Step 2: Show more text

```igni
screen Hello:
  label "Hello"
  label "Welcome to Igni"
```

Save. Both lines appear, top to bottom. Things stack vertically by default — just add more lines.

---

## Step 3: Let someone type their name

```igni
screen Hello:
  name = ""

  input bind: name, placeholder: "What is your name?"
  label "Hello, " + name
```

`name = ""` — a box called `name`, starts empty. `input bind: name` — a text box connected to the box. Whatever you type goes into `name`, and the label updates instantly. `bind` means "connected."

Type your name. Watch it appear.

---

## Step 4: Add your age

```igni
screen Hello:
  name = ""
  age = ""

  input bind: name, placeholder: "What is your name?"
  input bind: age, placeholder: "How old are you?"
  label "Hello, " + name
  label "You are " + age + " years old"
```

`+` joins text together. Two inputs, two labels, all connected. Type your name and age — both labels update as you type.

---

## Step 5: Make a decision

```igni
screen Hello:
  name = ""
  age = ""

  input bind: name, placeholder: "What is your name?"
  input bind: age, placeholder: "How old are you?"

  if name is not empty:
    label "Hello, " + name
  if age is not empty:
    label "You are " + age + " years old"
```

`if name is not empty:` — only show the greeting when they've typed something. When both inputs are empty, nothing shows. Start typing and the text appears.

---

## Step 6: Make a button

```igni
screen Counter:
  count = 0

  label count, style: heading
  button "Add one", on tap: count = count + 1
```

`count = 0` — a box starting at zero. `label count` — show the number on screen. `button "Add one"` — when you tap it, the number goes up by 1. The screen updates automatically.

Tap the button. Watch the number go up.

---

## Step 7: More buttons side by side

```igni
screen Counter:
  count = 0

  label count, style: heading
  layout horizontal, gap: small:
    button "+1", on tap: count = count + 1
    button "-1", on tap: count = count - 1
    button "Reset", on tap: count = 0
```

`layout horizontal:` puts things side by side in a row. `gap: small` adds a little space between them. Three buttons, one row.

---

## Step 8: Use a function

When a button needs to do more than one thing, use a function:

```igni
screen Counter:
  count = 0
  message = ""

  label count, style: heading
  label message
  layout horizontal, gap: small:
    button "Add", on tap: add()
    button "Reset", on tap: reset()

  add():
    count = count + 1
    message = "Added!"

  reset():
    count = 0
    message = "Reset!"
```

`add():` is a function — a named action that can do multiple things. `on tap: add()` means "when tapped, do the add action." Functions go at the bottom of the screen.

---

## Step 9: Make it look nice

```igni
screen Greeter:
  name = ""

  layout vertical, gap: medium, padding: large:
    label "Greeter", style: heading
    input bind: name, placeholder: "Type your name"
    if name is not empty:
      label "Hello, " + name
    else:
      label "Type your name above"
```

`layout vertical, gap: medium, padding: large:` — stack things with spacing between them and padding around the edges. Use `layout vertical:` when you want to control spacing. Use `layout horizontal:` for rows. Without either, things just stack top to bottom.

---

## Step 10: Build a dice roller

You know enough. Let's build something real.

```igni
screen DiceRoller:
  result = 0
  rolled = false

  layout vertical, gap: medium, padding: large, align: center:
    label "Dice Roller", style: heading

    if rolled:
      label "You rolled:", style: body
      label result, style: heading
    else:
      label "Tap Roll to start!", style: body

    button "Roll", on tap: roll()

  roll():
    result = random(1, 6)
    rolled = true
```

`random(1, 6)` picks a number between 1 and 6. Tap "Roll" and the number appears on screen. Tap again for a new number. That's a working dice roller — in 14 lines.

---

## What you learned

1. `screen Name:` — creates a page
2. `label "text"` — shows text on screen
3. `name = ""` — a box that holds something
4. `input bind: name` — lets someone type, connected to a box
5. `"text" + name` — joins things together
6. `if`/`else` — makes decisions
7. `button "text", on tap:` — does something when tapped
8. `layout horizontal:` — puts things side by side
9. `function_name():` — a named action
10. `layout vertical, gap:, padding:` — spacing and padding
11. `random(1, 6)` — picks a random number

That's Igni. Simple text that makes real apps.
