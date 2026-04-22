# Igni docs

Human-facing documentation. Complements the formal spec under [`../spec/`](../spec/).

## What's here

- **[`tutorial.md`](tutorial.md)** — beginner walkthrough, no programming experience needed. The current canonical tutorial (latest revision after multiple cold-run iterations, including real-user testing). Start here if you've never written Igni.
- **[`mobile.md`](mobile.md)** — running Igni apps on iOS simulator / Android emulator via `igni run ios` / `igni run android`. Device selection rules, auto-boot behaviour, known gotchas (Cloudflare bot-challenge on third-party APIs, SafeArea history).
- **[`preregistration-phase4.md`](preregistration-phase4.md)** — dissertation pre-registration doc for Phase 4 cold-test methodology.
- **`archive/`** — prior tutorial drafts (`tutorial-v1.md` through `tutorial-v2.4.md`). Historical; the current walkthrough is `tutorial.md`.
- **`private/`** — gitignored research notes (design notes, post-ship writeups, cold-test analyses). Not public.

## How the docs relate to the spec

- **Spec** (`../spec/v0.11.6.md` and its two condensed tiers) is the formal language definition — read that to understand every rule.
- **Tutorial** teaches by example — read that to start writing Igni.
- **Mobile** is operational — read that when you need to run on a simulator or emulator.

For the project's internal design narrative (CHANGELOG, ROADMAP, ARCHITECTURE), see the repo root.
