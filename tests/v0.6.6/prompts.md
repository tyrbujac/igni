# Igni Cold-LLM Test Prompts (v0.6.6)

First cold tests against the v0.6.6 cheatsheet (learning-order restructure). Testing with cheatsheet only — no full spec.

## How to use

Paste the full contents of `spec/v0.6.6-cheatsheet.md` FIRST, then paste the prompt BELOW it in the same chat message. Fresh conversation, no prior context.

---

## 1. Destini app (Angela Yu Flutter Course)

> Using only the Igni language spec above, write a Destini app in Igni — a choose-your-own-adventure story game. The app shows story text centred on a dark background with a background image ("background.png"). Below the text are two choice buttons (one red, one blue). Tapping a choice advances to a different story node based on the branching logic. Some story nodes are endings — they have only one button ("Restart") that resets to the beginning. The second button should be hidden at endings.
>
> Use these 6 story nodes (zero-indexed):
>
> Story 0: "Your car has blown a tire on a winding road in the middle of nowhere with no cell phone reception. You decide to hitchhike. A rusty pickup truck rumbles to a stop next to you. A man with a wide brimmed hat with soulless eyes opens the passenger door for you and asks: Need a ride, boy?." — Choice 1: "I'll hop in. Thanks for the help!" → go to story 2 — Choice 2: "Better ask him if he's a murderer first." → go to story 1
>
> Story 1: "He nods slowly, unphased by the question." — Choice 1: "At least he's honest. I'll climb in." → go to story 2 — Choice 2: "Wait, I know how to change a tire." → go to story 3
>
> Story 2: "As you begin to drive, the stranger starts talking about his relationship with his mother. He gets angrier and angrier by the minute. He asks you to open the glovebox. Inside you find a bloody knife, two severed fingers, and a cassette tape of Elton John. He reaches for the glove box." — Choice 1: "I love Elton John! Hand him the cassette tape." → go to story 5 — Choice 2: "It's him or me! You take the knife and stab him." → go to story 4
>
> Story 3 (ending): "What? Such a cop out! Did you know traffic accidents are the second leading cause of accidental death for most adult age groups?" — Restart button only
>
> Story 4 (ending): "As you smash through the guardrail and careen towards the jagged rocks below you reflect on the dubious wisdom of stabbing someone while they are driving a car you are in." — Restart button only
>
> Story 5 (ending): "You bond with the murderer while crooning verses of Can you feel the love tonight. He drops you off at the next town. Before you go he asks you if you know any good places to dump bodies. You reply: Try the pier." — Restart button only
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.
