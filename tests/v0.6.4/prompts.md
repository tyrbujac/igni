# Igni Cold-LLM Test Prompts (v0.6.4)

First cold tests against v0.6.4. The spec adds screen properties (`title:`, `background:`), `fill: true` on layouts, extended colours, and local image assets. Goal: do models find and use the new features correctly?

## How to use

Paste the full contents of `spec/v0.6.4.md` FIRST, then paste the prompt BELOW it in the same chat message. Fresh conversation, no prior context.

---

## 1. Xylophone app (Angela Yu Flutter Course)

> Using only the Igni language spec above, write a Xylophone app in Igni. The app shows 7 coloured bars stacked vertically, each filling equal space on the screen. The colours from top to bottom are: red, orange, yellow, green, teal, blue, purple. The background is black. Tapping a bar plays a different note (note 1 through note 7). Each bar should fill the available vertical space equally. Use fill: true from the spec's layout properties.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.
