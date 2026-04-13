# Igni Cold-LLM Test Prompts (v0.6.6)

Cold tests against v0.6.6. Two rounds: cheatsheet-only (v0.6.6-cheatsheet.md) and full spec (v0.6.6.md, post-doc-fixes). Same prompts for both rounds.

## How to use

Paste the full contents of the spec FIRST, then paste the prompt BELOW it in the same chat message. Fresh conversation, no prior context.

- **Prompt 1 (Destini):** tested with both cheatsheet (`v0.6.6-cheatsheet.md`) and full spec (`v0.6.6.md`)
- **Prompts 2–3 (Contacts, Settings):** full spec only (`v0.6.6.md`, post-doc-fixes)

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

---

## 2. Contacts app (multi-screen CRUD)

> Using only the Igni language spec above, write a Contacts app in Igni — a multi-screen contact manager.
>
> The app stores contacts in shared state, pre-populated with 3 sample contacts (each with an id, name, phone, and email).
>
> **Screen 1 — Contact List:**
> - A search input at the top that filters contacts by name as you type (case-insensitive matching)
> - A button to toggle between alphabetical (A→Z) and reverse alphabetical (Z→A) sort order
> - Each contact shown in a reusable card component (card background, rounded corners, padding) displaying the contact's name as a small heading and phone number below it
> - Tapping a contact navigates to the detail screen
>
> **Screen 2 — Contact Detail:**
> - Fetches extra details from "/api/contacts/" + contact.id (show a spinner while loading, an error message if the fetch fails)
> - Displays the contact's name, phone, and email with section headings
> - An "Edit" button that toggles between view mode and edit mode (edit mode shows input fields for name, phone, email)
> - A "Save" button that updates the contact in the shared contacts list and navigates back
> - A "Delete" button that removes the contact from the shared list and navigates back
>
> Show the complete Igni code first, then briefly explain any design decisions you made.

---

## 3. Settings app (single-screen, input primitives)

> Using only the Igni language spec above, write a Settings app in Igni — a single-screen settings page.
>
> The screen has four sections, each with a smaller heading style (not full-size headings):
>
> **"Profile" section:**
> - Displays the user's name and email
> - An avatar image (use "avatar.png", displayed as a circle)
>
> **"Location" section:**
> - A dropdown to select country (options: "UK", "US", "France", "Germany") — when the country is changed, reset the city to empty and update the available cities for that country
> - A dropdown to select city (options depend on the selected country)
>
> **"Preferences" section:**
> - A toggle for dark mode
> - A toggle for notifications
> - A slider for text size (min 12, max 24)
>
> **"Account" section:**
> - A checkbox for "Remember me"
> - A "Log out" button in a danger/red colour
>
> Show the complete Igni code first, then briefly explain any design decisions you made.
