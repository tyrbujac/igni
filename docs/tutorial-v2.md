# Learn Igni

Build your first app, one small step at a time. No programming experience needed.

Every step: save the file (**Cmd+S** on Mac, **Ctrl+S** on Windows) and see the result in the browser. Do this → see that.

**If something goes wrong:** if you see red text in the terminal, don't panic — check your spelling and spacing, then save again. Igni cares about two things: the exact letters you type, and how far each line is indented.

---

## Before you start

> **Already set up?** If `igni run` is running and you have an empty `app.igni` open in your editor, you can skip to [Step 1](#step-1-show-text-on-screen).

You'll use three things on your computer:

1. **A text editor** — for writing your code. [Cursor](https://cursor.com) is free and works well.
2. **A terminal** — a window where you type commands to the computer.
   - **Mac:** press **Cmd+Space**, type `Terminal`, press Enter.
   - **Windows:** press the **Windows key**, type `Terminal`, press Enter.
3. **Chrome** — the browser your app will appear in. Already on most computers.

This tutorial assumes Igni is already set up on your computer. If you're not sure, ask the person who gave you the machine.

### Make a new app

In the terminal, type this and press Enter:

```bash
igni new learn-igni
```

This creates a new folder called `learn-igni` with a starter app inside. **Check it worked:** you should see the `learn-igni` folder appear in your file list. If you don't, look for red text in the terminal and ask someone for help.

Now go into the folder and run it:

```bash
cd learn-igni
igni run
```

After a few seconds, a browser window opens showing a counter. Tap **Add** — the number goes up. That's an Igni app running.

**Leave the terminal window open** the whole time you're doing the tutorial. Every time you save your code, the browser updates automatically. If you close the terminal, the app stops.

### Open the file you'll be editing

In Cursor: **File → Open Folder**, pick the `learn-igni` folder. On the left you'll see a file called `app.igni` — click it. That's where you'll write your code.

You'll see the starter counter code already in there. **Select everything and delete it** so the file is empty. Now you're ready for Step 1.

---

## Step 1: Show text on screen

Type this into your `.igni` file:

```igni
screen Hello:
  label "Hello World"
```

Save it. You see **Hello World** in the browser — small, tucked into the top-left corner, no spacing around it. That's fine. We'll add layout and styling later. The win here is: you got text on the screen.

**What does each part mean?**

- `screen Hello:` — this creates a page called "Hello." You can call it anything you like. The colon `:` at the end means "here's what goes on this page."
- `label "Hello World"` — this puts text on the screen. The words inside the double quotes `" "` are what you see.

**Two pieces, not one.** `screen` makes the page; `label` puts text on it. Every Igni app starts with a `screen`, and a screen can hold labels, buttons, text boxes, and more. You'll add more pieces as you go.

---

## Step 2: Change the text

```igni
screen Hello:
  label "Welcome to my app!"
```

Change the words inside the double quotes to anything you want. Save. The browser updates instantly.

**What's happening?**

- Whatever you put inside the double quotes is what you see on the screen. Try your name, a favourite saying, a joke — anything.
- The double quotes `" "` matter: they tell Igni "show these exact letters." You'll see *why* quotes matter in Step 4.

**Try this:** edit the text a few different times, saving after each edit. Watch the browser refresh each time.

---

## Step 3: Show more text

```igni
screen Hello:
  label "Hello"
  label "Welcome to Igni"
```

Save. Both lines appear, one below the other. Things stack from top to bottom — just add more lines.

**What's new?**

- You can have as many `label` lines as you want. Each one shows text on the screen, and they appear in order from top to bottom.

---

## Step 4: Put something in a box

```igni
screen Hello:
  name = "Sam"

  label name
```

You see **Sam** on the screen.

**What's new?**

- `name = "Sam"` — this creates a **box** called `name` and puts "Sam" inside it. The equals sign `=` means "put this into this box."
- `label name` — no quotes around `name`, so Igni looks inside the box and shows what's there. That's why you see **Sam**, not the word "name."

**Quotes matter.** These two lines look almost the same but do completely different things:

```igni
label "name"
label name
```

- `label "name"` — the quotes mean "show these exact letters." You'd see the word **name** on the screen.
- `label name` — no quotes means "show whatever is in the box called `name`." You see **Sam**.

Quotes mean "literal text." No quotes means "the thing stored under this name." You'll use both all the time.

---

## Step 5: Join things together

```igni
screen Hello:
  name = "Sam"
  age = 30

  label "Hello, " + name
  label "I am " + age + " years old"
```

You see **Hello, Sam** and **I am 30 years old**.

**What's new?**

- `+` joins pieces of text together. `"Hello, " + name` sticks "Hello, " and whatever is in the `name` box together.
- `age = 30` — this box holds a number, not text. Notice no quotes around `30` — quoted `"30"` would be the text "30", unquoted `30` is the number thirty. Igni treats them differently.
- You can join more than two things: `"I am " + age + " years old"` sticks three pieces together.

---

## Step 6: Make it yours

See the `"Sam"` and the `30` in your code? Change them to your own real name and age.

For example, if your name is Alex and you're 42, your code would look like this:

```igni
screen Hello:
  name = "Alex"
  age = 42

  label "Hello, " + name
  label "I am " + age + " years old"
```

Now do the same — but with **your own** name and age (not "Alex" and not "Sam"). Save. The screen updates with your details.

That's the first thing you've changed yourself. Everything else in this tutorial works the same way: edit a value, save, see the change.

---

## Step 7: Make a decision

Sometimes you want the app to do one thing in one situation and something else in another. That's what `if` and `else` are for:

```igni
screen Hello:
  name = "Alex"

  label "Hello, " + name

  if name is "Alex":
    label "Welcome back!"
  else:
    label "Nice to meet you"
```

Because the `name` box holds "Alex", you see **Welcome back!** Now change `name = "Alex"` to `name = "Taylor"` and save. The message switches to **Nice to meet you**.

**What does each part mean?**

- `if name is "Alex":` — asks: "does the `name` box contain Alex?" The colon at the end means "here's what to do if yes."
- `else:` — means "otherwise." If the answer was no, do this instead.
- The lines below `if` and `else` are **indented** (pushed to the right). That's how Igni knows they belong to the `if` or the `else`.
- `is` means "is the same as." Careful: a single `=` *puts something in a box*. `is` *asks if two things are the same*. They look similar, they do completely different jobs.

**Try this:** Change `"Alex"` in the `if` line to a different name. Save. Change the `name` box to match. Watch the greeting flip.

---

## Step 8: Bigger, smaller, equal

`is` asks "is this the same as that?" But sometimes you want to ask a different question — "is this **bigger** than that?" or "is this **smaller** than that?" Igni uses the same symbols you learned in maths class:

- `age > 18` — "is age bigger than 18?"
- `age < 18` — "is age smaller than 18?"
- `age >= 18` — "is age 18 or bigger?"
- `age <= 18` — "is age 18 or smaller?"

Let's use `>=` to decide if someone is an adult:

```igni
screen Hello:
  name = "Alex"
  age = 42

  label "Hello, " + name

  if age >= 18:
    label "You are an adult"
  else:
    label "You are a child"
```

You see **You are an adult**. Now change `age = 42` to `age = 10`. Save. It switches to **You are a child**.

**Try this:** Change the age to different numbers — 17, 18, 19, 5 — and save each time. Watch the text flip.

---

## Step 9: Make a button

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

**Try this:** change `+ 1` to `+ 2`. Save. The counter jumps by two each tap.

---

## Step 10: Let someone type

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

**Try this:** change the `placeholder` text to a different question — "Who are you?" or "Enter your nickname." Save and watch the grey hint update.

---

## Step 11: Checkpoint — combine what you know

Let's put Steps 7 and 10 together. A text box that greets you — but politely asks for your name when you haven't typed anything yet.

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

**Try this:** change "Type your name above" to a friendlier message like "Who am I talking to?" Save. Type in the text box. Watch both labels respond to your typing in real time.

---

## Step 12: More buttons side by side

Related actions are easier to use when they sit next to each other. Three buttons stacked vertically would waste screen space and make the reader's eyes travel farther. A **row** keeps related buttons together.

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

**Try this:** add a fourth button labelled "+10" that adds ten to the count in one tap. Make sure it sits in the same row as the others.

---

## Step 13: Use a function

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

**Try this:** add a function `boost()` that adds 5 to `count` and sets `message = "Big jump!"`. Then add a "Boost" button in the same row that runs it.

---

## Step 14: True and false

One more thing before we build something real. You've worked with text ("Alex") and numbers (42). There's a third kind of thing: **yes-or-no values**, called `true` and `false`.

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

You'll use this in the very next step — the dice roller needs a `rolled = false` box to track whether the player has tapped Roll yet, so the screen can say "Tap Roll to start!" before the first roll and "You rolled: 4" afterward.

**Try this:** change `rolled = false` to `rolled = true` in the snippet above and save. Watch the message flip from "Not yet" to "You rolled!" — without touching anything else on the page.

---

## Step 15: Build a dice roller

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
- `rolled = false` — the true-or-false box from Step 14. Starts as `false`.
- `layout vertical, gap: medium, padding: large, align: center:` — stacks things from top to bottom, with spacing between them (`gap`), space around the edges (`padding`), and everything centred (`align: center`).
- `if rolled:` — if `rolled` is `true` (you've tapped the button), show the result. Otherwise show "Tap Roll to start!"
- `random(1, 6)` — picks a random number between 1 and 6, like rolling a real dice.
- `rolled = true` — after rolling, flip the box to `true` so we show the number next time.

That's a working dice roller — in 16 lines. You built an app!

**Try this:** change `random(1, 6)` to `random(1, 20)` — you've got a D20 for tabletop games. Or try `random(1, 100)` for a "guess my number" game.

---

## What you learned

| What you type | What it does |
| --- | --- |
| `screen Name:` | Creates a page |
| `label "text"` | Shows text on screen |
| `label name` | Shows whatever is in the `name` box |
| `name = "Alex"` | Creates a box with text inside |
| `count = 0` | Creates a box with a number inside |
| `rolled = false` | Creates a box with true or false inside |
| `"text" + name` | Joins things together |
| `age >= 18`, `name is "Alex"` | Asks a question |
| `if condition:` | Does something only if the check is true |
| `else:` | Does something if the check was false |
| `button "text", on tap:` | A button that does something when tapped |
| `input bind: name` | A text box connected to a box |
| `layout horizontal:` | Puts things side by side |
| `layout vertical, gap:, padding:` | Stacks things with spacing |
| `function_name():` | A named list of steps |
| `random(1, 6)` | Picks a random number |

That's Igni. Simple text that makes real apps.
