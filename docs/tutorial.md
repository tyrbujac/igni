# Learn Igni

> Tutorial v2.5 · targets Igni v0.12.2

Build your first app, one small step at a time. No programming experience needed.

Every part: save the file (**Cmd+S** on Mac, **Ctrl+S** on Windows) and see the result in the browser.

**If something goes wrong:** check your spelling and indentation, then save again. If the browser doesn't change and the terminal shows red text, you've usually misspelled a name (for example `nam` instead of `name`). Fix it and save again.

---

## Before you start

> **Already set up?** If `igni run` is running and you have an empty `app.igni` open, skip to [Section 1](#section-1--hello-world).

You'll need:

1. **A text editor** — [Cursor](https://cursor.com) is free and works well.
2. **A terminal** — on Mac press **Cmd+Space**, type `Terminal`, press Enter. On Windows press the **Windows key**, type `Terminal`, press Enter.
3. **Chrome** — already on most computers.

In the terminal, type this and press Enter:

```bash
igni new learn-igni
cd learn-igni
igni run
```

A browser window opens showing a counter. Tap **Add** — the number goes up. Leave the terminal open; every save updates the browser. **Ctrl+C** stops the server when you're done.

**Prefer Safari, Firefox, or Arc?** Use `igni run localhost` — it prints a URL you can paste into any browser.

### Open the file

In Cursor: **File → Open Folder**, pick `learn-igni`. Click `app.igni` on the left. **Select everything and delete it** so the file is empty. You're ready.

---

## Section 1 — Hello World

### Part 1 — Show text on screen

Type this and save:

```igni
screen Hello:
  label "Hello World"
```

You see **Hello World** in the browser.

- `screen Hello:` creates a page called "Hello." The colon `:` means "here's what goes on this page."
- `label "Hello World"` shows text on the screen. The text inside the double quotes is what you see.

---

### Part 2 — Make it a heading

```igni
screen Hello:
  label "Welcome to my app!", style: heading
```

Save. The text is noticeably bigger. `style: heading` is what makes it big. Change the words in the quotes to anything you want — your name, a joke — and save again.

---

### Part 3 — Add a second line

```igni
screen Hello:
  label "Welcome to my app!", style: heading
  label "Made in Igni"
```

Both lines appear, one below the other. The first is big (because of `style: heading`), the second is normal size. Things stack top to bottom — add more lines whenever you want.

---

## Section 2 — About you

### Part 1 — Put something in a box

Make a box, put something in it, show what's inside:

```igni
screen Hello:
  name = "Sam"
  label name
```

Save. You see **Sam**.

- `name = "Sam"` makes a box called `name` and puts "Sam" inside.
- `label name` (no quotes) tells Igni to look **inside** the box and show what's there. That's why you see **Sam**, not the word "name".

A box with a name is called a **variable**.

Without the quotes, Igni looks inside the box. With quotes, it shows the letters literally:

```igni
label "name"
label name
```

`label "name"` shows the word **name**. `label name` shows **Sam**.

---

### Part 2 — Join things together

```igni
screen Hello:
  name = "Andy"
  age = 30

  label "Hi, I'm " + name
  label "I am " + age + " years old"
```

Save. You see **Hi, I'm Andy** and **I am 30 years old**.

- `+` joins pieces of text together.
- `age = 30` — no quotes around `30` because it's a number, not text.
- **Variables go at the top of the screen**, above the labels that use them.

---

### Part 3 — Make it yours

Clear out the placeholder values:

```igni
screen Hello:
  name = ""
  age = 0

  label "Hi, I'm " + name
  label "I am " + age + " years old"
```

Save — you'll see "Hi, I'm " and "I am 0 years old". That's the app without you in it.

Now put your name between the two quotes and change `0` to your age. Save. The screen greets you.

---

## Section 3 — Making decisions

Apps often show different things in different situations. That's what `if` and `else` are for.

### Part 1 — if and else

Start with `if` alone:

```igni
screen Hello:
  name = "Robin"

  if name is "Robin":
    label "Welcome back, Robin!"
```

You see **Welcome back, Robin!** Now change `name = "Robin"` to `name = "Taylor"` and save. **The label disappears entirely.** That's `if` on its own: show something when the check is true, show nothing when it's false.

Now add `else`:

```igni
screen Hello:
  name = "Robin"

  if name is "Robin":
    label "Welcome back, Robin!"
  else:
    label "Nice to meet you " + name
```

Flip `name` between "Robin" and "Taylor" and watch the message change.

- `if name is "Robin":` asks: "does `name` contain Robin?" The colon means "here's what to do if yes."
- `else:` means "otherwise."
- `is` asks if two things are the same. Careful: `=` puts something in a box; `is` asks if two things match.
- The lines below `if` and `else` are **indented** — that's how Igni knows they belong to the branch.

---

### Part 2 — Bigger, smaller, equal

Sometimes you want to compare sizes, not just exact matches. Igni uses the same symbols as maths:

- `age > 18` — "is age bigger than 18?"
- `age < 18` — "is age smaller than 18?"
- `age >= 18` — "is age 18 or bigger?"
- `age <= 18` — "is age 18 or smaller?"

Let's use `>=` to decide if someone is an adult:

```igni
screen Hello:
  age = 42

  # >= means "18 or bigger"
  if age >= 18:
    label "You are an adult"
  else:
    label "You are a child"
```

You see **You are an adult**. Change `age = 42` to `age = 10`. Save. It switches to **You are a child**.

A line starting with `#` is a **note** for you. Igni ignores it.

---

## Section 4 — Counter

### Part 1 — A counter with a button

```igni
screen Counter:
  count = 0

  label count, style: heading
  button "Add one", on tap: count = count + 1
```

Save, then tap the button. The number goes up!

- `count = 0` — a box that starts at zero.
- `label count` shows whatever number is in the `count` box.
- `button "Add one"` — the text in quotes is what appears on the button.
- `on tap: count = count + 1` — when tapped, take `count`, add 1, put the result back.

Change `+ 1` to `+ 2` and save. Now the counter jumps by two each tap.

---

### Part 2 — A second button, side by side

```igni
screen Counter:
  count = 0

  layout horizontal, gap: small:
    button "Add one", on tap: count = count + 1
    # this button takes the count down
    button "Remove one", on tap: count = count - 1

  label count, style: heading
```

Two buttons in a row, with the number below them.

- `layout horizontal:` puts things side by side instead of stacking them. Everything indented under it goes in the row.
- `gap: small` adds space between the buttons.

**Try this:** add a third button labelled "+10" that adds ten to the count. Keep it in the same row.

---

### Part 3 — Make it look nice with layout vertical

`layout horizontal:` puts things in a row. `layout vertical:` stacks them top-to-bottom — with modifiers to control spacing and alignment:

```igni
screen Counter:
  count = 0

  layout vertical, gap: medium, padding: large, align: center:
    label count, style: heading
    layout horizontal, gap: small:
      button "Add one", on tap: count = count + 1
      button "Remove one", on tap: count = count - 1
```

Save. Same counter, centred on the page with breathing room.

- `gap: medium` — space between the label and the row.
- `padding: large` — space around the whole thing.
- `align: center` — centres everything horizontally.

---

## Section 5 — Greeter

### Part 1 — Let someone type

```igni
screen Greeter:
  name = ""

  input bind: name, placeholder: "What is your name?"
```

Type your name into the text box. You see your letters appear as you type, but nothing else happens yet.

- `name = ""` — a box that starts empty.
- `input bind: name` — a text box connected to the `name` box. Whatever you type goes in.
- `placeholder: "..."` — the grey hint text shown before you type.

---

### Part 2 — Greet them back

```igni
screen Greeter:
  name = ""

  input bind: name, placeholder: "What is your name?"
  label "Hello, " + name
```

Type your name. The greeting updates letter by letter as you type.

---

### Part 3 — Checkpoint

Put Section 3 and this section together. A text box that greets you, or asks for your name if you haven't typed one:

```igni
screen Greeter:
  name = ""

  layout vertical, gap: large:
    input bind: name, placeholder: "What is your name?"

    if name is empty:
      label "Type your name above"
    else:
      label "Hello, " + name
```

When you open the page, you see "Type your name above." Start typing — the hint is replaced with "Hello, [your name]."

`is empty` is a shortcut for "has no content yet" — handy for boxes that start as `""`.

---

## Section 6 — ScoreBoard

A **function** is a named list of steps. Reach for one when a button does several things and you want to name that combination.

### Part 1 — Set up the screen

```igni
screen ScoreBoard:
  score = 0
  message = ""

  label score, style: heading
  label message
```

Save. You see a big **0** and nothing beneath it (because `message` is empty). No buttons yet; we'll add them next.

---

### Part 2 — Win button

```igni
screen ScoreBoard:
  score = 0
  message = ""

  label score, style: heading
  label message
  layout horizontal, gap: small:
    button "Win", on tap: win()

  win():
    score = score + 1
    message = "Nice one!"
```

Tap **Win** — the score goes up and "Nice one!" appears. One tap, two things happen.

- `win():` creates a function called "win." The parentheses and colon always come together. Functions go at the bottom of the screen.
- `on tap: win()` — when tapped, run every step inside `win`.
- `layout horizontal, gap: small:` — we set up the row now so we can add a second button without rearranging.

---

### Part 3 — Lose button

```igni
screen ScoreBoard:
  score = 0
  message = ""

  label score, style: heading
  label message
  layout horizontal, gap: small:
    button "Win", on tap: win()
    button "Lose", on tap: lose()

  win():
    score = score + 1
    message = "Nice one!"

  lose():
    score = score - 1
    message = "Try again!"
```

Second button in the row, second function at the bottom. Tap **Lose**: score goes down, message changes.

---

### Part 4 — Reset button

Rather than editing `score = 0` by hand every round, add a Reset button:

```igni
screen ScoreBoard:
  score = 0
  message = ""

  label score, style: heading
  label message
  layout horizontal, gap: small:
    button "Win", on tap: win()
    button "Lose", on tap: lose()
  button "Reset", on tap: reset()

  win():
    score = score + 1
    message = "Nice one!"

  lose():
    score = score - 1
    message = "Try again!"

  reset():
    score = 0
    message = ""
```

Tap Win a few times, Lose once, then Reset. Everything goes back to zero. Reset sits on its own line — it doesn't belong in the Win/Lose row because it's a different kind of button.

---

## Section 7 — Weather

You've used text and numbers. There's a third kind of value: **yes-or-no**, written `true` and `false`.

### Part 1 — if/else with true/false

```igni
screen Weather:
  raining = true

  if raining:
    label "Bring an umbrella"
  else:
    label "Enjoy the sun"
```

Save — you see **Bring an umbrella**. Flip `raining = false` and save — now **Enjoy the sun**.

- `raining = true` — a box holding `true`. No quotes; it's not text.
- `if raining:` reads as "if raining is true." The box itself is the answer — no comparison needed.

---

### Part 2 — else if for a second check

What if it's snowing instead of raining? Use `else if`:

```igni
screen Weather:
  raining = false
  snowing = true

  if raining:
    label "Bring an umbrella"
  else if snowing:
    label "Snow day"
  else:
    label "Enjoy the sun"
```

Save — **Snow day**. The `if raining:` check was false, so Igni tried `else if snowing:`, which was true.

`else if` lets you check another thing if the first was false. You can chain as many as you need.

---

### Part 3 — and for combining

Sleet is raining AND snowing at the same time. Use `and`:

```igni
screen Weather:
  raining = true
  snowing = true

  if raining and snowing:
    label "Sleet! Bundle up."
  else if raining:
    label "Bring an umbrella"
  else if snowing:
    label "Snow day"
  else:
    label "Enjoy the sun"
```

Save — **Sleet! Bundle up.** Both are true, so the first check wins.

`raining and snowing` is only true when both are true.

---

## Section 8 — Dice Roller

Let's build something real.

### Part 1 — Set up the state

```igni
screen DiceRoller:
  result = 0
  rolled = false
```

Save. Blank screen — no UI yet. `result` is the box for the dice number. `rolled` tracks whether the player has tapped Roll yet.

---

### Part 2 — Show the heading

```igni
screen DiceRoller:
  result = 0
  rolled = false

  layout vertical, gap: medium, padding: large, align: center:
    label "Dice Roller", style: heading
```

Now you see the title, centred with spacing.

---

### Part 3 — Show the result or prompt

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
```

Save — you see **Tap Roll to start!** because `rolled = false`. Flip `rolled = true` by hand and save — you see **You rolled:** and **0**.

---

### Part 4 — Roll button + function

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

Tap **Roll** — a number between 1 and 6 appears. Tap again for a new number.

- `random(1, 6)` — picks a random number between 1 and 6.
- `rolled = true` — flip the box so the screen shows the number instead of the prompt.

A working dice roller in 15 lines. You built an app.

**Try this:** change `random(1, 6)` to `random(1, 20)` for a D20, or `random(1, 100)` for a guessing game.

---

## What you learned

| What you type | What it does |
| --- | --- |
| `screen Name:` | Creates a page |
| `label "text"` | Shows text on screen |
| `label name` | Shows what's in the `name` box |
| `name = "Robin"` | Creates a box with text inside |
| `count = 0` | Creates a box with a number inside |
| `rolled = false` | Creates a box with true or false inside |
| `"text" + name` | Joins things together |
| `age >= 18`, `name is "Robin"` | Asks a question |
| `if / else if / else:` | Branches |
| `a and b` | Both must be true |
| `button "text", on tap:` | A button that does something when tapped |
| `input bind: name` | A text box connected to a box |
| `layout horizontal:` | Puts things side by side |
| `layout vertical, gap:, padding:` | Stacks things with spacing |
| `function_name():` | A named list of steps |
| `random(1, 6)` | Picks a random number |

## What to build next

Some ideas:

- **A tip calculator.** Input for the bill, a slider for the tip percentage, a label for the total. Uses comparisons, inputs, and arithmetic.
- **A shopping list.** Input for new items, a button to add them, a label counting the total. Next step: **lists** in the cheatsheet.
- **A quiz game.** A question, four buttons for answers, a score that goes up when the right one is tapped.
- **Rock Paper Scissors.** You've got almost everything — except function parameters (one new concept). Starter:

  ```igni
  screen RPS:
    result = ""

    layout vertical, gap: medium, padding: large, align: center:
      label result, style: heading
      layout horizontal, gap: small:
        button "Rock", on tap: play("Rock")
        button "Paper", on tap: play("Paper")
        button "Scissors", on tap: play("Scissors")

    play(choice):
      result = "You picked " + choice
  ```

  Save and tap a button. Extend `play(choice)`: pick a computer choice with `random(1, 3)`, compare to `choice`, and set `result` to who won. The cheatsheet has how to pass arguments.

When you're ready for more, the **cheatsheet** has every Igni feature in one place.
