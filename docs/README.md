# Igni docs

Human-facing documentation. Complements the formal spec under [`../spec/`](../spec/).

## What's here

- **[`tutorial.md`](tutorial.md)** — beginner walkthrough, no programming experience needed. The current canonical tutorial (latest revision after multiple cold-run iterations, including real-user testing). Start here if you've never written Igni.
- **[`cookbook.md`](cookbook.md)** — task-shaped recipes ("how do I X") for the patterns that come up after the tutorial: list-with-delete, form validation, multi-screen navigation, fetch with loading states, max_width-capped cards, wrapper components with body slot, emit/on event channels. Lookup-by-intent rather than lookup-by-feature.
- **[`migrating-from-flutter.md`](migrating-from-flutter.md)** — port-this-snippet walkthrough for Flutter developers. Three side-by-side comparisons (counter, fetch, list-with-delete), explicit non-goals, when to drop into raw Flutter.
- **[`cycle.md`](cycle.md)** — the 9-stage spec-iteration cycle (design → review → ship → Stage 3 → critique → synthesis → patch). Names each stage's command + output + human checkpoint. Read this before touching the spec.
- **[`mobile.md`](mobile.md)** — running Igni apps on iOS simulator / Android emulator via `igni run ios` / `igni run android`. Device selection rules, auto-boot behaviour, known gotchas (Cloudflare bot-challenge on third-party APIs, SafeArea history).
- **[`preregistration-phase4.md`](preregistration-phase4.md)** — dissertation pre-registration doc for Phase 4 cold-test methodology.
- **`archive/`** — prior tutorial drafts (`tutorial-v1.md` through `tutorial-v2.4.md`). Historical; the current walkthrough is `tutorial.md`.
- **`private/`** — gitignored research notes (design notes, post-ship writeups, cold-test analyses). Not public.

## How the docs relate to the spec

- **Spec** (`../spec/v0.22.0.md` and its two condensed tiers) is the formal language definition — read that to understand every rule.
- **Tutorial** teaches by example — read that to start writing Igni.
- **Mobile** is operational — read that when you need to run on a simulator or emulator.

For the project's internal design narrative (CHANGELOG, ROADMAP, ARCHITECTURE), see the repo root.
