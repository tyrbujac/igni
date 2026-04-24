**Estimated time:** **60–90 minutes** for a complete beginner typing everything, saving often, and reading the explanations.

- **Too wordy — Section 1, Part 1, paragraph starting “Two pieces, not one.”**  
  Quote: “Two pieces, not one. `screen` makes the page; `label` puts text on it. Every Igni app starts with a `screen`, and a screen can hold labels, buttons, text boxes, and more. You'll add more pieces as you go.”  
  Cut most of this. The first two bullets already explained `screen` and `label`.

- **Too wordy — Section 2, Part 1, paragraph starting “A box with a name is called a variable.”**  
  Quote: “A box with a name is called a **variable**. You'll use them all the time.”  
  Fine idea, but the surrounding box metaphor already did the job. This could be shortened to just naming the term.

- **Too wordy — Section 2, Part 2, “What’s new?” bullets.**  
  Quote: “You can chain more than two pieces...” / “`age = 30` — this box holds a number...” / “Variables go at the top...”  
  This is a lot after a tiny example. I'd cut the first two bullets down and probably drop the “Variables go at the top...” line here.

- **Too wordy — Section 3, Part 1, bullet list under “What does each part mean?”**  
  Especially: “`is` means ‘is the same as.’ Careful: a single `=` puts something in a box. `is` asks if two things are the same. They look similar, they do completely different jobs.”  
  Good point, but explained too slowly. Could be one short sentence.

- **Too wordy — Section 4, Part 1, paragraph starting “New app, new screen name.”**  
  Quote: “Our earlier screens were all called `Hello` because they were greetings...”  
  This feels like filler. Naming the screen `Counter` is obvious from the code.

- **Too wordy — Section 4, Part 3, paragraph starting “Mind the indentation here!”**  
  Quote: “The two `button` lines sit under `layout horizontal, gap: small:`...”  
  Important idea, but too long. One sentence about “both buttons must be indented under the layout” would be enough.

- **Too wordy — Section 5, Part 1, “What does each part mean?”**  
  Especially the placeholder explanation: “Put your hint inside the double quotes.”  
  That’s already visible in the code. Can be trimmed.

- **Too wordy — Section 5, Part 3, “What’s happening?” bullets.**  
  The first two bullets restate what the code already makes very clear. Could be shorter.

- **Too wordy — Section 6 intro, paragraph starting “A function is a named list of steps.”**  
  It explains the same idea twice: “single button does several things” and “same sequence of steps in two different buttons.” For this tutorial, one plain sentence is enough.

- **Too wordy — Section 7 opening paragraph.**  
  Quote: “One more concept before we build something real...” through “The rest of the screen can then react to that switch.”  
  This is a lot of abstract setup before the code. A beginner can learn `true`/`false` from the example.

- **Over-explained — Section 1, Part 2, paragraph starting “Try this: edit the text...”**  
  Can be deleted entirely. The learner already knows they can change text and save.

- **Over-explained — Section 2, Part 1, paragraph starting “Now change what’s in the box.”**  
  Can mostly go. Changing `"Sam"` to `"Andy"` teaches itself.

- **Over-explained — Section 3, Part 1, paragraph starting “Now add `else`.”**  
  The code and the visible output are enough. The sentence “when the name isn't ‘Robin’, the `else` branch runs...” is extra.

- **Over-explained — Section 4, Part 2, paragraph starting “Modifiers. You’ve already seen this pattern...”**  
  This whole paragraph can be deleted. Beginners don’t need the abstract term right there; they can just use `style:` and `on tap:`.

- **Over-explained — Section 4, Part 2, block quote “This is reactivity.”**  
  Delete entirely for this audience. It shifts from concrete app behavior into language-design talk.

- **Over-explained — Section 5, Part 2, paragraph starting “Type your name now.”**  
  The live-updating behavior is visible immediately. The line “Same reactivity as Section 4...” is extra.

- **Over-explained — Section 5, Part 3, final paragraph “That’s reactivity again...”**  
  Delete entirely. It repeats the same abstract explanation again.

- **Over-explained — Section 6, Part 3, “What’s new?” bullets.**  
  Both bullets just restate the code structure and can be removed.

- **Over-explained — Section 8, Part 3, paragraph starting “Why the dash?”**  
  Nice detail, but not necessary for a first tutorial. The app works without that explanation.

- **Bloat — repeated “Try this” after almost every tiny step.**  
  Strongest examples:  
  - Section 1, Part 2: “edit the text a few different times”  
  - Section 3, Part 2: “try 18 or 5”  
  - Section 5, Part 1: change placeholder text  
  These feel padded because they don’t add a new concept.

- **Bloat — Section 2, Part 3 whole “Stuck? Here’s what it might look like.” details block.**  
  This is just the same code with different values. Doesn’t earn the extra space.

- **Bloat — Section 4, Part 1 “Try this: change `count = 0` to `count = 42`.”**  
  Same pattern has already been practiced with `name` and `age`. Feels repetitive.

- **Bloat — Section 6, Part 4 “Try this: add a `tie()` function...”**  
  This one is okay, but by this point the tutorial already has a lot of extension prompts. Could trim some optional tasks overall.

- **Bloat — Section 7, Part 3 “Try this: flip `snowing = false`...”**  
  Good check, but there are too many tiny state-flip exercises in this section.

- **Bloat — Section 8, Part 4 “Try this” with D20 / 1–100.**  
  Fun, but by the end the reader is done; this can be shorter or dropped.

- **Pacing — Before you start is long before the learner gets to type.**  
  From “You’ll use three things on your computer” through deleting the starter app is a lot of setup. A complete beginner probably needs some of it, but it delays the first win.

- **Pacing — Section 2, Part 2 introduces too much in one part.**  
  New lines: `age = 30`, two labels, string joining with `+`, numbers without quotes, chaining more than two pieces. That’s more than 2 new concepts in one step.

- **Pacing — Section 4, Part 3 is a bit overloaded.**  
  New code adds `layout horizontal`, `gap: small`, a second button, subtraction, and comments. That’s a lot in one part.

- **Pacing — Section 5, Part 3 adds layout + `gap` + `if/else` + `is empty` in one jump.**  
  It works because the pieces were introduced earlier, but for a true beginner it’s a dense checkpoint.

- **Pacing — Section 7 overall is too slow for the amount learned.**  
  Four parts to teach `true`/`false`, `else`, `else if`, and `and` feels stretched. Could be tighter.

- **Pacing — Section 8, Part 3 has 6 new lines and two ideas at once.**  
  The conditional UI plus the placeholder dash both arrive together. It’s understandable, but it’s one of the denser moments.

- **Voice — repeated formula pattern feels AI-ish.**  
  Examples: “What’s new?”, “What does each part mean?”, “Try this:” appear over and over in nearly every part. The repetition feels mechanical instead of like a human teacher varying rhythm.

- **Voice — abstract framing sounds less human-taught, especially around reactivity.**  
  Quotes: “There’s no wiring — re-running everything *is* the wiring.” / “Most languages make you connect every button to every label by hand. Igni doesn’t.”  
  This reads like product positioning, not a 10-year-old’s lesson.

- **Voice — Section 7 opening is especially abstract/formal.**  
  Quote: “There’s a third kind of thing: yes-or-no values, called `true` and `false`. Boxes that hold one of those two answers are the state of a switch...”  
  Feels textbook-ish and carefully composed, not natural tutoring.

- **Voice — Section 8, Part 3 sentence “That’s the dash placeholder earning its keep.”**  
  Slightly writerly / polished in a way that stands out from beginner instruction.

- **Voice — final line “That’s Igni. Simple text that makes real apps.”**  
  Sounds slogan-like. More marketing voice than tutorial voice.