# Igni Cold-LLM Test Prompts (v0.6.5)

First cold tests against v0.6.5. The spec adds documentation clarifications (fill layout-only, multiple events, property applicability table). Goal: does the Quizzler app — significantly harder than Dicee/Xylophone — expose gaps in the language design?

## How to use

Paste the full contents of `spec/v0.6.5.md` FIRST, then paste the prompt BELOW it in the same chat message. Fresh conversation, no prior context.

---

## 1. Quizzler app (Angela Yu Flutter Course)

> Using only the Igni language spec above, write a Quizzler app in Igni. The app is a true/false quiz. It shows one question at a time as large centred text on a dark background. Below the question are two buttons: "True" (green) and "False" (red). Tapping a button checks the answer, records whether the user was correct, and advances to the next question. At the bottom of the screen, show a row of icons representing past answers — a green checkmark for correct, a red X for incorrect. When all questions are answered, show a completion message and allow restarting. Use these 13 questions: (1) "Some cats are actually allergic to humans" — true, (2) "You can lead a cow down stairs but not up stairs." — false, (3) "Approximately one quarter of human bones are in the feet." — true, (4) "A slug's blood is green." — true, (5) "Buzz Aldrin's mother's maiden name was Moon." — true, (6) "It is illegal to pee in the Ocean in Portugal." — true, (7) "No piece of square dry paper can be folded in half more than 7 times." — false, (8) "In London, UK, if you happen to die in the House of Parliament, you are technically entitled to a state funeral." — true, (9) "The loudest sound produced by any animal is 188 decibels. That animal is the African Elephant." — false, (10) "The total surface area of two human lungs is approximately 70 square metres." — true, (11) "Google was originally called Backrub." — true, (12) "Chocolate affects a dog's heart and nervous system; a few ounces are enough to kill a small dog." — true, (13) "In West Virginia, USA, if you accidentally hit an animal with your car, you are free to take it home to eat." — true.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.
