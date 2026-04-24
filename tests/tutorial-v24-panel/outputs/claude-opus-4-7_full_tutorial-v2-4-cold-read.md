# Igni Tutorial Review

## Time estimate

For a complete beginner (10-year-old, first time coding), typing every example and saving to see results: **90–120 minutes**, probably closer to 120 with re-reads and typo fixes. Sections 1–3 are quick (~20 min total), Section 4 onwards slows down as concepts stack. Section 8 alone is ~15 min because Part 3's code block is already long before Part 4 adds more.

---

## 1. Too wordy

- **Section 1 Part 1, "Two pieces, not one" paragraph.** The paragraph after the bullets repeats what the bullets just said. "Every Igni app starts with a `screen`, and a screen can hold labels, buttons, text boxes, and more" is scope-creep filler — the kid hasn't asked what else a screen can hold. Cut the whole paragraph.

- **Section 2 Part 1, "Quotes matter" block.** Good concept but over-long. The two-line code sample plus three sentences of prose ("Quotes mean 'literal text'... No quotes means 'the thing stored under this name'... You'll use both all the time.") says the same thing three times. The code comparison alone is the lesson.

- **"If something goes wrong" paragraph at the top.** "don't panic… Igni cares about two things: the exact letters you type, and how far each line is indented… that usually means you've misspelled a name (for example, typed `nam` instead of `name`). Fix the typo and save again." This is 80 words of reassurance before the reader has done anything. Cut to one sentence: "If the browser doesn't update, check your spelling and indentation."

- **Section 4 Part 3, the indentation callout.** "They're indented **twice** (two 'steps' of spaces) — once because they're inside the screen, once more because they're inside the `layout`. Get the indentation wrong and they'll sit below the row instead of inside it." The kid can see the indentation in the code. Cut to one sentence.

- **Section 6 intro paragraph.** "You reach for one when a single button does several things and you want to give that combination a name, or when the same sequence of steps would appear in two different buttons." Too abstract, too early. Just say "A function is a named list of steps" and let Part 2 show why.

---

## 2. Over-explained (could be deleted entirely)

- **Section 1 Part 3, the whole "What's new?" block.** The code shows two `label` lines, one with `style: heading`, one without. A 10-year-old reading top-to-bottom already sees this. Delete the bullets.

- **Section 2 Part 2, the "What's new?" bullets after the two-label code.** The kid just typed it and saw it work. "You can chain more than two pieces" and "age = 30 — this box holds a number, not text" are both visible in the code they just ran.

- **Section 5 Part 2 "What's new?" bullets.** Two bullets explaining something the code's single new line already teaches. Delete.

- **Section 7 Part 2.** The whole part could be a two-line addition to Part 1 ("now add an `else:`"). Having it as its own Part makes 4 parts feel like filler.

- **Section 8 Part 3 "Why the dash?" paragraph.** This is preemptive scaffolding for a problem the reader hasn't experienced yet. Let them hit the jump in Part 4, then explain it. Or cut entirely — the dash works fine without the essay.

- **Section 4 Part 2, the reactivity blockquote.** "This is reactivity. When `count` changes, Igni re-runs the whole screen from the top… Most languages make you connect every button to every label by hand. Igni doesn't." Compares Igni to "most languages" the 10-year-old doesn't know. Delete or push to the end-matter.

---

## 3. Bloat

- **"Try this" prompts are mostly good, but these are filler:**
  - Section 1 Part 2: "edit the text a few different times, saving after each edit. Watch the browser refresh each time." — the kid's been doing this since Part 1.
  - Section 2 Part 1: "Now change what's in the box." — the section already walks them through this change, then the Try-this asks them to do it again.
  - Section 3 Part 2: "try 18 or 5" — too minimal to be worth a callout.
  - Section 7 Part 4: "add a third box `sunny = true`…" — by Section 7 these extensions are getting formulaic.

- **"What does each part mean?" / "What's new?" headers appear ~15 times.** The pattern is fine once or twice. By Section 5 it's the main structural tic of the document. Drop at least half of them; let the code + one sentence do the work.

- **Section 6 Part 4 "Try this" (`tie()` function).** By this point the kid has written `win()`, `lose()`, `reset()` — a fourth identical function adds nothing.

- **"Stuck? Here's what it might look like" details block in Section 2 Part 3.** The preceding instruction ("Put your name between the two quotes… change `0` to your age") is already concrete. Either trust them or don't — the hidden block is scaffolding on scaffolding.

- **The "What you learned" table at the end.** 18 rows is a lot. Useful, but consider trimming the obvious ones (`# anything`, `label "text"`).

---

## 4. Pacing

- **Section 8 Part 3 is too much at once.** The reader types an 8-line `if/else` block (two new labels in each branch, heading style on placeholder) on top of a layout they just built in Part 2. That's >4 new lines and introduces the "balance the branches with a dash" trick which isn't a concept they've seen. Split or simplify.

- **Section 4 Part 1 is too thin.** "Save. You see a big **0**. That's all." Feels like filler to pad to 3 parts. Could fold into Part 2.

- **Section 7 has 4 parts for what's really 2 ideas** (booleans + `and`). Parts 2 and 3 could merge; `else` is already familiar from Section 3.

- **Section 5 Part 3 labeled "Checkpoint"** lands a `layout vertical`, an `if/else`, and `is empty` all at once — and `layout vertical` hasn't been shown yet in the tutorial (`layout horizontal` was Section 4). First exposure to vertical layout shouldn't be buried inside a combined checkpoint.

- **"Before you start" section is long** before the reader has seen any code. A kid who just wants to type something has to wade through editor setup, terminal setup, browser choice, Ctrl+C instructions. Trim aggressively or move some to a separate setup page.

- **Reading-to-typing ratio is heavy in Section 2 Part 2.** Two code examples, then ~12 lines of prose/bullets before moving on.

---

## 5. Voice

- **"Do this → see that"** in the intro. Reads like a product tagline, not a teacher talking to a kid.

- **"Every line load-bearing"** in the README doesn't apply here but similar framing leaks into the tutorial: "The win here is: you got text on the screen" (Section 1 Part 1). "The win here is:" is a phrase nobody says to a 10-year-old.

- **"That's the first thing you've made yours."** (Section 2 Part 3). Abstract framing. A kid wants "Nice, that's your name on screen!"

- **"Same reactivity as Section 4: the `name` box changes, the screen re-runs, the label redraws."** (Section 5 Part 2). Cross-reference-plus-technical-summary is a textbook tic, not a teaching voice.

- **"That's the dash placeholder earning its keep."** (Section 8 Part 4). Cute but reads like adult-copy, not kid-talk. Same with "Reset is a **different kind** of button: it doesn't score, it clears state."

- **Em-dashes everywhere.** I count ~40+ em-dashes across the tutorial. In nearly every "What does each part mean?" bullet: "`name = "Sam"` — this makes a box…" The rhythm becomes monotonous. A mix of periods and colons would read more human.

- **"The connective tissue is one rule"** (cheatsheet, but same author-voice leaks in). In the tutorial: "That's reactivity again: no extra glue, no wiring." These metaphors (connective tissue, glue, wiring) are abstract frames a 10-year-old doesn't need.

- **Formulaic Part openings.** Sections 4, 5, 6, 7, 8 all open with the same pattern: code block → "Save." → one-sentence observation → "What's new?" bullets. By Section 6 the reader knows the rhythm, and it feels like filling a template rather than teaching.

- **"Modifiers" callout in Section 4 Part 2.** "You've already seen this pattern; now we're naming it." This is the exact voice of a technical writer introducing jargon, not a kid-facing lesson. The word "modifier" might not even be necessary — they've been using them for 4 sections without a name.

---

## Summary of biggest cuts

If I were trimming for a single-sitting (60-min) read:
1. Delete every "What's new?" block from Section 5 onward (kids have the pattern).
2. Merge Section 7 Parts 1–2, and Section 4 Parts 1–2.
3. Cut the "Two pieces, not one" paragraph (S1P1), "Why the dash?" paragraph (S8P3), and the reactivity blockquote (S4P2).
4. Shorten "Before you start" by half.
5. Replace ~30% of em-dashes with periods to break up the rhythm.

The tutorial is solid and well-sequenced — the problems are almost all additive (too much), not structural.