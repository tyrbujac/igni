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

**Igni is already set up on your machine for this tutorial.** If you're in a workshop, your facilitator has you covered.

### Make a new app

In the terminal, type this and press Enter:

```bash
igni new learn-igni
```

This creates a new folder called `learn-igni` with a starter app inside. **Check it worked:** you should see the `learn-igni` folder appear in your file list. If you see red text, flag your facilitator — setup glitches are rare and never your fault.

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
  label "Welcome to Igni", style: heading
```

Save. Both lines appear, one below the other, with the second one noticeably bigger. Things stack from top to bottom — just add more lines.

**What's new?**

- You can have as many `label` lines as you want. Each one shows text on the screen, and they appear in order from top to bottom.
- That `, style: heading` on the second label makes the text bigger. We'll name the pattern in Step 9.

---

## Step 4: Put something in a box

This step has two small beats. The first is weirdly blank — that's the whole point.

**Beat 1** — just the box:

```igni
screen Hello:
  name = "Sam"
```

Save. The screen is blank. That's expected.

You just made a **box** called `name` and put "Sam" inside it. But you haven't told Igni to *show* the box anywhere, so nothing appears. Boxes exist silently until you use them.

**Beat 2** — now show it:

```igni
screen Hello:
  name = "Sam"
  label name
```

Save. Now you see **Sam**.

**What's new?**

- `name = "Sam"` — this creates a box called `name` holding "Sam". The equals sign `=` means "put this into this box."
- `label name` — no quotes around `name`, so Igni looks inside the box and shows what's there. That's why you see **Sam**, not the word "name."

**Quotes matter.** These two lines look almost the same but do completely different things:

```igni
label "name"
label name
```

Quotes mean "literal text" — show these exact letters, so you'd see the word **name**. No quotes means "the thing stored under this name" — look inside the box, so you see **Sam**. You'll use both all the time.

---

## Step 5: Join things together

Two beats again — start small, then add more.

**Beat 1** — join a label and a box:

```igni
screen Hello:
  name = "Sam"
  label "Hi, I'm " + name
```

Save. You see **Hi, I'm Sam**.

`+` joins pieces of text together. `"Hi, I'm " + name` sticks the text "Hi, I'm " and whatever is in the `name` box together.

**Beat 2** — add a number:

```igni
screen Hello:
  name = "Sam"
  age = 30

  label "Hi, I'm " + name
  label "I am " + age + " years old"
```

Save. You see **Hi, I'm Sam** and **I am 30 years old**.

**What's new?**

- You can chain more than two pieces: `"I am " + age + " years old"` joins three.
- `age = 30` — this box holds a number, not text. Notice no quotes around `30` — quoted `"30"` would be the text "30", unquoted `30` is the number thirty. Igni treats them differently.

---

## Step 6: Make it yours

See the `"Sam"` and the `30` in your code? Change them to your own real name and age.

For example, if your name is Alex and you're 42, your code would look like this:

```igni
screen Hello:
  name = "Alex"
  age = 42

  label "Hi, I'm " + name
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

  if name is "Alex":
    label "Welcome back, Alex!"
  else:
    label "Nice to meet you"
```

Because the `name` box holds "Alex", you see **Welcome back, Alex!** Now change `name = "Alex"` to `name = "Taylor"` and save. The message switches to **Nice to meet you**.

**What does each part mean?**

- `if name is "Alex":` — asks: "does the `name` box contain Alex?" The colon at the end means "here's what to do if yes."
- `else:` — means "otherwise." If the answer was no, do this instead.
- The lines below `if` and `else` are **indented** (pushed to the right). That's how Igni knows they belong to the `if` or the `else`.
- `is` means "is the same as." Careful: a single `=` *puts something in a box*. `is` *asks if two things are the same*. They look similar, they do completely different jobs.

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
  age = 42

  if age >= 18:
    label "You are an adult"
  else:
    label "You are a child"
```

You see **You are an adult**. Now change `age = 42` to `age = 10`. Save. It switches to **You are a child**.

**Try this:** try 18 or 5. Save each time. Watch the text flip.

---

## Step 9: Make a button

```igni
screen Counter:
  count = 0

  label count, style: heading
  button "Add one", on tap: count = count + 1
```

Tap the button. Watch the number go up!

**New app, new screen name.** Our earlier screens were all called `Hello` because they were greetings. This one is a counter, so we call it `Counter`. Screens are named after what the app does. Name yours anything you like — it's just a label for you and anyone reading the code.

**What does each part mean?**

- `count = 0` — a box called `count` that starts at zero.
- `label count` — shows whatever number is in the `count` box on the screen.
- `style: heading` — makes the text big.
- `button "Add one"` — a button with the text "Add one" written on it. The text inside the double quotes is what appears on the button.
- `on tap: count = count + 1` — when someone taps the button, it takes whatever number is in `count`, adds 1, and puts the result back.

**Modifiers.** You've already seen this pattern — now we're naming it. After a primitive name, you can add **modifiers** separated by commas, each shaped like `name: value`. `style: heading` is one modifier. `on tap: ...` is another. You'll see more modifiers in the next steps.

**Try this:** change `+ 1` to `+ 2`. Save. The counter jumps by two each tap.

> **This is reactivity.** When `count` changes, Igni re-runs the whole screen from the top. The label uses `count`, so it redraws with the new number. There's no wiring — re-running everything *is* the wiring. Most languages make you connect every button to every label by hand. Igni doesn't.

---

## Step 10: More buttons side by side

One button is fine. But related actions feel better when they sit next to each other. A **row** keeps them close.

Take your Counter from Step 9 and add two more buttons — a "-1" to subtract, and a "Reset" to zero it out:

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
- `gap: small` — a modifier on `layout` that adds a little space between the buttons so they don't squish together.

**Try this:** add a fourth button labelled "+10" that adds ten to the count in one tap. Make sure it sits in the same row as the others.

**Remember Step 1?** That Hello World sitting lonely in the top-left corner. Layout is how you fix it. Replace everything in your file with this:

```igni
screen Hello:
  layout vertical, align: center, padding: large:
    label "Hello World", style: heading
```

Save. Same text, completely different feeling.

---

## Step 11: Let someone type

New app: a greeter that says hello to whoever types their name.

```igni
screen Greeter:
  name = ""

  input bind: name, placeholder: "What is your name?"
  label "Hello, " + name
```

Type your name into the text box. Watch the greeting update as you type — same reactivity as Step 9: the `name` box changes, the screen re-runs, the label redraws.

> **You might not see a box around the input yet.** The text box is there and works, but its outline isn't drawn — that's a styling fix we're shipping soon. Click where the placeholder text is and start typing; your characters will appear.

**What does each part mean?**

- `name = ""` — a box called `name` that starts empty. The `""` (two double quotes with nothing between them) means "nothing inside yet."
- `input bind: name` — puts a text box on the screen. `bind:` is a modifier that **connects** the input to the `name` box — whatever you type goes straight in.
- `placeholder: "What is your name?"` — another modifier. The grey hint text you see before typing. Put your hint inside the double quotes.

**Try this:** change the `placeholder` text to a different question — "Who are you?" or "Enter your nickname." Save and watch the grey hint update.

---

## Step 12: Checkpoint — combine what you know

Let's put Steps 7 and 11 together. A text box that greets you — but politely asks for your name when you haven't typed anything yet.

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

That's reactivity again — no extra glue, no wiring. If a box changes and a screen uses it, the screen re-runs.

**Try this:** change the `is empty` branch to show "Waiting for your name...", and change the `else` branch to show `"Hello, " + name + "! Nice to meet you."`. Save. Start with an empty text box — you see the waiting message. Type your name — the greeting with the friendly ending appears.

---

## Step 13: Use a function

A **function** is a named list of steps. You reach for one when:

- The same sequence of steps would appear in two different buttons, **or**
- A single button does several things and you want to give that combination a name.

Let's make a scoreboard. Two buttons: **Win** adds a point and shows "Nice one!"; **Lose** takes a point away and shows "Try again!". Each button is about to do two things, so each gets its own function.

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

Tap **Win** — the score goes up and the message changes. Tap **Lose** — the score goes down and the message changes again.

**What does each part mean?**

- `win():` — this creates a function called "win." The parentheses `()` and colon `:` are always there.
- `on tap: win()` — when the button is tapped, run all the steps inside the `win` function.
- Inside the function, each line is one step. `win()` does two things: increases the score AND changes the message.
- Functions go at the bottom of the screen, after all the labels and buttons.

**Try this:** add a `tie()` function that sets `message = "Draw."` without changing the score. Wire a third button in the same row to run it.

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

Try it now — a weather app with two true-or-false boxes:

```igni
screen Weather:
  raining = false
  snowing = false

  if raining and snowing:
    label "Sleet! Bundle up."
  else if raining:
    label "Bring an umbrella"
  else if snowing:
    label "Snow day"
  else:
    label "Enjoy the sun"
```

Save — you see **Enjoy the sun**. Now walk through the weather:

- Change `raining = false` to `raining = true`. Save → **Bring an umbrella**.
- Flip `snowing = true` too (both are true now). Save → **Sleet! Bundle up.**
- Change `raining = false`, keep `snowing = true`. Save → **Snow day**.

**What's new?**

- **`and` combines two checks.** `raining and snowing` is only true when *both* are true. Use it whenever "both things must be true" matters.
- **`else if`** lets you check another thing if the first was false — like asking a follow-up question. You can chain as many as you need.

You'll use this shape in the very next step — the dice roller needs a `rolled = false` box to track whether the player has tapped Roll yet, so the screen can say "Tap Roll to start!" before the first roll and "You rolled: 4" afterward.

**Try this:** add a third box `sunny = true` and an `else if sunny:` branch that says "Put on sunglasses!" Think about where it fits in the chain.

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
- `layout vertical, gap: medium, padding: large, align: center:` — stacks things top to bottom, with three modifiers controlling spacing: `gap` between items, `padding` around the edges, `align: center` to centre everything.
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
| `if / else if / else:` | Branches |
| `a and b` | Both must be true |
| `button "text", on tap:` | A button that does something when tapped |
| `input bind: name` | A text box connected to a box |
| `layout horizontal:` | Puts things side by side |
| `layout vertical, gap:, padding:` | Stacks things with spacing |
| `function_name():` | A named list of steps |
| `random(1, 6)` | Picks a random number |

## What to build next

You know enough Igni now to build real things. Some ideas to try:

- **A tip calculator.** Input for the bill amount, a slider for the tip percentage, a label showing the total. Uses Steps 8, 11, and the `+` / `*` arithmetic from Step 5.
- **A shopping list.** A text input for new items, a button to add them, a label counting how many you've got. Next step: learn about **lists** in the cheatsheet.
- **A quiz game.** A question, four buttons for answers, a score that goes up when the right one is tapped. Uses Steps 7, 9, and 13.
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

  Save and tap a button — you'll see your choice. Now extend `play(choice)`: pick a computer choice with `random(1, 3)`, compare to `choice`, and set `result` to who won. Check the cheatsheet for how to pass arguments to a function.

When you're ready for more, the **cheatsheet** is your next stop — it has every Igni feature in one place. You've already met most of the basics.

That's Igni. Simple text that makes real apps.
