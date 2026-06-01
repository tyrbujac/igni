# Learn Igni

> Tutorial v2.12 · targets Igni v0.22.0 (syntax verified against current spec — covers basic primitives only; advanced features like component events, animation, and testing are not yet in this tutorial)

> **Work in progress** — feedback welcome. An intermediate tutorial covering lists, navigation, and async data is planned.

Build your first app, one small step at a time. No programming experience needed.

Every step: save the file, see the result in the browser.

## Setup

You'll need:

1. **A code editor** — [VS Code](https://code.visualstudio.com) or [Cursor](https://cursor.com) are both free and work well.
2. **A terminal** — on Mac press **Cmd+Space**, type `Terminal`, press Enter. On Windows press the **Windows key**, type `Terminal`, press Enter.
3. **Chrome** — already on most computers.

In the terminal, pick a place to keep your app — somewhere easy to find later, like your `Documents` folder. Then type each line and press Enter:

```bash
cd ~/Documents
mkdir learn-igni
cd learn-igni
igni new
```

(`cd` moves into a folder; `mkdir` makes a new one; `igni new` sets up the app inside.)

A browser opens showing **Welcome** — that's your app. Leave the terminal open; every save updates the browser.

**Coming back later?** Open the terminal, `cd ~/Documents/learn-igni`, then `igni run`. Only use `igni new` the first time.

**Prefer Safari, Firefox, or another browser?** Quit with **q** and run `igni run localhost` instead — it prints a URL you can paste anywhere.

## Editing your app

Open the `learn-igni` folder in your code editor. Click `app.igni` on the left to open it.

A few things you'll need as you edit:

- **Save** — `Cmd+S` (Mac) or `Ctrl+S` (Windows). The browser updates instantly.
- **Quit `igni run`** — click the terminal window and press `q`.
- **New line** — press `Enter`.
- **Delete everything** — `Cmd+A` (Mac) or `Ctrl+A` (Windows) selects all, then `Delete` removes it.
- **Indentation** — Igni groups lines by indentation. Lines inside a block (e.g. under `screen Hello:`) must be indented further than the line that opens the block. Use **2 spaces** per indent level (or 1 tab) — that's what every example in this tutorial uses. Most editors add the indent automatically when you press `Tab` at the start of a line. Pick spaces or tabs and stick with one; mixing them breaks indentation.
- **If save doesn't update the browser** — refresh the browser tab. If that doesn't help either, click the terminal and press `R` then `Enter` to fully restart.

About saving: every save instantly updates the running app *and keeps your place* — counter values, what you've typed, what's scrolled into view all stay. **One exception:** if you change a *starting value* (the right side of `=` at the top of a screen), the running app keeps the old value because that variable is already in memory. Press **R** then **Enter** in the terminal to see the new starting value.

---

## 1. Hello World

### 1.1 Change the welcome text

When you opened `app.igni`, it had this in it:

```igni
screen Hello:
  label "Welcome"
```

The browser is showing **Welcome**. Now let's change the text on the screen. Click between the quotes around `Welcome` and replace it with the name of your app — anything you like:

```igni
screen Hello:
  label "Tyr's first app"
```

Save. The browser updates.

- `screen Hello:` creates a page called "Hello." The colon `:` means "here's what goes on this page."
- `label "..."` shows text on the screen. The text inside the double quotes is what you see.

---

### 1.2 Make it a heading

Let's make the title big:

```igni
screen Hello:
  label "Tyr's first app", style: heading
```

Save. The text is noticeably bigger. `style: heading` is what makes it big.

---

### 1.3 Add a second line

Now let's add a subtitle below the heading:

```igni
screen Hello:
  label "Tyr's first app", style: heading
  label "Made in Igni"
```

Both lines appear, one below the other. The first is big (because of `style: heading`), the second is normal size. Things stack from top to bottom by default — that's a `layout vertical`, even though you didn't write it. We'll see how to control spacing and alignment, and use `layout horizontal` for side-by-side, in section 4.

---

## 2. About you

### 2.1 Put something in a box

A **variable** is a labelled box with a value inside. Let's make one, put a name in it, and show what's inside:

```igni
screen Hello:
  name = "Sam"

  label name
```

Save. You see **Sam**.

- `name = "Sam"` makes a box called `name` and puts "Sam" inside.
- `label name` (no quotes) tells Igni to look **inside** the box and show what's there. That's why you see **Sam**, not the word "name".

The empty line between the variable and the label is just for readability — it separates the **state** of the screen (the variables) from the **UI** (what gets shown).

---

### 2.2 Join things together

Now let's use two variables, and combine each with some text:

```igni
screen Hello:
  name = "Andy"
  age = 30

  label "Hi, I'm " + name
  label "I am " + age + " years old."
```

Save. You see **Hi, I'm Andy** and **I am 30 years old.**

- `+` joins pieces of text together. Numbers can also be combined with `+`, `-`, `*`, `/` (e.g. `5 + 3`, `10 - 4`, `10 / 2`). One quirk: `/` always returns a *fractional* number — `5 / 2` is `2.5`, not `2`. When you want to keep a whole number — e.g. cutting a count in half and staying whole — use `floor(count / 2)` to round down to the nearest whole number.
- `age = 30` — no quotes around `30` because it's a number, not text.
- **Variables go at the top of the screen**, above the labels that use them. The empty line keeps state above and UI below.

---

### 2.3 Make it yours

Clear out the placeholder values:

```igni
screen Hello:
  name = ""
  age = 0

  label "Hi, I'm " + name
  label "I am " + age + " years old."
```

Save, then press **R** in the terminal — you'll see "Hi, I'm " and "I am 0 years old." That's the app without you in it.

Now put your name between the two quotes and change `0` to your age. Save, then press **R**. The screen greets you.

---

## 3. Making decisions

Apps often show different things in different situations. That's what `if` and `else` are for.

### 3.1 if and else

Start with `if` alone:

```igni
screen Hello:
  name = "Robin"

  if name is "Robin":
    label "Welcome back, Robin!"
```

Save. You see **Welcome back, Robin!**

Now change `name = "Robin"` to `name = "Taylor"`, save, then press **R** in the terminal. **The label disappears entirely.** That's `if` on its own: show something when the check is true, show nothing when it's false. *(You pressed R because changing a starting value — the right side of `=` at the top of a screen — needs a full restart; the variable is already in memory.)*

Now add `else`:

```igni
screen Hello:
  name = "Taylor"

  if name is "Robin":
    label "Welcome back, Robin!"
  else:
    label "Nice to meet you " + name
```

Save. You see **Nice to meet you Taylor** — no R press needed because you only added code, you didn't change a starting value.

- `if name is "Robin":` asks: "does `name` contain Robin?" The colon means "here's what to do if yes."
- `else:` means "otherwise."
- `is` asks if two things are the same. Careful: `=` puts something in a box; `is` asks if two things match.
- The lines below `if` and `else` are **indented** — that's how Igni knows they belong to the branch.

---

### 3.2 Bigger, smaller, equal

Sometimes you want to compare sizes, not just exact matches. Igni uses the same symbols as maths:

- `age > 18` — "is age bigger than 18?"
- `age < 18` — "is age smaller than 18?"
- `age >= 18` — "is age 18 or bigger?"
- `age <= 18` — "is age 18 or smaller?"

Let's use `>=` to decide if Robin is an adult:

```igni
screen Hello:
  name = "Robin"
  age = 42

  if age >= 18:
    label "You are an adult."
  else:
    label "You are a child."
```

Save. You see **You are an adult.** — Robin is 42, and 42 is 18 or bigger, so the `if` branch wins.

Now imagine Taylor is 10. Change `name = "Robin"` to `name = "Taylor"` and `age = 42` to `age = 10`. Save, then press **R** in the terminal. It switches to **You are a child.**

A line starting with `#` is a **note** for you — Igni ignores it. You can use it to remind yourself what tricky bits of code do:

```igni
  # check if old enough to vote
  if age >= 18:
    label "You are an adult."
```

---

## 4. Counter

### 4.1 A counter with a button

```igni
screen Counter:
  count = 0

  label count, style: heading
  button "Add one"
```

Save. You see a big **0** with a button below it. The button doesn't do anything yet — that comes next.

- `count = 0` — a box that starts at zero.
- `label count` shows whatever number is in the `count` box.
- `button "Add one"` — the text in quotes is what appears on the button.

---

### 4.2 Wire the tap

Now make the button do something:

```igni
screen Counter:
  count = 0

  label count, style: heading
  button "Add one", on tap: count = count + 1
```

Save, then tap the button. The number goes up!

- `on tap: count = count + 1` — when tapped, take `count`, add 1, put the result back.

The label updated automatically because `count` changed. That's the rule: **when you change a box, Igni redraws the screen to show the new value.** That's why you don't tell the label to refresh — Igni tracks which boxes each part of the screen uses, and any time one of them changes, the parts that depend on it re-render. Counters, inputs, dice rolls — every reactive thing you'll build runs on this one rule.

Change `+ 1` to `+ 2` and save. Now the counter jumps by two each tap.

---

### 4.3 A second button, side by side

```igni
screen Counter:
  count = 0

  label count, style: heading
  layout horizontal, gap: small:
    button "Add one", on tap: count = count + 1
    # this button takes the count down
    button "Remove one", on tap: count = count - 1
```

Two buttons sit side by side, with the number above them.

- `layout horizontal:` puts things side by side instead of stacking them. Everything indented under it goes in the row.
- `gap: small` adds space between the buttons.

---

### 4.4 Stack with breathing room

Wrap the whole counter in `layout vertical:` so we can space it out:

```igni
screen Counter:
  count = 0

  layout vertical, gap: medium:
    label count, style: heading
    layout horizontal, gap: small:
      button "Add one", on tap: count = count + 1
      button "Remove one", on tap: count = count - 1
```

Save. The label and the row of buttons now have a comfortable gap between them.

- `layout vertical:` stacks things top-to-bottom — the same direction the screen already used by default. Writing it explicitly lets you set `gap`, `padding`, and other modifiers on the stack.
- `gap: medium` — space between each item in the stack.

---

### 4.5 Padding and centring

```igni
screen Counter:
  count = 0

  layout vertical, gap: medium, padding: large, align: center:
    label count, style: heading
    layout horizontal, gap: small:
      button "Add one", on tap: count = count + 1
      button "Remove one", on tap: count = count - 1
```

Save. Same counter, now with breathing room around it and centred on the page.

- `padding: large` — space around the inside of the layout.
- `align: center` — centres everything horizontally.

---

## 5. Greeter

### 5.1 Let someone type

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

### 5.2 Greet them back

```igni
screen Greeter:
  name = ""

  input bind: name, placeholder: "What is your name?"
  label "Hello, " + name
```

Type your name. The greeting updates letter by letter as you type.

---

### 5.3 Show a hint when the box is empty

A text box that greets you, or asks for your name if you haven't typed one:

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

`is empty` checks whether a box has no content yet.

---

## 6. ScoreBoard

A **function** is a named list of steps. Reach for one when a button does several things and you want to name that combination.

### 6.1 Set up the screen

```igni
screen ScoreBoard:
  score = 0
  message = ""

  label score, style: heading
  label message
```

Save. You see a big **0** and nothing beneath it (because `message` is empty). No buttons yet; we'll add them next.

---

### 6.2 Win button

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

- `win():` creates a function called "win." The parentheses `()` are how Igni knows "this is something that runs" — variables (`score = 0`) are *boxes*, functions are *recipes for changing boxes*. The colon `:` opens the block of steps.
- Functions go at the **bottom** of the screen body, below the layout. This keeps the screen's shape clear at a glance: state at the top, what you see in the middle, what happens when you tap at the bottom.
- `on tap: win()` — when tapped, run every step inside `win`.
- `layout horizontal, gap: small:` — we set up the row now so we can add a second button without rearranging.

---

### 6.3 Lose button

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

### 6.4 Reset button

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

## 7. Weather

You've used text and numbers. There's a third kind of value: **yes-or-no**, written `true` and `false`.

### 7.1 if/else with true/false

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

### 7.2 else if for a second check

What if it's snowing instead of raining? Use `else if`:

```igni
screen Weather:
  raining = false
  snowing = true

  if raining:
    label "Bring an umbrella"
  else if snowing:
    label "Snow day."
  else:
    label "Enjoy the sun"
```

Save — **Snow day**. The `if raining:` check was false, so Igni tried `else if snowing:`, which was true.

`else if` lets you check another thing if the first was false. You can chain as many as you need.

---

### 7.3 and for combining

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
    label "Snow day."
  else:
    label "Enjoy the sun"
```

Save — **Sleet! Bundle up.** Both are true, so the first check wins.

`raining and snowing` is only true when both are true.

---

## 8. Dice Roller

Let's build something real.

### 8.1 Set up the state

```igni
screen DiceRoller:
  result = 0
  rolled = false
```

Save. Blank screen — no UI yet. `result` is the box for the dice number. `rolled` tracks whether the player has tapped Roll yet.

---

### 8.2 Show the heading

```igni
screen DiceRoller:
  result = 0
  rolled = false

  layout vertical, gap: medium, padding: large, align: center:
    label "Dice Roller", style: heading
```

Now you see the title, centred with spacing.

---

### 8.3 Show the result or prompt

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

### 8.4 Roll button + function

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

## What you now know

You've learned every core idea in Igni:

- **Showing UI** — `screen`, `label`, `button`, `input`, `image`. Built-in primitives, lowercase.
- **Storing state** — `name = "Sam"`, `count = 0`, `rolled = false`. Boxes at the top of a screen.
- **Reacting to changes** — when a box changes, the screen redraws. The whole language runs on this one rule.
- **Reacting to taps** — `on tap:` runs code when a button is tapped. Code reassigns boxes; the screen redraws.
- **Taking input** — `input bind: name` connects a text box to a state variable.
- **Making decisions** — `if`, `else if`, `else`, `and`. Compare with `is`, `>=`, `>`, `<`, `<=`.
- **Organising code** — functions (`win():`) bundle several steps under one name. Buttons can call them.
- **Arranging things** — `layout vertical:` and `layout horizontal:` with `gap`, `padding`, `align`.

## Syntax reference


| What you type                     | What it does                             |
| --------------------------------- | ---------------------------------------- |
| `screen Name:`                    | Creates a page                           |
| `label "text"`                    | Shows text on screen                     |
| `label name`                      | Shows what's in the `name` box           |
| `name = "Robin"`                  | Creates a box with text inside           |
| `count = 0`                       | Creates a box with a number inside       |
| `rolled = false`                  | Creates a box with true or false inside  |
| `"text" + name`                   | Joins things together                    |
| `age >= 18`, `name is "Robin"`    | Asks a question                          |
| `if / else if / else:`            | Branches                                 |
| `a and b`                         | Both must be true                        |
| `button "text", on tap:`          | A button that does something when tapped |
| `input bind: name`                | A text box connected to a box            |
| `layout horizontal:`              | Puts things side by side                 |
| `layout vertical, gap:, padding:` | Stacks things with spacing               |
| `function_name():`                | A named list of steps                    |
| `random(1, 6)`                    | Picks a random number                    |
| `floor(count / 2)`                | Rounds a fractional number down to a whole one |


## What to build next

Some ideas:

- **A tip calculator.** Input for the bill, a slider for the tip percentage, a label for the total. Uses comparisons, inputs, and arithmetic.
- **A quiz game.** A question, four buttons for answers, a score that goes up when the right one is tapped.

An intermediate tutorial covering lists, multi-screen navigation, and fetching data is planned. For now, the **cheatsheet** has every Igni feature in one place if you want to push further.

---

## Appendix: Troubleshooting

When you save, the terminal shows red text and the browser shows an error screen instead of your app. Errors look like this:

```text

  Error: Expected indent, got "label"

    app.igni:2 | label "Welcome"
               | ^
               | Hint: did you forget to indent the line under `screen Hello:`?
```

The line number tells you *where*; the message tells you *what*; the **Hint** (when there is one) tells you the most likely cause. The four common causes:

- **Wrong indentation** — lines inside a block must be indented further than the line that opened it (e.g. lines under `screen Hello:` start with `Tab`). Mixing tabs and spaces breaks this; pick one and stick with it. Most "Expected indent" errors come from this.
- **Misspelled a name** — `nam` instead of `name`, for example.
- **Forgot a `:*`* — every block-opening line ends with one (`screen Hello:`, `if age > 18:`).
- **Used `=` when you meant `is`** — `=` puts something in a box; `is` asks if two things match.

Fix the line the error points at, save again, and the app comes back.

---

## Appendix: Coming from Figma

Igni is positioned as a UI language whose primitives match Figma's auto-layout vocabulary. The slogan is *"designs that translate, not redesign"* — if you've designed a screen in Figma, you should be able to write it in Igni without redrawing the structure. This appendix walks through what maps directly and what Igni deliberately doesn't translate.

### What translates directly

| In Figma | In Igni |
|---|---|
| Auto-layout frame, vertical | `layout vertical:` |
| Auto-layout frame, horizontal | `layout horizontal:` |
| Frame `gap` between items | `gap: small` / `medium` / `large` (or `gap: spacing/N` for specific sizes) |
| Frame `padding` | `padding: small` / `medium` / `large` (or `padding: spacing/N`) |
| Frame `align` (start / center / end) | `align: start` / `center` / `end` |
| Color variables (named tokens) | `theme: color: <name>: "#hex"` |
| Spacing variables | `theme: spacing:` (or use built-in `small`/`medium`/`large` + numeric `spacing/1`–`spacing/8`) |
| Typography styles (closed set) | `theme: typography:` with `style: heading` / `title` / `body` / `caption` |
| Corner radius (uniform) | `rounded: small` / `medium` / `large` / `full` |
| Stroke (uniform) | `border: thin` / `medium` / `thick` |
| Components | `component Name:` blocks |
| Component instance overrides | Component arguments |
| Light/dark variants ("modes") | `theme:` + `theme dark:` pair, switched by `shared.theme_mode` |

### What Igni deliberately doesn't translate

These are principled exclusions, not missing features. Each one would break a load-bearing invariant of the language (flow layout, closed-set vocabularies, source-visible behaviour) for a benefit that's typically decorative-and-substitutable.

- **Drawing primitives, custom paths, vector shapes.** Igni has no canvas model. Use SVG icon assets via `icon` if you need vector marks; flow layout for everything else.
- **Absolute positioning** (`x: 100, y: 200`). Breaks flow layout. The closest Igni alternative — composition-based overlays via `layout stack:` — is on the roadmap; until then, structure with auto-layout.
- **Per-side strokes / per-corner radii.** Igni's `border:` and `rounded:` apply uniformly. Asymmetric chrome is typically expressible via background + strategic gaps.
- **Free typography** (any font, any size, any weight). Igni whitelists six fonts and four size tokens. The whitelist is intentional: a closed-set vocabulary is what makes Igni source LLM-learnable.
- **Gradients and blur effects.** Decorative-and-substitutable. Solid `theme: color:` brand expression typically carries the same intent without the spec-budget cost.
- **Constraints / pinning** (Figma's "pin to right edge"). Flow-layout primitives (`align:`, `gap:`, `padding:`) cover the canonical use cases. Pinning is coordinate-relative; Igni is flow-relative.

Some Figma features sit on the roadmap as candidates pending real-app or cold-test signal — `layout stack:` for badges/FAB/modals, `wrap:` for tag lists. They're not in the language yet, and may or may not land depending on whether actual app pressure surfaces a clear need. (`hover:` for web/desktop apps shipped in v0.22.0.) The spec is a budget, not a backlog.