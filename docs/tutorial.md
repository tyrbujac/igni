# Learn Igni

Build your first app in 10 steps. No programming experience needed.

Every step you save the file and see the result in the browser. Do this → see that.

---

## Step 1: Show text on screen

Type this into your `.igni` file:

```igni
screen Hello:
  label "Hello World"
```

Save it. You see **Hello World** in the browser.

**What does each part mean?**
- `screen Hello:` — This creates a page called "Hello." You can call it anything you like — try changing `Hello` to your own name! The colon `:` at the end means "here's what goes on this page."
- `label "Hello World"` — This puts text on the screen. The words inside the double quotes `" "` are what you see. Try changing the words inside the quotes to anything you want!

---

## Step 2: Show more text

```igni
screen Hello:
  label "Hello"
  label "Welcome to Igni"
```

Save. Both lines appear, one below the other. Things stack from top to bottom — just add more lines.

**What's new?**
- You can have as many `label` lines as you want. Each one shows text on the screen, and they appear in order from top to bottom.

---

## Step 3: Let someone type their name

```igni
screen Hello:
  name = ""

  input bind: name, placeholder: "What is your name?"
  label "Hello, " + name
```

Type your name into the text box. Watch the greeting update as you type!

**What does each part mean?**
- `name = ""` — This creates a box called `name`. The `""` means it starts empty (the two double quotes with nothing between them). Think of it like an empty container waiting to be filled.
- `input bind: name` — This puts a text box on the screen. `bind: name` means the text box is **connected** to the `name` box — whatever you type goes straight into the box.
- `placeholder: "What is your name?"` — This is the grey hint text you see before typing. Put your hint inside the double quotes.
- `label "Hello, " + name` — This shows text that **joins together** the word "Hello, " with whatever is in the `name` box. The `+` joins two pieces of text together.

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

Now you have two text boxes and two labels. Type your name and age — both labels update as you type.

**What's new?**
- You can have as many boxes as you want. Each one has a name (`name`, `age`) and a starting value (`""`).
- You can join more than two things with `+`. `"You are " + age + " years old"` sticks three pieces together.

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

When both text boxes are empty, nothing shows below them. Start typing your name — the greeting appears. Type your age — the second line appears.

**What does each part mean?**
- `if name is not empty:` — This checks: "is there anything in the `name` box?" If yes, do the indented line below. If no, skip it.
- The line below the `if` is indented (pushed to the right). That's how Igni knows it belongs to the `if`. Everything indented under the `if` only shows when the check passes.

---

## Step 6: Make a button

```igni
screen Counter:
  count = 0

  label count, style: heading
  button "Add one", on tap: count = count + 1
```

Tap the button. Watch the number go up!

**What does each part mean?**
- `count = 0` — A box called `count` that starts at zero. This time it holds a number, not text.
- `label count` — Shows whatever is in the `count` box on the screen. When count is 0, you see 0. When it changes to 1, the screen updates automatically.
- `style: heading` — Makes the text big. Put a comma after the main part, then add `style: heading`.
- `button "Add one"` — A button with the text "Add one" written on it. The text inside the double quotes is what appears on the button.
- `on tap: count = count + 1` — This is what happens when someone taps the button. It takes whatever number is in `count`, adds 1, and puts the result back in `count`. The screen updates automatically.

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

Three buttons in a row. Plus adds, minus subtracts, reset goes back to zero.

**What's new?**
- `layout horizontal:` — Puts things side by side in a row instead of stacking them. Everything indented under it goes in the row.
- `gap: small` — Adds a little space between the buttons so they don't squish together.

---

## Step 8: Use a function

When a button needs to do more than one thing, put the actions in a **function**:

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

**What does each part mean?**
- `add():` — This creates a function called "add." A function is a list of steps with a name. The parentheses `()` and colon `:` are always there.
- `on tap: add()` — When the button is tapped, run the `add` function. The parentheses `()` mean "do it."
- Inside the function, each line is one step. `add()` does two things: increases the count AND changes the message. You can have as many steps as you want.
- Functions go at the bottom of the screen, after the layout.

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

**What's new?**
- `layout vertical, gap: medium, padding: large:` — Stacks things from top to bottom with nice spacing. `gap: medium` puts space between each thing. `padding: large` adds space around the edges of the screen.
- `else:` — This is the "otherwise" part of an `if`. If the name IS empty, show "Type your name above" instead. It's like saying: "if this is true, do this. Otherwise, do that."

Without `layout vertical:`, things just stack with no spacing. Add it when you want your app to look polished.

---

## Step 10: Build a dice roller

You know enough. Let's build something real!

```igni
screen DiceRoller:
  result = 0
  rolled = false

  layout vertical, gap: medium, padding: large, align: center:
    label "Dice Roller", style: heading

    if rolled:
      label "You rolled:"
      label result, style: heading
    else:
      label "Tap Roll to start!"

    button "Roll", on tap: roll()

  roll():
    result = random(1, 6)
    rolled = true
```

Tap "Roll" and a number between 1 and 6 appears on screen. Tap again for a new number!

**What does each part mean?**
- `result = 0` — A box for the dice number, starts at 0.
- `rolled = false` — A box that remembers if you've rolled yet. `false` means "no, not yet." It becomes `true` after the first roll.
- `align: center` — Puts everything in the middle of the screen.
- `if rolled:` — If `rolled` is true (you've tapped the button), show the result. Otherwise show "Tap Roll to start!"
- `random(1, 6)` — Picks a random number between 1 and 6, like rolling a real dice.
- `rolled = true` — After rolling, remember that we've rolled so we show the number instead of "Tap Roll to start!"

That's a working dice roller — in 16 lines. You built an app!

---

## What you learned

| What you type | What it does |
| --- | --- |
| `screen Name:` | Creates a page |
| `label "text"` | Shows text on screen |
| `name = ""` | Creates a box (starts empty) |
| `count = 0` | Creates a box (starts at zero) |
| `input bind: name` | A text box connected to a box |
| `"text" + name` | Joins things together |
| `if` / `else` | Makes a decision |
| `button "text", on tap:` | A button that does something when tapped |
| `layout horizontal:` | Puts things side by side |
| `layout vertical, gap:, padding:` | Adds spacing and padding |
| `function_name():` | A named list of steps |
| `random(1, 6)` | Picks a random number |

That's Igni. Simple text that makes real apps.
