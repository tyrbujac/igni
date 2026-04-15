# Learn Igni

Build your first app, one small step at a time. No programming experience needed.

Every step: save the file (**Cmd+S** on Mac, **Ctrl+S** on Windows) and see the result in the browser. Do this → see that.

**If something goes wrong:** if you see red text in the terminal, don't panic — check your spelling and spacing, then save again. Igni cares about two things: the exact letters you type, and how far each line is indented.

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

## Step 3: Quotes vs names

Before we go further, here's something important. These two lines look almost the same but do very different things:

```igni
label "name"
label name
```

- `label "name"` — the quotes mean "show the exact letters inside." This puts the word **name** on the screen.
- `label name` — no quotes means "show whatever is stored in the box called `name`." This puts the *contents* of the box on the screen.

Quotes are how Igni knows "this is literal text" versus "this is a name that points to something." You'll use both all the time.

We haven't made a box yet. That's Step 4.

---

## Step 4: Store something in a box

```igni
screen Hello:
  name = "Tyr"

  label name
  label "Welcome to Igni"
```

You see **Tyr** on the screen, then "Welcome to Igni" below it.

**What does each part mean?**
- `name = "Tyr"` — This creates a **box** called `name` and puts "Tyr" inside it. The equals sign `=` means "put this thing into this box."
- `label name` — No quotes, so Igni looks inside the `name` box and shows what's there. If you wrote `label "name"` instead, you'd see the word **name** — remember Step 3.

**Try this:** Change `"Tyr"` to your own name. Save. The screen updates.

---

## Step 5: Join things together

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
- `age = 21` — This box holds a number, not text. Notice no quotes around `21` — quoted `"21"` would be the text "21", unquoted `21` is the number twenty-one. Igni treats them differently.
- You can join more than two things: `"I am " + age + " years old"` sticks three pieces together.

**Try this:** Change the name and age to your own. Save and see.

---

## Step 6: Compare things

Before we make decisions, you need a way to ask questions. Igni has two kinds:

**For numbers — how they compare:**
- `age > 18` — "is age greater than 18?"
- `age < 18` — "is age less than 18?"
- `age >= 18` — "is age 18 or more?"
- `age <= 18` — "is age 18 or less?"

**For anything — are two things the same?**
- `name is "Tyr"` — "is the name 'Tyr'?"
- `name is not "Tyr"` — "is the name *not* 'Tyr'?"

Watch out: one equals sign `=` *puts something in a box*. To *check* if things are the same, use `is`. They look similar; they do completely different jobs.

```igni
age = 18       # put 18 into the age box
age is 18      # ask: is age equal to 18?
```

You won't see these do anything on their own — they need an `if` to be useful. That's next.

---

## Step 7: Make a decision

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
- `if age >= 18:` — asks the question from Step 6. If the answer is yes, do the indented line below.
- `else:` — means "otherwise." If the question's answer was no, do this instead.
- The lines below `if` and `else` are **indented** (pushed to the right). That's how Igni knows they belong to the `if` or `else`.

**Try this:** Change the age to different numbers and save each time. Watch the text change.

---

## Step 8: Make a button

```igni
screen Counter:
  count = 0

  label count, style: heading
  button "Add one", on tap: count = count + 1
```

Tap the button. Watch the number go up!

**What does each part mean?**
- `count = 0` — a box called `count` that starts at zero.
- `label count` — shows whatever number is in the `count` box on the screen. When count changes, the screen updates automatically.
- `style: heading` — makes the text big. Put a comma after the main part, then add `style: heading`.
- `button "Add one"` — a button with the text "Add one" written on it. The text inside the double quotes is what appears on the button.
- `on tap: count = count + 1` — when someone taps the button, it takes whatever number is in `count`, adds 1, and puts the result back. The screen updates by itself.

---

## Step 9: Let someone type

```igni
screen Greeter:
  name = ""

  input bind: name, placeholder: "What is your name?"
  label "Hello, " + name
```

Type your name into the text box. Watch the greeting update as you type!

**What does each part mean?**
- `name = ""` — a box called `name` that starts empty. The `""` (two double quotes with nothing between them) means "nothing inside yet."
- `input bind: name` — puts a text box on the screen. `bind: name` means the text box is **connected** to the `name` box — whatever you type goes straight in.
- `placeholder: "What is your name?"` — the grey hint text you see before typing. Put your hint inside the double quotes.

---

## Step 10: Checkpoint — combine what you know

Let's put Steps 7 and 9 together. A text box that greets you — but politely asks for your name when you haven't typed anything yet.

```igni
screen Greeter:
  name = ""

  input bind: name, placeholder: "What is your name?"

  if name is empty:
    label "Type your name above"
  else:
    label "Hello, " + name
```

When you open the page, you see "Type your name above." Start typing — the hint disappears and is replaced by "Hello, [your name]."

**What's happening?**
- The input writes into the `name` box as you type.
- `if name is empty` checks: "is the name box still empty?" `is empty` is a shortcut Igni has for "has no content yet" — handy for boxes that start as `""`.
- The screen re-decides which label to show every time `name` changes.

No extra glue, no wiring. If a box changes and a screen uses it, the screen updates itself.

---

## Step 11: More buttons side by side

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
- `layout horizontal:` — puts things side by side in a row instead of stacking them. Everything indented under it goes in the row.
- `gap: small` — adds a little space between the buttons so they don't squish together.

---

## Step 12: Use a function

A **function** is a named list of steps. You reach for one when:

- The same sequence of steps would appear in two different buttons, **or**
- A single button does several things and you want to give that combination a name.

Our button is about to do two things: add to the count *and* change a message. That's reason number two.

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
- `add():` — this creates a function called "add." The parentheses `()` and colon `:` are always there.
- `on tap: add()` — when the button is tapped, run all the steps inside the `add` function.
- Inside the function, each line is one step. `add()` does two things: increases the count AND changes the message.
- Functions go at the bottom of the screen, after all the labels and buttons.

---

## Step 13: True and false

One more thing before we build something real. You've worked with text ("Tyr") and numbers (21). There's a third kind of thing: **yes-or-no values**, called `true` and `false`.

```igni
rolled = false     # no, not yet
rolled = true      # yes, it happened
```

Boxes holding `true` or `false` are useful with `if`. Unlike numbers, you don't need a comparison — you just ask the box directly:

```igni
if rolled:
  label "You rolled!"
else:
  label "Not yet"
```

`if rolled:` reads as "if rolled is true." No `is true` needed; the box itself is the answer.

Now we're ready for the dice roller.

---

## Step 14: Build a dice roller

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
- `result = 0` — a box for the dice number, starts at 0.
- `rolled = false` — the true-or-false box from Step 13. Starts as `false`.
- `layout vertical, gap: medium, padding: large, align: center:` — stacks things from top to bottom, with spacing between them (`gap`), space around the edges (`padding`), and everything centred (`align: center`).
- `if rolled:` — if `rolled` is `true` (you've tapped the button), show the result. Otherwise show "Tap Roll to start!"
- `random(1, 6)` — picks a random number between 1 and 6, like rolling a real dice.
- `rolled = true` — after rolling, flip the box to `true` so we show the number next time.

That's a working dice roller — in 16 lines. You built an app!

---

## What you learned

| What you type | What it does |
| --- | --- |
| `screen Name:` | Creates a page |
| `label "text"` | Shows text on screen |
| `label name` | Shows whatever is in the `name` box |
| `name = "Tyr"` | Creates a box with text inside |
| `count = 0` | Creates a box with a number inside |
| `rolled = false` | Creates a box with true or false inside |
| `"text" + name` | Joins things together |
| `age >= 18`, `name is "Tyr"` | Asks a question |
| `if condition:` | Does something only if the check is true |
| `else:` | Does something if the check was false |
| `button "text", on tap:` | A button that does something when tapped |
| `input bind: name` | A text box connected to a box |
| `layout horizontal:` | Puts things side by side |
| `layout vertical, gap:, padding:` | Stacks things with spacing |
| `function_name():` | A named list of steps |
| `random(1, 6)` | Picks a random number |

That's Igni. Simple text that makes real apps.
