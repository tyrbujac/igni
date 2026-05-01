# v0.21 Phase 4 — Flutter cells

Three framework-agnostic app descriptions with Flutter framework header. Same body as `prompts-igni.md`. Run with `--no-spec` (no cheatsheet — relies on training-corpus Flutter knowledge, matching real-world Flutter LLM usage).

---

## 1. mi-card

> Build this app in Flutter using `package:flutter/material.dart` only — no external packages (no provider, no flutter_bloc, no get_it, etc.). Output a single `main.dart` source file in a fenced code block. Include `void main() => runApp(...)` as the entry point.
>
> Build a single-screen identity-card app. The screen has a teal background. Centred vertically, top-to-bottom: a circular avatar image (140px diameter, file `avatar.png`), the name "Joe Bloggs" rendered as a heading, the role "IGNI DEVELOPER" in white text below the name. Then two information rows, each shown as a horizontal pill with a light card background, rounded corners, and medium padding: one row with a phone icon (teal) and the text "+44 123 456 7890"; the next row with a mail icon (teal) and the text "joe@bloggs.dev". Stack them with medium gaps. Assume `avatar.png` exists in the project's assets folder.

---

## 2. bmi

> Build this app in Flutter using `package:flutter/material.dart` only — no external packages (no provider, no flutter_bloc, no get_it, etc.). Output a single `main.dart` source file in a fenced code block. Include `void main() => runApp(...)` as the entry point.
>
> Build a two-screen BMI calculator app with shared state for height (default 180), weight (default 60), age (default 20), and gender (default "male").
>
> Screen 1 ("BMI CALCULATOR"): two horizontally-arranged gender cards (Male / Female) — selecting one stores the choice in shared state and visually highlights the chosen card. Below: a height card with the current height as a heading + "cm" label and a slider (range 120–220) bound to height. Below: two horizontally-arranged value cards for Weight and Age, each with the current value as a heading and `–` / `+` circular stepper buttons that decrement / increment the shared value. A "CALCULATE" button at the bottom navigates to the results screen.
>
> Screen 2 ("YOUR RESULT"): compute `bmi = weight / ((height/100) * (height/100))`. Show a category label coloured by status — "UNDERWEIGHT" (blue, if bmi < 18.5), "NORMAL" (green, if 18.5 ≤ bmi < 25), "OVERWEIGHT" (orange, if bmi ≥ 25). Below: the BMI rounded to one decimal as a heading. Below: a one-sentence advice string per category. Bottom: "RE-CALCULATE" button that navigates back.

---

## 3. pomodonut

> Build this app in Flutter using `package:flutter/material.dart` only — no external packages (no provider, no flutter_bloc, no get_it, etc.). Output a single `main.dart` source file in a fenced code block. Include `void main() => runApp(...)` as the entry point.
>
> Build a Pomodoro timer app with shared state for work duration (default 25 minutes), break duration (default 5 minutes), and a sound toggle (default on).
>
> Screen 1 ("Pomodonut"): show the current segment label ("Work" or "Break") as a heading. Below: a countdown timer formatted as `MM:SS`, also as a heading. Below: a horizontal row with a Start/Pause toggle button (shows "Start" when stopped, "Pause" when running) and a "Reset" button. Bottom: a "Settings" button that navigates to the settings screen.
>
> The timer ticks every second while running. When the countdown reaches zero, swap segment (work → break or break → work), play `ding.wav` if sound is on, and continue. Pause stops the tick; Reset returns to the start of the current segment. Assume `ding.wav` exists in the project's assets folder. (For audio playback you may either invoke a placeholder function and assume an audio package exists, OR omit the playback call entirely and just swap segments — your choice.)
>
> Screen 2 ("Settings"): two slider rows (work duration 1–60, break duration 1–30) bound to shared state, each showing the current value. A sound on/off toggle. A "Back" button that navigates back.
