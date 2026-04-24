# Tutorial v2.4 LLM-panel review prompts

## 1. Tutorial v2.4 cold read

> You are reading `docs/tutorial.md`, the beginner tutorial for a small custom
> programming language called Igni. Act as if you're a smart 10-year-old
> learning to code for the first time.
>
> **First:** roughly how long would it take a complete beginner to work through
> this tutorial from Section 1 to Section 8, typing each code example and saving
> to see the result? Give a time estimate in minutes.
>
> **Then flag findings, one per bullet:**
>
> 1. **Too wordy** — paragraphs where the prose is longer than needed. Point at
>    the specific paragraph and say what you'd cut.
> 2. **Over-explained** — places where the code example teaches itself but the
>    text keeps adding explanation. Which paragraphs could be deleted entirely?
> 3. **Bloat** — "Try this" prompts, "What's new" bullets, or scaffolding that
>    feels padded. Which should be trimmed or dropped?
> 4. **Pacing** — sections where the reader reads too much before typing, or
>    where too much lands in one part (>4 new lines of code, >2 new concepts).
> 5. **Voice** — prose that reads AI-written rather than human-taught
>    (formulaic structure, heavy punctuation, abstract framing).
>
> Do NOT rewrite. Do NOT suggest new features. Just flag what's too much and
> what should go. Be specific — section and part numbers, paragraph quotes.
