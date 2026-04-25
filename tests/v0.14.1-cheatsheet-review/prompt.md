# Cheatsheet review prompt (v0.14.1)

Single-message prompt pasted into 4 web-LLM chat interfaces. The cheatsheet (`spec/v0.14.1-cheatsheet.md`) was embedded between the `---CHEATSHEET START---` / `---CHEATSHEET END---` markers in the actual prompt. Reproduced here for methodology traceability.

---

You are reviewing the Igni programming language cheatsheet for clarity and design quality.

Igni is a UI-first language that compiles to Flutter — indentation + colons replace braces, no parentheses on component invocation, designed for both human readability and LLM accuracy.

Read the cheatsheet carefully, then answer three questions.

---CHEATSHEET START---

[the full v0.14.1 cheatsheet was pasted here]

---CHEATSHEET END---

Now answer these three questions substantively:

**Q1 — What's strongest?** Which sections or passages read most crisply? Where do you finish reading and feel confident you understand exactly how the language behaves? What teaching choices are working well?

**Q2 — What's weakest?** Which sections or passages feel cluttered, contradictory, or harder to read than the surrounding prose? Which examples are doing too much? Which prose carries more weight than it should? Be specific about what would benefit from pruning, rewriting, or splitting.

**Q3 — Where is genuine semantic uncertainty?** Different from "weakly written." Identify places where you read carefully and still aren't sure how Igni actually behaves at runtime. Underspecified edge cases, behaviour the prose implies but doesn't pin down, places where you'd reach for a feature and not know if it's there.

Prose response, no code blocks. Be substantive — a paragraph naming a specific concern beats a vague "looks good." Where you converge with the design choices, say so.
