# Tutorial review (as a smart 10-year-old learning to code)

## Time estimate

**75–100 minutes** to work through Section 1 to Section 8 typing every example. That's:
- ~5 min setup (if Igni's already installed)
- ~5–8 min per Part, with 24 Parts across the 8 sections
- Plus re-reads when something doesn't work

If a kid gets stuck on indentation or a typo even once, add 10 min. Realistically this is a 2-sitting tutorial, not one sitting.

---

## 1. Too wordy

- **Section 2 Part 1** — The box/variable explanation has three near-duplicates: the bullet list ("A box with a name is called a **variable**"), then the "Without the quotes..." paragraph, then the `label "name"` / `label name` code contrast, then a sentence explaining that contrast. The contrast code alone does the job. Cut everything between "show what's there." and the code block, and cut the sentence after it.

- **Section 4 Part 2** — "`layout horizontal:` puts things side by side instead of stacking them. Everything indented under it goes in the row." The second sentence just restates "side by side." Cut it.

- **Section 4 Part 3** — The opening "`layout horizontal:` puts things in a row. `layout vertical:` stacks them top-to-bottom — with modifiers to control spacing and alignment:" restates Part 2 then previews what the code shows. Cut to one sentence.

- **Section 8 Part 1** — "Blank screen — no UI yet. `result` is the box for the dice number. `rolled` tracks whether the player has tapped Roll yet." All three sentences explain code the reader just wrote. One would do.

- **"Before you start"** — the three-numbered list then the terminal block then the "Prefer Safari..." aside is a lot before the kid types anything. The Cursor/Terminal/Chrome list especially — if they got this far they have all three.

## 2. Over-explained (delete whole paragraphs)

- **Section 1 Part 3** — "Both lines appear, one below the other. The first is big (because of `style: heading`), the second is normal size. Things stack top to bottom — add more lines whenever you want." The code literally shows this on save. Delete the whole paragraph.

- **Section 3 Part 1** — The four-bullet breakdown after the second code example (`if name is "Robin":`, `else:`, `is`, indentation) re-explains what the working code just taught. The `=` vs `is` warning is the only bit worth keeping.

- **Section 4 Part 1** — The four-bullet list explaining `count = 0`, `label count`, `button "Add one"`, and `on tap:` — by Section 4 the kid already knows the first two from Section 2. Keep only the `on tap: count = count + 1` line.

- **Section 5 Part 2** — "Type your name. The greeting updates letter by letter as you type." This is the entire body of Part 2 after the code. The code shows it. Delete.

- **Section 6 Part 2** — The three bullets after the code ("win():" , "on tap: win()", "layout horizontal..."). The first two are the same mechanism explained twice.

- **Section 7 Part 1** — "`raining = true` — a box holding `true`. No quotes; it's not text." The kid just saw it work. The "no quotes" is the only new fact; fold it into a single line.

## 3. Bloat

- **"Try this" prompts** — three of them (Section 4 Part 2, Section 8 Part 4, the RPS starter in "What to build next"). Section 4's ("add a third button labelled +10") is fine. Section 8's two variants of `random` are redundant with each other — pick one. The RPS starter in "What to build next" is 15 lines of code plus two paragraphs — that's a whole Section 9, not a "next idea." Cut the code or move it.

- **"What you learned" table** — 16 rows is long. Rows like `count = 0`, `rolled = false`, `name = "Robin"` are the same concept (variables) split three ways. Could be 10 rows.

- **"What to build next"** — four project ideas is one too many. Tip calculator and shopping list overlap (both are "input + arithmetic"). Drop one.

- **Section 5 Part 3 "Checkpoint"** — labelling it "Checkpoint" is scaffolding-speak. It's just a Part 3 that combines two earlier ideas. The `is empty` footnote is useful; the framing around it is padding.

- **"If something goes wrong"** paragraph at the top — the advice (check spelling, check indentation, save again) is fine, but "you've usually misspelled a name (for example `nam` instead of `name`)" is the kind of detail a kid skims past. One sentence, not three.

## 4. Pacing

- **Section 4 Part 3** — lands `gap: medium`, `padding: large`, `align: center`, AND wrapping the existing horizontal layout inside a vertical one. Four new modifiers plus a structural change in one Part. The jump from Part 2 (one row of buttons) to Part 3 (nested layouts with three modifiers) is the steepest in the tutorial.

- **Section 6 Part 2** — first function definition, first function call, AND introduces `layout horizontal` around the button "so we can add a second button without rearranging" — three concepts when one (functions) is the point of the section. The layout could wait until Part 3 when the second button actually arrives.

- **Section 7 Part 3** — the kid reads the full four-branch if/else-if/else-if/else before typing. That's a lot of control flow to stare at. Would land better if Part 2 ended with just two branches and Part 3 added `and` to the existing two-branch version, not a fresh four-branch one.

- **Section 8 Part 4** — final Part introduces `random()` (new builtin) AND the pattern of flipping a boolean to switch UI states. Two concepts, but the section has been building to it, so this one's OK — just flagging it's dense.

- **Section 2 Part 1** — Lots of prose before the second code block. A kid reads ~150 words between saving once and saving again. Typing-to-reading ratio is off.

## 5. Voice (reads AI-written)

- **Section 6 opener** — "A **function** is a named list of steps. Reach for one when a button does several things and you want to name that combination." "Reach for one when..." is stilted. A human teacher would say "Use a function when you want one button to do two things."

- **Section 7 opener** — "You've used text and numbers. There's a third kind of value: **yes-or-no**, written `true` and `false`." The "You've used X and Y. There's a third..." structure is a tell — formulaic recap-then-pivot.

- **Section 5 Part 3** — "`is empty` is a shortcut for 'has no content yet' — handy for boxes that start as `""`." The em-dash-plus-"handy-for" construction appears a few times (also Section 1 Part 2: "— your name, a joke — and save again"). A kid doesn't need "handy for"; just "works on boxes that start as `""`."

- **Section 8 Part 4 closer** — "A working dice roller in 15 lines. You built an app." Two punchy sentences back-to-back reads like a LinkedIn post. Pick one.

- **"What to build next" intro** — "Some ideas:" is fine, but the bullets all follow the same "A X. Description. Uses Y, Z." pattern. Feels templated.

- **Section 1 Part 2** — "The text is noticeably bigger." "Noticeably" is an adult-reviewer word. A kid would say "way bigger" or the tutorial would just say "bigger."

- **Repeated "Save" sentences** — "Save." / "Save —" / "Save, then..." appears as a one-word/short sentence ~20 times. After the first few sections the reader knows to save; the repetition starts reading as filler rhythm rather than instruction.

---

**Biggest single win if you only do one thing:** cut the bullet-list explanations that follow code blocks in Sections 1–6. They re-explain what the save-and-see loop already taught. That alone would probably drop the tutorial by 15–20% and speed it up.