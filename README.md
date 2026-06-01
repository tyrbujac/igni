# Igni

[![test](https://github.com/tyrbujac/igni/actions/workflows/test.yml/badge.svg)](https://github.com/tyrbujac/igni/actions/workflows/test.yml)

**Designs that translate, not redesign.**

A programming language for building UIs — designed to be read.

**Status: research prototype.** Final-year CS dissertation project investigating whether LLM output accuracy and human readability track each other. Spec is at <!-- SYNC:version -->v0.22.0<!-- /SYNC:version -->; transpiler covers most of it; the tutorial has been through multiple cold-run iterations. Not yet production-ready. See [§ Status](#status) for the methodology + evidence.

**The hypothesis:** LLM accuracy and human readability track each other. Remove the ambiguity that trips LLMs up — no brackets on component invocation, one way to update state, a single spec document — and the language becomes nicer for humans too. Igni is that experiment.

**Concrete evidence so far:** Igni's syntax gets cold-tested on frontier LLMs (Claude, GPT, Gemini) — each round measures whether models write correct code from the docs alone, no examples. The most recent test produced **4/4 frontier adoption** of v0.13's `max_width:` tokens unprompted (Stage 3 against the docs-patched cheatsheet). An earlier round produced **0/7 wrong inventions** after a one-paragraph docs fix, down from 3/7 silent bugs. That loop is how object-update syntax, trigger wording, the geolocation primitive, and now `max_width:` tokens got locked in — the language evolves toward phrasings frontier models reach for first. Methodology and full per-round numbers in [tests/README.md](tests/README.md).

Igni transpiles to Dart/Flutter. You write short, readable source files. The toolchain handles the rest.

```igni
screen Counter:
  count = 0

  layout vertical, align: center, gap: medium:
    label count, style: heading
    button "Add", on tap: count = count + 1
```

Indentation for blocks. Colons open them. One way to do everything. No imports, no `useState`, no boilerplate. Reactivity is automatic.

## Installation

Igni isn't on npm. To install from source:

```bash
git clone https://github.com/tyrbujac/igni.git
cd igni/transpiler
npm install
```

Then symlink the CLI onto your PATH:

```bash
mkdir -p ~/.local/bin
ln -s "$(pwd)/bin/igni" ~/.local/bin/igni
# ensure ~/.local/bin is on your $PATH — add to ~/.zshrc or ~/.bashrc if not
```

Verify: `igni --help` prints the usage message.

## Quick start

**Prerequisites:** Node.js 18+, Flutter SDK, Chrome.

```bash
igni new my-app
cd my-app
```

Run it:

```bash
igni run
```

First run needs internet — `flutter create` fetches scaffold packages from pub.dev. After that, `igni run` works fully offline, theme fonts included.

`igni new` creates a starter `app.igni` and a `.gitignore` for the generated `.igni/` Flutter project. Save `app.igni`, browser updates automatically. That's it.

## Using Igni with an LLM

Igni is designed to be injected straight into your LLM's context window.

1. **The context:** paste the entire contents of [`<!-- SYNC:cheatsheet-path -->spec/v0.22.0-cheatsheet.md<!-- /SYNC:cheatsheet-path -->`](<!-- SYNC:cheatsheet-path -->spec/v0.22.0-cheatsheet.md<!-- /SYNC:cheatsheet-path -->) into your system prompt or initial message.
2. **The persona:** add this instruction: *"You are an expert Igni developer. Write concise, idiomatic Igni code using strictly the provided rules. Do not invent syntax."*
3. **The prompt:** ask for the specific UI you need. Example: *"Build a `screen Settings:` with a dark mode toggle bound to a boolean variable, and a red logout button."*

Because Igni lacks boilerplate, the model outputs the raw 5–6 lines you need, ready to save directly into your `.igni` file.

## How it works

`igni run` transpiles your `.igni` files to Dart, spins up a Flutter web server, and watches for changes. Edit, save, see the result in your browser — the loop is instant.

When Flutter or generated Dart reports an error from `main.dart`, Igni maps it back to the nearest `.igni` source line so the CLI points at code you actually wrote instead of only the generated file.

Under the hood, a hidden `.igni/` Flutter project is created automatically. You never touch it — just edit `.igni` files and save.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for how the pieces fit together (repo layout, spec files, transpiler pipeline, validation methodology). To learn Igni: start with [`docs/tutorial.md`](docs/tutorial.md), then keep [`docs/cookbook.md`](docs/cookbook.md) handy for task-shaped recipes. Coming from Flutter? See [`docs/migrating-from-flutter.md`](docs/migrating-from-flutter.md).

## What Igni is for

Igni's sweet spot is **CRUD apps, forms, list-detail UIs, and fetch-driven utility apps** — habit trackers, lightweight CRMs, simple e-commerce, internal tools, settings screens, multi-screen flows. The reactivity model and token-first styling earn their keep on this band.

The canonical user is a designer-engineer pairing Figma auto-layout designs with an LLM that authors Igni — the vocabulary match (Figma auto-layout ↔ Igni `layout`, Figma Variables ↔ Igni `theme:`) keeps the translation step low-coercion. Igni stays a useful UI language whether or not Figma is in the loop; the auto-layout / Variables alignment is a *consequence* of the spec design, not a constraint added later.

Igni is **not for creative tools** — photo editors, DAWs, video editors, drawing apps, real-time games, physics simulations all need primitives Igni explicitly rejects (imperative drawing surfaces, frame loops, raw layout dimensions, granular per-subtree reactivity, pointer events with drag lifecycle). These aren't oversights; they're the deliberate cost of the spec budget that makes Igni learnable cold. Three independent frontier-model panels converged on the same five-primitive gap (see `docs/private/92` for the local research record). For creative tools, reach for Flutter / React / SwiftUI directly.

## Why not Flutter / React / SwiftUI?

Igni is downstream of the same declarative-UI lineage as SwiftUI and Jetpack Compose, built specifically for LLM-assisted workflows. Compared to mainstream options:

- **Flutter** — Igni compiles to Flutter. You get Flutter's rendering; you skip Flutter's imperative `setState`, widget constructors, and `BuildContext` plumbing. Tradeoff: Igni's spec is deliberately smaller than Flutter's API, so features Flutter has (animations, pub.dev packages) you'd need to drop into Flutter directly for.
- **React / React Native** — Igni's reactivity is automatic reassignment (no `useState`, no setters). Similar in spirit to React but via lexical re-evaluation instead of hook-based re-renders. Igni has no JSX, no components-as-functions, and no package ecosystem — it's much narrower.
- **SwiftUI / Jetpack Compose** — Closest cousins. Similar declarative-UI mental model. Main difference: Igni was designed for cold-LLM adoption from day one, so its spec is narrower and explicitly resists features that confuse models — no ternary expressions, no string interpolation, no multi-parameter lambdas.

If you already love Flutter / React / SwiftUI, Igni likely isn't competitive for your existing workflow. If you're writing UI code with LLM assistance and feeling the syntactic noise, Igni optimizes for that specifically.

## Mobile

`igni run` defaults to Chrome. Mobile is one command each:

```bash
igni run ios          # iOS simulator
igni run android      # Android emulator
```

Igni auto-picks a running device, or auto-boots the first available simulator / emulator. Use `--device "<name>"` to pick a specific one. See [`docs/mobile.md`](docs/mobile.md) for device-selection rules, build timings, and known gotchas (Cloudflare third-party APIs, SafeArea).

## Project structure

Igni files are much shorter than their Flutter equivalents — a screen is typically 10-40 lines, not 100-300. Flat file structure works well:

- **Under 200 lines:** fine as a single file
- **Over 200 lines:** consider splitting by screen or feature
- **No folders needed** until 15+ files — auto-discovery means every screen and component is available everywhere with no imports

```text
my-app/
  app.igni           # entry point
  settings.igni      # another screen (optional)
  images/            # local images
  audio/             # audio files
```

## Status

**Language spec:** Current canonical spec is [spec/<!-- SYNC:version -->v0.22.0<!-- /SYNC:version -->.md](spec/<!-- SYNC:version -->v0.22.0<!-- /SYNC:version -->.md). Companion cheatsheet at [<!-- SYNC:cheatsheet-path -->spec/v0.22.0-cheatsheet.md<!-- /SYNC:cheatsheet-path -->](<!-- SYNC:cheatsheet-path -->spec/v0.22.0-cheatsheet.md<!-- /SYNC:cheatsheet-path -->); syntax-only micro reference at [<!-- SYNC:micro-path -->spec/v0.22.0-micro.md<!-- /SYNC:micro-path -->](<!-- SYNC:micro-path -->spec/v0.22.0-micro.md<!-- /SYNC:micro-path -->). Designed iteratively through cold-LLM testing and human usability testing. See [`CHANGELOG.md`](CHANGELOG.md) for the full evolution.

<!-- SYNC:latest-spec-changes -->**Latest spec change: v0.22.0** (2026-05-08) — *Hover primitive (Shape B1) + size-token gap fills. `hover:` sub-block on `layout` carries property-only overrides (`background:`/`border:`/`rounded:`/`cursor:`); `is_hovered()` lexical-scope boolean for hover-conditional content via `if`. Default ~150 ms ease-out animation; `transition: none` opt-out for instant snap. Touch platforms no-op (capability-based, not platform-based). Plus universal `none` (zero on `gap:`/`padding:`/`rounded:`/`size:`) and `rounded:`-only `full` (container-dependent — pill / circle). Stage 3 SOFT verdict (`tests/v0.22-stage3/`) at 4/4 P1 + 4/4 P2 + 2/3-strict-P3-visible; ships with three pre-registered cheatsheet patches. Cycle cost ~$1.05 cumulative ($0 Stage 2 chat-mode + ~$0.30 Stage 0 + $0.7520 Stage 3).* See [`CHANGELOG.md`](CHANGELOG.md) for full history.<!-- /SYNC:latest-spec-changes -->

**Latest methodology result:** the v0.10 domain-swap round (Shopping + Apothecary + Spaceship Cargo, 3 × 4 models × cheatsheet tier) produced 9/9 frontier adoption of `{target with ...}` unprompted. Three runs at varying domain distance from e-commerce rules out the "shopping-cart corpus density" confound — the cheatsheet teaches the syntax, the domain doesn't supply it. First post-ship result strong enough to call directly-supported rather than suggestive.

**Transpiler:** Working. <!-- SYNC:example-count -->108<!-- /SYNC:example-count --> example apps compile and run in the browser; iOS simulator and Android emulator supported via `igni run ios` / `igni run android` (device auto-pick, auto-boot, `--device` override). Covers:

- **Composition** — screens, components, wrapper components with `body` slot, layouts
- **Control flow** — `if`/`else`, `each` loops (with `paginate:` for lazy rendering), functions, lambdas
- **State & data** — variables, two-way binding, shared state, async `fetch` + `locate()` with loading/error
- **Data shapes** — list operations (`filter`, `sorted`, `without`, `replace`, ...), list indexing, object-update syntax (`{target with field: newval}`)
- **UI surface** — screen properties (title, background), local images, audio, SafeArea auto-wrap when no AppBar (prevents iOS notch clipping)
- **Operators** — arithmetic, comparison, boolean (`and`/`or`/`not`)

**Compile-time rejections** — five anti-patterns rejected with fix-it errors: reactive-fetch footgun, `emit <event>` misplacement, bare `shared:` access, `count(list, lambda)` (use `length(filter(...))`), `locate()` reactive-fetch extension. Pinned negative fixtures in [`transpiler/examples-errors/`](transpiler/examples-errors/).

**CLI:** `igni new` scaffolds a starter. `igni run` transpiles, watches, serves. `igni run ios` / `igni run android` for mobile — see [`docs/mobile.md`](docs/mobile.md). Full reference in [`transpiler/README.md`](transpiler/README.md).

**Project scope:** Single-author by design during early access. The project's adversarial review comes from cold-LLM panels (4 frontier models per round, see [`tests/README.md`](tests/README.md)) and human usability testing, not multi-contributor PRs — a deliberate choice for a research prototype. External contribution will open post-v1.0 when the spec is stable enough to absorb PRs without churn.

## Repo structure

```text
igni/
├── README.md                # this file
├── ARCHITECTURE.md          # how the pieces fit (human audience)
├── CLAUDE.md                # AI-assistant design principles + workflow
├── CHANGELOG.md             # spec evolution history
├── ROADMAP.md               # near-term plans + ideas
├── LICENSE                  # GPL v3 (transpiler) + CC BY-SA 4.0 (spec/docs)
├── spec/
│   ├── README.md
│   ├── <!-- SYNC:version -->v0.22.0<!-- /SYNC:version -->.md             # current canonical spec
│   ├── <!-- SYNC:version -->v0.22.0<!-- /SYNC:version -->-cheatsheet.md  # current canonical cheatsheet
│   ├── <!-- SYNC:version -->v0.22.0<!-- /SYNC:version -->-micro.md       # current canonical micro reference
│   └── archive/             # historical <!-- SYNC:historical-range-files -->v0.2.md → v0.21.2.md<!-- /SYNC:historical-range-files --> (never edited after shipping)
├── transpiler/
│   ├── README.md
│   ├── src/                 # lexer, parser, codegen, CLI
│   ├── bin/igni             # CLI entry point
│   ├── examples/            # <!-- SYNC:example-count -->108<!-- /SYNC:example-count --> .igni apps + .expected.dart references
│   └── examples-errors/     # pinned transpile-rejection fixtures
├── tests/                   # cold-LLM test results + methodology
│   ├── README.md
│   └── v<spec_version>/     # prompts + results per round
├── docs/
│   ├── README.md
│   ├── tutorial.md          # beginner walkthrough
│   ├── mobile.md            # iOS / Android run instructions
│   └── archive/             # prior tutorial drafts
├── editors/
│   └── vscode/              # VS Code / Cursor TextMate grammar
├── scripts/
│   └── sync-docs.ts         # regenerates SYNC:* markers from repo state
└── assets/                  # logo (igni.svg + igni-dark-mode.svg, PNGs)
```

## License

Dual-licensed. Transpiler and CLI: **GPL v3.0**. Spec and documentation: **CC BY-SA 4.0**. Your compiled output is yours — the GPL does not apply to generated Dart code. See [`LICENSE`](LICENSE).
