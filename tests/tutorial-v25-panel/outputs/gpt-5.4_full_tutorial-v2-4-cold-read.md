**Estimated time:** **45–60 minutes** for a complete beginner typing every example, saving, and poking at the results a bit.

- **Too wordy — Before you start, paragraph:** “**If something goes wrong:** check your spelling and indentation, then save again. If the browser doesn't change and the terminal shows red text, you've usually misspelled a name...”  
  Cut the second sentence after “save again.” The example (`nam` instead of `name`) is extra here.

- **Too wordy — Before you start, setup list:** “**You'll need:** 1. A text editor... 2. A terminal... 3. Chrome...”  
  This is longer than needed for a tutorial that immediately gives the commands. The editor/terminal launch instructions are verbose; trim the “on Mac press... on Windows press...” wording.

- **Too wordy — Section 2, Part 1:** “**Make a box, put something in it, show what's inside:**” plus the three bullets below the code.  
  The “box” metaphor is fine once, but all three bullets together are too much. Keep one short explanation; cut the repeated “puts... inside / look inside” wording.

- **Too wordy — Section 2, Part 2 bullets:** “`+` joins pieces of text together... `age = 30` — no quotes... Variables go at the top...”  
  The third bullet is the useful one. The first two are obvious from the code and result; they can be cut or compressed.

- **Too wordy — Section 3, Part 1 bullets:** “`if name is "Robin":` asks... `else:` means... `is` asks... The lines below...”  
  This is four explanation bullets for a tiny example. Cut at least the `else:` bullet and probably the `is` bullet too.

- **Too wordy — Section 3, Part 2:** the list of comparison operators before the code (`age > 18`, `age < 18`, `age >= 18`, `age <= 18`).  
  Too much preamble before typing. Show only the one used in the example (`>=`) and leave the others for later.

- **Too wordy — Section 4, Part 1 bullets:** all four bullets after the counter example.  
  This repeats what the code already says line by line. Cut at least `count = 0`, `label count`, and `button "Add one"` bullets.

- **Too wordy — Section 5, Part 1 bullets:** “`name = ""`... `input bind: name`... `placeholder:`...”  
  The placeholder explanation is enough; the rest is self-evident from typing and seeing it.

- **Too wordy — Section 6 opener:** “**A function is a named list of steps. Reach for one when a button does several things and you want to name that combination.**”  
  Not terrible, but a bit textbooky. Could be shortened to one sentence.

- **Too wordy — Section 8, Part 4 bullets:** “`random(1, 6)` — picks... `rolled = true` — flip the box...”  
  The first bullet is useful; the second is repetitive after the earlier `rolled` explanation.

- **Over-explained — Section 1, Part 1:** “You see Hello World in the browser.” and the two bullets after it.  
  The code fully teaches this. The line about the colon meaning “here's what goes on this page” could stay, but the rest could be deleted.

- **Over-explained — Section 1, Part 2:** “Save. The text is noticeably bigger...”  
  This paragraph can be deleted entirely. The visual result makes it obvious.

- **Over-explained — Section 1, Part 3:** “Both lines appear, one below the other...”  
  Delete entirely. The example shows stacking on its own.

- **Over-explained — Section 2, Part 1:** the paragraph after “A box with a name is called a variable.” starting “**Without the quotes, Igni looks inside the box...**”  
  Delete this whole explanation block. The paired example already demonstrates it.

- **Over-explained — Section 3, Part 1:** “You see Welcome back, Robin! Now change...”  
  The reader is already told to edit and save throughout; this can be trimmed hard or removed.

- **Over-explained — Section 4, Part 2:** “Two buttons in a row, with the number below them.”  
  Delete. It adds nothing beyond the screenshot-in-your-head from running it.

- **Over-explained — Section 5, Part 2:** “Type your name. The greeting updates letter by letter as you type.”  
  Delete. The live result is the lesson.

- **Over-explained — Section 6, Part 3:** “Second button in the row, second function at the bottom.”  
  Delete entirely; pure narration.

- **Over-explained — Section 7, Part 2:** “Save — Snow day. The `if raining:` check was false, so Igni tried...”  
  Delete. It narrates exactly what `else if` means right after showing it.

- **Over-explained — Section 8, Part 2:** “Now you see the title, centred with spacing.”  
  Delete. Pure visual narration.

- **Bloat — Before you start:** “**Prefer Safari, Firefox, or Arc?** Use `igni run localhost`...”  
  Feels like side-track setup bloat in a beginner lesson. Drop from the main tutorial.

- **Bloat — Section 4, Part 2:** “**Try this:** add a third button labelled "+10"...”  
  Optional exercise is okay once or twice, but this one feels padding-like because another “Try this” comes later too.

- **Bloat — Section 8, Part 4:** “**Try this:** change `random(1, 6)` to `random(1, 20)`...”  
  This one is harmless, but alongside the others it starts to feel padded. If trimming, drop this before cutting core instruction.

- **Bloat — Final section “What you learned” table:** whole table.  
  Feels recap-heavy after a linear beginner tutorial where each concept was already introduced in order. Good reference, but padded inside the tutorial flow.

- **Bloat — Final section “What to build next”:** especially the long **Rock Paper Scissors** prompt with starter code and extension instructions.  
  This is the biggest padding block in the file. It turns the tutorial into a mini-idea list instead of ending cleanly.

- **Pacing — Before you start:** too much reading before the first code.  
  A beginner reads setup notes, prerequisites, terminal instructions, browser preference note, editor-opening steps, and deletion instructions before typing `screen Hello:`.

- **Pacing — Section 2, Part 1:** introduces variables plus the “box” metaphor plus quotes-vs-no-quotes distinction all at once.  
  Not terrible, but slightly dense for the first real concept after labels.

- **Pacing — Section 2, Part 2:** introduces numbers and string concatenation in the same step.  
  That’s two concepts plus a mixed-type example (`"I am " + age + " years old"`) that may raise questions for a true beginner.

- **Pacing — Section 3, Part 2:** too much theory before code.  
  The four-operator list is more like reference material than tutorial pacing.

- **Pacing — Section 4, Part 3:** introduces `layout vertical`, `gap`, `padding`, and `align` in one part.  
  That’s four new knobs at once. Feels like a jump after only one earlier layout example.

- **Pacing — Section 5, Part 3:** combines layout, conditionals, and `is empty` in a single checkpoint.  
  It works, but it’s one of the denser moments because the reader is suddenly integrating several earlier ideas.

- **Pacing — Section 7 overall:** `true/false`, bare boolean conditions (`if raining:`), `else if`, and `and` all land in one section with only three short parts.  
  This is a lot of logic vocabulary in a row for a first-timer.

- **Voice — Before you start:** “**Already set up?** If `igni run` is running...”  
  Reads polished/product copy rather than a human teacher easing a kid in.

- **Voice — repeated structure throughout:** lots of “Save. You see...” / “Save — you see...” / “Type your name...” openings.  
  Formula gets noticeable by the middle. It starts sounding generated because each part follows the same narration template.

- **Voice — Section 6 opener:** “**A function is a named list of steps. Reach for one when a button does several things...**”  
  Slightly abstract and adult-sounding compared with the otherwise simple tone.

- **Voice — Section 8 opener:** “**Let's build something real.**”  
  Slightly canned/tutorial-generic.

- **Voice — Section 8 ending:** “**A working dice roller in 15 lines. You built an app.**”  
  Not bad, but reads a little slogan-like.

- **Voice — Final section “What to build next”:** “**You've got almost everything — except function parameters (one new concept). Starter:**”  
  This has a structured, content-generator feel rather than sounding like a person naturally wrapping up a lesson.