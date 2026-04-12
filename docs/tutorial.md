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

## Step 3: Store something in a box

```igni
screen Hello:
  name = "Tyr"

  label name
  label "Welcome to Igni"
```

You see **Tyr** on the screen, then "Welcome to Igni" below it.

**What does each part mean?**
- `name = "Tyr"` — This creates a **box** called `name` and puts "Tyr" inside it. Change "Tyr" to your own name inside the double quotes!
- `label name` — This shows whatever is in the `name` box. Notice there are no double quotes around `name` — that's how Igni knows you mean "show what's in the box" instead of showing the word "name."

**Try this:** Change `"Tyr"` to your own name. Save. The screen updates.

---

## Step 4: Join things together

```igni
screen Hello:
  name = "Tyr"
  age = 21

  label "Hello, " + name
  label "I am " + age + " years old"
```

You see **Hello, Tyr** and **I am 21 years old**.

**What's new?**
- `+` joins pieces of text together. `"Hello, " + name` sticks "Hello, " and whatever is in the `name` box together.
- `age = 21` — This box holds a number, not text. Notice there are no double quotes around `21` — that's how Igni knows it's a number.
- You can join more than two things: `"I am " + age + " years old"` sticks three pieces together.

**Try this:** Change the name and age to your own. Save and see.

---

## Step 5: Make a decision

```igni
screen Hello:
  name = "Tyr"
  age = 21

  label "Hello, " + name

  if age >= 18:
    label "You are an adult"
  else:
    label "You are a child"
```

You see **You are an adult**. Now change `age = 21` to `age = 10`. Save. It changes to **You are a child**.

**What does each part mean?**
- `if age >= 18:` — This checks: "is the number in the `age` box 18 or bigger?" The `>=` means "greater than or equal to." If yes, do the indented line below.
- `else:` — This means "otherwise." If the check above was no, do this instead.
- The lines below `if` and `else` are **indented** (pushed to the right). That's how Igni knows they belong to the `if` or `else`.

**Try this:** Change the age to different numbers and save each time. Watch the text change.

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
- `count = 0` — A box called `count` that starts at zero.
- `label count` — Shows whatever number is in the `count` box on the screen. When count changes, the screen updates automatically.
- `style: heading` — Makes the text big. Put a comma after the main part, then add `style: heading`.
- `button "Add one"` — A button with the text "Add one" written on it. The text inside the double quotes is what appears on the button.
- `on tap: count = count + 1` — When someone taps the button, it takes whatever number is in `count`, adds 1, and puts the result back. The screen updates by itself.

---

## Step 7: Let someone type

```igni
screen Greeter:
  name = ""

  input bind: name, placeholder: "What is your name?"
  label "Hello, " + name
```

Type your name into the text box. Watch the greeting update as you type!

**What does each part mean?**
- `name = ""` — A box called `name` that starts empty. The `""` (two double quotes with nothing between them) means "nothing inside yet."
- `input bind: name` — Puts a text box on the screen. `bind: name` means the text box is **connected** to the `name` box — whatever you type goes straight in.
- `placeholder: "What is your name?"` — The grey hint text you see before typing. Put your hint inside the double quotes.

---

## Step 8: More buttons side by side

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

## Step 9: Use a function

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
- `add():` — This creates a function called "add." A function is a named list of steps. The parentheses `()` and colon `:` are always there.
- `on tap: add()` — When the button is tapped, run all the steps inside the `add` function.
- Inside the function, each line is one step. `add()` does two things: increases the count AND changes the message.
- Functions go at the bottom, after all the labels and buttons.

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
- `rolled = false` — A box that remembers if you've rolled yet. `false` means "no, not yet."
- `layout vertical, gap: medium, padding: large, align: center:` — Stacks things from top to bottom, with spacing between them (`gap`), space around the edges (`padding`), and everything centred (`align: center`).
- `if rolled:` — If `rolled` is `true` (you've tapped the button), show the result. Otherwise show "Tap Roll to start!"
- `random(1, 6)` — Picks a random number between 1 and 6, like rolling a real dice.
- `rolled = true` — After rolling, changes the box to `true` so we show the number next time.

That's a working dice roller — in 16 lines. You built an app!

---

## What you learned

| What you type | What it does |
| --- | --- |
| `screen Name:` | Creates a page |
| `label "text"` | Shows text on screen |
| `name = "Tyr"` | Creates a box with something inside |
| `count = 0` | Creates a box with a number inside |
| `"text" + name` | Joins things together |
| `if condition:` | Does something only if the check is true |
| `else:` | Does something if the check was false |
| `button "text", on tap:` | A button that does something when tapped |
| `input bind: name` | A text box connected to a box |
| `layout horizontal:` | Puts things side by side |
| `layout vertical, gap:, padding:` | Adds spacing and padding |
| `function_name():` | A named list of steps |
| `random(1, 6)` | Picks a random number |

That's Igni. Simple text that makes real apps.
