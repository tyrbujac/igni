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
  label "My name is Tyr"
```

Save. Both lines appear, top to bottom. Things stack vertically by default — just add more lines.

---

## Step 3: Use a box to store something

A **variable** is a box. You give it a name and put something inside.

```igni
screen Hello:
  name = "Tyr"

  label name
```

`name = "Tyr"` — a box called `name` with "Tyr" inside. `label name` — show what's in the box.

---

## Step 4: Join things together

Use `+` to join text together:

```igni
screen Hello:
  name = "Tyr"
  age = 21

  label "Hello, " + name
  label "I am " + age + " years old"
```

`+` sticks text together. Numbers get turned into text automatically.

---

## Step 5: Make a decision

```igni
screen Hello:
  age = 21

  if age >= 18:
    label "You are an adult"
  else:
    label "You are a child"
```

Save and see "You are an adult." Change `age = 10`, save again — now it says "You are a child." The app makes decisions based on what's in the box.

---

## Step 6: Make a button

```igni
screen Counter:
  count = 0

  label count, style: heading
  button "Add one", on tap: count = count + 1
```

`count = 0` — a box starting at zero. `label count` — show the number. `button "Add one"` — when you tap it, the number goes up by 1. The screen updates automatically.

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

`layout horizontal:` puts things side by side in a row. `gap: small` adds a little space between them.

---

## Step 8: Let someone type

```igni
screen Greeter:
  name = ""

  input bind: name, placeholder: "Type your name"
  label "Hello, " + name
```

`input bind: name` — a text box connected to the `name` variable. Whatever you type goes into the box, and the label updates instantly. `bind` means "connected."

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

`layout vertical, gap: medium, padding: large:` — stack things with spacing between them and padding around the edges. `style: heading` makes text big. `if name is not empty:` — only show the greeting when they've typed something.

---

## Step 10: Build a dice roller

You know enough. Let's build something real.

```igni
screen DiceRoller:
  result = 1

  layout vertical, gap: medium, padding: large, align: center:
    label "Dice Roller", style: heading
    label result, style: heading
    button "Roll", on tap: roll()

  roll():
    result = random(1, 6)
```

`random(1, 6)` picks a number between 1 and 6. Tap "Roll" and the number changes. That's a working dice roller — in 10 lines.

`roll()` is a **function** — a named action. `on tap: roll()` means "when tapped, do the roll action." Functions go at the bottom of the screen.

---

## What you learned

1. `screen Name:` — creates a page
2. `label "text"` — shows text
3. `name = "value"` — a box that holds something
4. `"text" + name` — joins things together
5. `if`/`else` — makes decisions
6. `button "text", on tap:` — does something when tapped
7. `layout horizontal:` — puts things side by side
8. `input bind: name` — lets someone type
9. `layout vertical, gap:, padding:` — spacing and padding
10. `random(1, 6)` — picks a random number
11. `function_name():` — a named action

That's Igni. Simple text that makes real apps.
