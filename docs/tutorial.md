# Learn Igni

> Tutorial v2.4 · targets Igni v0.12.2

Build your first app, one small step at a time. No programming experience needed.

Every part: save the file (**Cmd+S** on Mac, **Ctrl+S** on Windows) and see the result in the browser. Do this → see that.

**If something goes wrong:** if you see red text in the terminal, don't panic. Check your spelling and spacing, then save again. Igni cares about two things: the exact letters you type, and how far each line is indented. If the browser doesn't change after you save and the terminal shows red text, that usually means you've misspelled a name (for example, typed `nam` instead of `name`). Fix the typo and save again.

---

## Before you start

> **Already set up?** If `igni run` is running and you have an empty `app.igni` open in your editor, you can skip to [Section 1](#section-1--hello-world).

You'll use three things on your computer:

1. **A text editor** — for writing your code. [Cursor](https://cursor.com) is free and works well.
2. **A terminal** — a window where you type commands to the computer.
   - **Mac:** press **Cmd+Space**, type `Terminal`, press Enter.
   - **Windows:** press the **Windows key**, type `Terminal`, press Enter.
3. **Chrome** — the browser your app will appear in. Already on most computers.

**Igni is already set up on your machine for this tutorial.** If you're in a workshop, your facilitator has you covered.

### Make a new app

In the terminal, type this and press Enter:

```bash
igni new learn-igni
```

This creates a new folder called `learn-igni` with a starter app inside. **Check it worked:** you should see the `learn-igni` folder appear in your file list. If you see red text, flag your facilitator. Setup glitches are rare and never your fault.

Now go into the folder and run it:

```bash
cd learn-igni
igni run
```

After a few seconds, a browser window opens showing a counter. Tap **Add**. The number goes up. That's an Igni app running.

**Leave the terminal window open** the whole time you're doing the tutorial. Every time you save your code, the browser updates automatically. If you close the terminal, the app stops.

**When you're done** (or want to take a break): click into the terminal window and press **Ctrl+C** to stop the server cleanly. You can always start it again later with `igni run`.

**Prefer Safari, Firefox, or Arc?** Run `igni run localhost` instead. It prints a URL you can paste into any browser, and saves still auto-refresh the tab the same as Chrome.

### Open the file you'll be editing

In Cursor: **File → Open Folder**, pick the `learn-igni` folder. On the left you'll see a file called `app.igni`. Click it. That's where you'll write your code.

You'll see the starter counter code already in there. **Select everything and delete it** so the file is empty. Now you're ready for Section 1.

---

## Section 1 — Hello World

Your very first app. Three short parts. By the end you'll have text on the screen and know how to style it.

### Part 1 — Show text on screen

Type this into your `.igni` file:

```igni
screen Hello:
  label "Hello World"
```

Save it. You see **Hello World** in the browser: small, sitting in the top-left corner with just a bit of spacing. That's fine. We'll add proper layout and styling later. The win here is: you got text on the screen.

**What does each part mean?**

- `screen Hello:` — this creates a page called "Hello." You can call it anything you like. The colon `:` at the end means "here's what goes on this page."
- `label "Hello World"` — this puts text on the screen. The words inside the double quotes `" "` are what you see.

**Two pieces, not one.** `screen` makes the page; `label` puts text on it. Every Igni app starts with a `screen`, and a screen can hold labels, buttons, text boxes, and more. You'll add more pieces as you go.

---

### Part 2 — Change the text, make it a heading

```igni
screen Hello:
  label "Welcome to my app!", style: heading
```

Save. You see **Welcome to my app!**, and this time it's noticeably bigger than before.

**What's new?**

- Change the words inside the double quotes to anything you want. Try your name, a favourite saying, a joke. Save. The browser updates instantly.
- The double quotes `" "` matter: they tell Igni "show these exact letters." You'll see *why* quotes matter in Section 2.
- `, style: heading` is the new bit. A comma, then `style: heading` — that's what makes the text big. We'll name the pattern properly in Section 4.

**Try this:** edit the text a few different times, saving after each edit. Watch the browser refresh each time.

---

### Part 3 — Add a second line

```igni
screen Hello:
  label "Welcome to my app!", style: heading
  label "Made in Igni"
```

Save. Both lines appear, one below the other. The first is big (because of `style: heading`), the second is smaller — the normal size. Things stack from top to bottom. Just add more lines.

**What's new?**

- You can have as many `label` lines as you want. Each one shows text on the screen, and they appear in order from top to bottom.
- The second label has no `, style: heading` — so it renders at normal size. You can mix styled and unstyled labels however you like.

---

## Section 2 — About you

You'll start storing things — your name, your age — and use them to build a personalised greeting. Three parts.

### Part 1 — Put something in a box

Make a box, put something in it, show what's inside:

```igni
screen Hello:
  name = "Sam"
  label name
```

Save. You see **Sam**.

**What's happening?**

- `name = "Sam"` — this makes a box called `name` and puts "Sam" inside. The equals sign `=` means "put this into this box."
- `label name` — no quotes around `name`, so Igni looks **inside** the box and shows what's there. That's why you see **Sam**, not the word "name".

A box with a name is called a **variable**. You'll use them all the time.

**Quotes matter.** These two lines look almost the same but do completely different things:

```igni
label "name"
label name
```

Quotes mean "literal text" — show these exact letters, so you'd see the word **name**. No quotes means "the thing stored under this name" — look inside the box, so you see **Sam**. You'll use both all the time.

**Now change what's in the box.** Update your code so `name = "Andy"`:

```igni
screen Hello:
  name = "Andy"
  label name
```

Save. The label switches to **Andy**. One line changed, one word on screen changed. You've just seen how a variable works: change the box's contents, and every place that reads the box updates.

---

### Part 2 — Join things together

Two small moves: start small, then add more.

**First, join a label and a box:**

```igni
screen Hello:
  name = "Andy"
  label "Hi, I'm " + name
```

Save. You see **Hi, I'm Andy**.

`+` joins pieces of text together. `"Hi, I'm " + name` sticks the text "Hi, I'm " and whatever is in the `name` box together.

**Now add a number:**

```igni
screen Hello:
  name = "Andy"
  age = 30

  label "Hi, I'm " + name
  label "I am " + age + " years old"
```

Save. You see **Hi, I'm Andy** and **I am 30 years old**.

**What's new?**

- You can chain more than two pieces: `"I am " + age + " years old"` joins three. Don't forget each `+`. If you leave one out, Igni will tell you.
- `age = 30` — this box holds a number, not text. Notice no quotes around `30` — quoted `"30"` would be the text "30", unquoted `30` is the number thirty. Igni treats them differently.
- **Variables go at the top of the screen**, above the labels that use them. That's why `name` and `age` are up here and the labels are below. Later on you'll also see functions go at the bottom, below the labels and buttons.

---

### Part 3 — Make it yours

Time to use your own name and age. Clear out the placeholder values so your code looks like this:

```igni
screen Hello:
  name = ""
  age = 0

  label "Hi, I'm " + name
  label "I am " + age + " years old"
```

Save and you'll see "Hi, I'm " (with nothing after) and "I am 0 years old". That's what the app looks like without you in it.

**Now fill them in.** Put your name between the two quotes of `name = ""`, and change `0` to your age (as a number, no quotes). Save. The screen greets you.

<details>
<summary>Stuck? Here's what it might look like.</summary>

If your name is Robin and you're 42:

```igni
screen Hello:
  name = "Robin"
  age = 42

  label "Hi, I'm " + name
  label "I am " + age + " years old"
```

</details>

That's the first thing you've made yours. Everything else in this tutorial works the same way: edit a value, save, see the change.

---

## Section 3 — Making decisions

Apps often need to show one thing in one situation and something else in another. That's what `if` and `else` are for. Two parts.

### Part 1 — Make a decision

We'll build it up one half at a time.

**First, `if` alone:**

```igni
screen Hello:
  name = "Robin"

  if name is "Robin":
    label "Welcome back, Robin!"
```

Save. You see **Welcome back, Robin!** Now change `name = "Robin"` to `name = "Taylor"` and save. **The label disappears entirely.** That's what `if` does on its own: show something when the check is true, show nothing when it's false.

**Now add `else`:**

```igni
screen Hello:
  name = "Robin"

  if name is "Robin":
    label "Welcome back, Robin!"
  else:
    label "Nice to meet you " + name
```

Now when the name isn't "Robin", the `else` branch runs and shows a personalised greeting instead of nothing. Flip `name` between "Robin" and "Taylor" to watch the message change. The first shows **Welcome back, Robin!**, the second shows **Nice to meet you Taylor**.

**What does each part mean?**

- `if name is "Robin":` — asks: "does the `name` box contain Robin?" The colon at the end means "here's what to do if yes."
- `else:` — means "otherwise." If the answer was no, do this instead.
- The lines below `if` and `else` are **indented** (pushed to the right). That's how Igni knows they belong to the `if` or the `else`.
- `is` means "is the same as." Careful: a single `=` *puts something in a box*. `is` *asks if two things are the same*. They look similar, they do completely different jobs.
- The `else` branch uses `+` to join the "Nice to meet you " text with whatever name is in the box. Same pattern you used in Section 2.

---

### Part 2 — Bigger, smaller, equal

`is` asks "is this the same as that?" But sometimes you want to ask a different question — "is this **bigger** than that?" or "is this **smaller** than that?" Igni uses the same symbols you learned in maths class:

- `age > 18` — "is age bigger than 18?"
- `age < 18` — "is age smaller than 18?"
- `age >= 18` — "is age 18 or bigger?"
- `age <= 18` — "is age 18 or smaller?"

Let's use `>=` to decide if someone is an adult:

```igni
screen Hello:
  age = 42

  if age >= 18:          # >= means "18 or bigger"
    label "You are an adult"
  else:
    label "You are a child"
```

You see **You are an adult**. Now change `age = 42` to `age = 10`. Save. It switches to **You are a child**.

The `#` and anything after it on a line is a **note** for you. Igni ignores it when running your app; it's there for humans reading the code. You'll see more of these later.

**Try this:** try 18 or 5. Save each time. Watch the text flip.

---

## Section 4 — Counter

A new app: a button that counts. Three parts: one screen, one button, then a second button.

### Part 1 — The counter display

```igni
screen Counter:
  count = 0

  label count, style: heading
```

Save. You see a big **0**. That's all. No button yet; we'll build up.

**New app, new screen name.** Our earlier screens were all called `Hello` because they were greetings. This one is a counter, so we call it `Counter`. Screens are named after what the app does. Name yours anything you like; it's just a label for you and anyone reading the code.

**What does each part mean?**

- `count = 0` — a box called `count` that starts at zero.
- `label count` — shows whatever number is in the `count` box on the screen.
- `style: heading` — makes the text big. You saw this in Section 1 Part 2.

**Try this:** change `count = 0` to `count = 42`. Save. The big number switches to **42**. Same variable pattern from Section 2: edit the value, save, see the change.

---

### Part 2 — Add a button

```igni
screen Counter:
  count = 0

  label count, style: heading
  button "Add one", on tap: count = count + 1
```

Tap the button. Watch the number go up!

**What's new?**

- `button "Add one"` — a button with the text "Add one" written on it. The text inside the double quotes is what appears on the button.
- `on tap: count = count + 1` — when someone taps the button, it takes whatever number is in `count`, adds 1, and puts the result back.

**Modifiers.** You've already seen this pattern; now we're naming it. After a primitive name, you can add **modifiers** separated by commas, each shaped like `name: value`. `style: heading` is one modifier. `on tap: ...` is another. You'll see more modifiers as you go.

**Try this:** change `+ 1` to `+ 2`. Save. The counter jumps by two each tap.

> **This is reactivity.** When `count` changes, Igni re-runs the whole screen from the top. The label uses `count`, so it redraws with the new number. There's no wiring — re-running everything *is* the wiring. Most languages make you connect every button to every label by hand. Igni doesn't.

---

### Part 3 — A second button, side by side

One button is fine. But related actions feel better when they sit next to each other. A **row** keeps them close.

```igni
screen Counter:
  count = 0

  label count, style: heading
  layout horizontal, gap: small:
    button "Add one", on tap: count = count + 1
    # this button takes the count down
    button "Remove one", on tap: count = count - 1
```

> **Mind the indentation here!** The two `button` lines sit under `layout horizontal, gap: small:` — that's why they end up in the row. They're indented **twice** (two "steps" of spaces) — once because they're inside the screen, once more because they're inside the `layout`. Get the indentation wrong and they'll sit below the row instead of inside it.

Two buttons in a row. Add goes up, Remove goes down.

**What's new?**

- `layout horizontal:` — puts things side by side in a row instead of stacking them. Everything indented under it goes in the row.
- `gap: small` — a modifier on `layout` that adds a little space between the buttons so they don't squish together.
- `#` again — same idea as in Section 3. A note for humans, ignored at runtime. Use it to remind yourself what a line does.

**Try this:** add a third button labelled "+10" that adds ten to the count in one tap. Make sure it sits in the same row as the others.

**Remember Section 1?** That Hello World sitting lonely in the top-left corner. Layout is how you fix it. Replace everything in your file with this:

```igni
screen Hello:
  layout vertical, align: center, padding: large:
    label "Hello World", style: heading
```

Save. Same text, completely different feeling.

---

## Section 5 — Greeter

A third app: a greeter that says hello to whoever types their name. Three parts.

### Part 1 — Let someone type

```igni
screen Greeter:
  name = ""

  input bind: name, placeholder: "What is your name?"
```

Type your name into the text box. You'll see your letters appear inside the box as you type, but nothing else happens yet. That's fine. We'll add the greeting in the next part.

**What does each part mean?**

- `name = ""` — a box called `name` that starts empty. The `""` (two double quotes with nothing between them) means "nothing inside yet."
- `input bind: name` — puts a text box on the screen. `bind:` is a modifier that **connects** the input to the `name` box — whatever you type goes straight in.
- `placeholder: "What is your name?"` — another modifier. The grey hint text you see before typing. Put your hint inside the double quotes.

**Try this:** change the `placeholder` text to a different question — "Who are you?" or "Enter your nickname." Save and watch the grey hint update.

---

### Part 2 — Greet them back

```igni
screen Greeter:
  name = ""

  input bind: name, placeholder: "What is your name?"
  label "Hello, " + name
```

Type your name now. Watch the greeting update **as you type**, letter by letter. Same reactivity as Section 4: the `name` box changes, the screen re-runs, the label redraws.

**What's new?**

- The `label` uses the same `+` pattern you learned in Section 2 to join the word "Hello, " with whatever is in the `name` box.
- Delete everything in the text box. The greeting becomes just "Hello, " with nothing after. That's because `name` is empty again.

---

### Part 3 — Checkpoint

Let's put Section 3 and this section together. A text box that greets you, but politely asks for your name when you haven't typed anything yet.

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

When you open the page, you see "Type your name above." Start typing. The hint disappears and is replaced by "Hello, [your name]."

**What's happening?**

- `layout vertical, gap: large:` — wraps the input and the label, with a comfortable gap between them. That's the empty space that separates the text box from the message.
- `if name is empty` checks: "is the name box still empty?" `is empty` is a shortcut Igni has for "has no content yet"; handy for boxes that start as `""`.
- The screen re-decides which label to show every time `name` changes.

That's reactivity again: no extra glue, no wiring. If a box changes and a screen uses it, the screen re-runs.

**Try this:** change the `is empty` branch to show "Waiting for your name...", and change the `else` branch to show `"Hello, " + name + "! Nice to meet you."`. Save. Start with an empty text box. You see the waiting message. Type your name. The greeting with the friendly ending appears.

---

## Section 6 — ScoreBoard

A **function** is a named list of steps. You reach for one when a single button does several things and you want to give that combination a name, or when the same sequence of steps would appear in two different buttons.

Four parts. We'll build a scoreboard one feature at a time, adding new lines as we go.

### Part 1 — Set up the screen

```igni
screen ScoreBoard:
  score = 0
  message = ""

  label score, style: heading
  label message
```

Save. You see a big **0** and nothing beneath it. `message` starts empty, so the second label has nothing to show. No buttons yet; we'll add them next.

**What does each part mean?**

- `score = 0` — a box for the score.
- `message = ""` — a box for the message that shows after each tap. Starts empty.
- Two labels, one for each box.

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

Tap **Win**. The score goes up and "Nice one!" appears. One tap, two things happen.

**What's new?**

- `win():` — this creates a function called "win." The parentheses `()` and colon `:` always come together. Functions go at the bottom of the screen, below everything else.
- `on tap: win()` — when the button is tapped, run every step inside `win`. Two steps here: increase the score AND change the message. That's the "give the combination a name" reason for reaching for a function.
- `layout horizontal, gap: small:` — we'll add a second button soon, so we're setting up the row now. That way we won't have to rearrange anything later.

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

Second button inside the row, second function at the bottom. Tap **Lose**: score goes down, message changes.

**What's new?**

- Each button has its own `on tap:` pointing at its own function.
- `lose():` is built the same way as `win()` — a name, then steps, indented underneath. Each function does its one job.

---

### Part 4 — Reset button

After a few rounds you want to start over. Rather than editing `score = 0` by hand every time, add a Reset button that does it for you.

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

Tap Win a few times, Lose once, then tap Reset. Everything goes back to zero and the message clears.

**What's new?**

- A third function `reset()` that sets both boxes back to their starting values.
- Reset is a **different kind** of button: it doesn't score, it clears state. That's why we place it on its own line, below the Win/Lose row, not inside it.

**Try this:** add a `tie()` function that sets `message = "Draw."` without changing the score. Wire a fourth button in the Win/Lose row to run it.

---

## Section 7 — Weather

One more concept before we build something real. You've worked with text ("Robin") and numbers (42). There's a third kind of thing: **yes-or-no values**, called `true` and `false`. Boxes that hold one of those two answers are the state of a switch — is it on, or off? The rest of the screen can then react to that switch.

Four parts. We'll build a little weather app, starting simple.

### Part 1 — True and false

```igni
screen Weather:
  raining = true

  label "raining is " + raining

  if raining:
    label "Bring an umbrella"
```

Save. You see **raining is true** and **Bring an umbrella**.

**What's new?**

- `raining = true` — a box holding the value `true`. No quotes around `true` — it's not text, it's a yes-or-no value. The only two possible values are `true` and `false`.
- `label "raining is " + raining` — this prints the current state of the box. The `+` joins the text "raining is " with whatever `raining` currently is. Handy for watching what your app thinks while you're developing it.
- `if raining:` — reads as "if raining is true." Unlike numbers, you don't need a comparison — the box itself is the answer.

**Try this:** change `raining = true` to `raining = false`. Save. The first label switches to **raining is false**. The umbrella message **disappears entirely**, because the `if` check was false, and there's no `else` yet. We'll add one next.

---

### Part 2 — Add else

Keep `raining = false` from the try-this above, and add an `else:` branch:

```igni
screen Weather:
  raining = false

  label "raining is " + raining

  if raining:
    label "Bring an umbrella"
  else:
    label "Enjoy the sun"
```

Save → **raining is false** and **Enjoy the sun**. The `else` branch fires when the `if` check is false. Flip `raining = true` again and you're back to the umbrella message. One switch, two messages, controlled by `else`.

---

### Part 3 — Add another switch with `else if`

What if it's not raining, but it's snowing? You need a second switch.

```igni
screen Weather:
  raining = false
  snowing = true

  label "raining is " + raining
  label "snowing is " + snowing

  if raining:
    label "Bring an umbrella"
  else if snowing:
    label "Snow day"
  else:
    label "Enjoy the sun"
```

Save → **raining is false**, **snowing is true**, and **Snow day**. The `if raining:` check was false, so Igni tried the next one: `else if snowing:` — true — so that label showed up.

**What's new?**

- A new box `snowing = true` sits under `raining = false`.
- A second visualisation label shows the snowing state.
- A new branch `else if snowing:` sits between `if raining:` and `else:`. `else if` lets you check another thing if the first was false, like asking a follow-up question. You can chain as many as you need.

**Try this:** flip `snowing = false`. Save → both visualisation labels now say "false", and the final message is **Enjoy the sun** (both checks failed, `else` wins).

---

### Part 4 — Combine with `and`

What about sleet — raining AND snowing at the same time? Use `and`:

```igni
screen Weather:
  raining = true
  snowing = true

  label "raining is " + raining
  label "snowing is " + snowing

  if raining and snowing:
    label "Sleet! Bundle up."
  else if raining:
    label "Bring an umbrella"
  else if snowing:
    label "Snow day"
  else:
    label "Enjoy the sun"
```

Save → **Sleet! Bundle up.** Both `raining` and `snowing` are true, so the first check wins.

**What's new?**

- **`and` combines two checks.** `raining and snowing` is only true when *both* are true. Use it whenever "both things must be true" matters.

You'll use this shape in the very next section. The dice roller needs a `rolled = false` box to track whether the player has tapped Roll yet, so the screen can say "Tap Roll to start!" before the first roll and "You rolled: 4" afterward.

**Try this:** add a third box `sunny = true` and an `else if sunny:` branch that says "Put on sunglasses!" Think about where it fits in the chain.

---

## Section 8 — Dice Roller

You know enough. Let's build something real, in four small parts.

### Part 1 — Set up the state

```igni
screen DiceRoller:
  result = 0
  rolled = false
```

Save. Blank screen; we haven't added any UI yet. `result` is the box for the dice number (starts at 0). `rolled` is the true-or-false box from Section 7 and tracks whether the player has tapped Roll yet.

---

### Part 2 — Add the heading

```igni
screen DiceRoller:
  result = 0
  rolled = false

  layout vertical, gap: medium, padding: large, align: center:
    label "Dice Roller", style: heading
```

Now you see the title. `layout vertical, gap: medium, padding: large, align: center:` stacks things top to bottom with three modifiers controlling spacing: `gap` between items, `padding` around the edges, `align: center` to centre everything.

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
      label "—", style: heading
```

Save. You see **Tap Roll to start!** and a large dash **—** below it because `rolled = false`. Flip `rolled = true` by hand and save → you see **You rolled:** and **0**. `if rolled:` reads as "if the player has rolled, show the number; otherwise show the prompt and a dash placeholder."

**Why the dash?** The `if` branch shows a heading-sized number. We put a heading-sized dash in the `else` branch too, so both branches take the same vertical space. When you actually tap Roll in Part 4, nothing below will jump around.

---

### Part 4 — Add Roll button + function

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
      label "—", style: heading

    button "Roll", on tap: roll()

  roll():
    result = random(1, 6)
    rolled = true
```

Tap **Roll**. A number between 1 and 6 appears where the dash was. Tap again for a new number. The Roll button stays exactly where it was. That's the dash placeholder earning its keep.

- `random(1, 6)` — picks a random number between 1 and 6, like rolling a real dice.
- `rolled = true` — after the first roll, flip the box so the screen shows the number instead of the prompt.

That's a working dice roller, in 17 lines. You built an app!

**Try this:** change `random(1, 6)` to `random(1, 20)`: you've got a D20 for tabletop games. Or try `random(1, 100)` for a "guess my number" game.

---

## What you learned

| What you type | What it does |
| --- | --- |
| `screen Name:` | Creates a page |
| `label "text"` | Shows text on screen |
| `label name` | Shows whatever is in the `name` box |
| `label "text", style: heading` | Shows text at heading size |
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
| `# anything` | A note for you; Igni ignores it |

## What to build next

You know enough Igni now to build real things. Some ideas to try:

- **A tip calculator.** Input for the bill amount, a slider for the tip percentage, a label showing the total. Uses Section 3 Part 2 comparisons, Section 5 inputs, and the `+` / `*` arithmetic from Section 2.
- **A shopping list.** A text input for new items, a button to add them, a label counting how many you've got. Next step: learn about **lists** in the cheatsheet.
- **A quiz game.** A question, four buttons for answers, a score that goes up when the right one is tapped. Uses Sections 3, 4, and 6.
- **Rock Paper Scissors.** You've got almost everything you need — except function parameters (one new concept). Starter:

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

  Save and tap a button. You'll see your choice. Now extend `play(choice)`: pick a computer choice with `random(1, 3)`, compare to `choice`, and set `result` to who won. Check the cheatsheet for how to pass arguments to a function.

When you're ready for more, the **cheatsheet** is your next stop. It has every Igni feature in one place. You've already met most of the basics.

That's Igni. Simple text that makes real apps.
