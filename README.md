# Igni

A programming language for building UIs — designed to be read.

**Status: research prototype.** Final-year CS dissertation project investigating whether LLM output accuracy and human readability track each other. Spec is at v0.11.5; transpiler covers most of it; the tutorial has been through multiple cold-run iterations. Not yet production-ready. See [§ Status](#status) for the methodology + evidence.

**The hypothesis:** LLM accuracy and human readability track each other. Remove the ambiguity that trips LLMs up — no brackets on component invocation, one way to update state, a single spec document — and the language becomes nicer for humans too. Igni is that experiment.

**Concrete evidence so far:** the v0.10 domain-swap round (Shopping + Apothecary + Spaceship Cargo, 3×4 models × cheatsheet tier) produced 9/9 frontier adoption of the `{target with ...}` object-update syntax unprompted. v0.9.1 flipped 3/3 frontier models off an `on change:` anti-pattern onto the canonical `on tap:` trigger with a one-sentence docs change and zero transpiler work. Methodology details in [tests/README.md](tests/README.md).

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

`igni new` creates a starter `app.igni` and a `.gitignore` for the generated `.igni/` Flutter project. Save `app.igni`, browser updates automatically. That's it.

## How it works

`igni run` transpiles your `.igni` files to Dart, spins up a Flutter web server, and watches for changes. Edit, save, see the result in your browser — the loop is instant.

When Flutter or generated Dart reports an error from `main.dart`, Igni maps it back to the nearest `.igni` source line so the CLI points at code you actually wrote instead of only the generated file.

Under the hood, a hidden `.igni/` Flutter project is created automatically. You never touch it — just edit `.igni` files and save.

## Why not Flutter / React / SwiftUI?

Igni is downstream of the same declarative-UI lineage as SwiftUI and Jetpack Compose, built specifically for LLM-assisted workflows. Compared to mainstream options:

- **Flutter** — Igni compiles to Flutter. You get Flutter's rendering; you skip Flutter's imperative `setState`, widget constructors, and `BuildContext` plumbing. Tradeoff: Igni's spec is deliberately smaller than Flutter's API, so features Flutter has (animations, pub.dev packages) you'd need to drop into Flutter directly for.
- **React / React Native** — Igni's reactivity is automatic reassignment (no `useState`, no setters). Similar in spirit to React but via lexical re-evaluation instead of hook-based re-renders. Igni has no JSX, no components-as-functions, and no package ecosystem — it's much narrower.
- **SwiftUI / Jetpack Compose** — Closest cousins. Similar declarative-UI mental model. Main difference: Igni was designed for cold-LLM adoption from day one, so its spec is narrower and explicitly resists features that confuse models — no ternary expressions, no string interpolation, no multi-parameter lambdas.

If you already love Flutter / React / SwiftUI, Igni likely isn't competitive for your existing workflow. If you're writing UI code with LLM assistance and feeling the syntactic noise, Igni optimizes for that specifically.

## Mobile

`igni run` defaults to Chrome. Mobile targets are one command each — Igni expands the `.igni/` Flutter project to that platform, picks a running device, or auto-boots the first available simulator / emulator when nothing is running.

```bash
igni run ios          # iOS simulator
igni run android      # Android emulator
igni run ios --device "iPhone 17"      # target a specific device by name or UDID
igni run android --device "Pixel 8a"
```

With one running device per platform, `igni run ios` / `igni run android` picks it silently. With multiple, Igni lists them and asks for `--device`. With none, Igni boots the first available simulator / emulator and waits — same one-command UX as the web default.

Cold Xcode builds take ~40s on Apple Silicon; Gradle cold builds take ~2 min. Subsequent runs are sub-20s. Hot reload (`r` key) works on mobile too.

A note on third-party APIs: mobile Dart HTTP clients present a TLS fingerprint Cloudflare's bot scoring often challenges, so `fetch()` against Cloudflare-protected public APIs can return 403 on iOS / Android while the same request succeeds from a browser or curl. The workaround most Flutter / React Native apps use is proxying through a server you control. Not an Igni-specific limitation.

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

**Language spec:** Current canonical spec is [spec/<!-- SYNC:version -->v0.11.5<!-- /SYNC:version -->.md](spec/<!-- SYNC:version -->v0.11.5<!-- /SYNC:version -->.md). Companion cheatsheet at [<!-- SYNC:cheatsheet-path -->spec/v0.11.5-cheatsheet.md<!-- /SYNC:cheatsheet-path -->](<!-- SYNC:cheatsheet-path -->spec/v0.11.5-cheatsheet.md<!-- /SYNC:cheatsheet-path -->); syntax-only micro reference at [<!-- SYNC:micro-path -->spec/v0.11.5-micro.md<!-- /SYNC:micro-path -->](<!-- SYNC:micro-path -->spec/v0.11.5-micro.md<!-- /SYNC:micro-path -->). Designed iteratively through cold-LLM testing and human usability testing. See [`CHANGELOG.md`](CHANGELOG.md) for the full evolution.

**Latest language change:** `v0.11.0` adds `locate()` — a geolocation primitive that reuses the same `is loading:` / `is error:` machinery as `fetch()`. 3/3 frontier models independently invented divergent shapes on the pre-ship cold test; Shape A won 4/4 pre-ship ship review and validated 4/4 post-ship Clima rerun. `v0.11.1` (docs-only) restructured the cheatsheet for learning order. `v0.11.2` (docs-only) clarified that the reactive-fetch footgun applies narrowly to bound-variable fetch URLs, not to all async composition. Preceding syntax ships: `v0.10.0` object-update syntax `{target with field: newval}` (9/9 frontier adoption across three domain-swap rounds — strongest direct-support result in project history); `v0.9.1` tightened the trigger-variable recommendation (docs-only, 3/3 frontier flipped to canonical `on tap:`); `v0.9.0` promoted the reactive-fetch footgun from prose guidance to a transpile-time error; `v0.8.0` shipped component event channels (`emit` + `on <event>:`).

**Latest methodology result:** the v0.10 domain-swap round (Shopping + Apothecary + Spaceship Cargo, 3 × 4 models × cheatsheet tier) produced 9/9 frontier adoption of `{target with ...}` unprompted. Three runs at varying domain distance from e-commerce rules out the "shopping-cart corpus density" confound — the cheatsheet teaches the syntax, the domain doesn't supply it. First post-ship result strong enough to call directly-supported rather than suggestive.

**Transpiler:** Working. <!-- SYNC:example-count -->40<!-- /SYNC:example-count --> example apps compile and run in the browser. Covers:

- **Composition** — screens, components, wrapper components with `body` slot, layouts
- **Control flow** — `if`/`else`, `each` loops, functions, lambdas
- **State & data** — variables, two-way binding, shared state, async `fetch` with loading/error
- **Data shapes** — list operations (`filter`, `sorted`, `without`, `replace`, ...), list indexing, object-update syntax (`{target with field: newval}`)
- **UI surface** — screen properties (title, background), local images, audio
- **Operators** — arithmetic, comparison, boolean (`and`/`or`/`not`)

**CLI:** `igni new` creates a starter app. `igni run` transpiles, watches, and serves it.

## Repo structure

```text
igni/
├── spec/                    # language spec (versioned snapshots)
│   ├── <!-- SYNC:version -->v0.11.5<!-- /SYNC:version -->.md             # current canonical spec
│   ├── <!-- SYNC:version -->v0.11.5<!-- /SYNC:version -->-cheatsheet.md  # current canonical cheatsheet
│   ├── <!-- SYNC:version -->v0.11.5<!-- /SYNC:version -->-micro.md       # current canonical micro reference
│   └── <!-- SYNC:historical-range-files -->v0.2.md → v0.11.4.md<!-- /SYNC:historical-range-files -->      # historical (never edited after shipping)
├── transpiler/              # TypeScript-to-Dart transpiler
│   ├── src/                 # lexer, parser, codegen, CLI
│   ├── bin/igni             # CLI entry point
│   └── examples/            # <!-- SYNC:example-count -->40<!-- /SYNC:example-count --> .igni apps + .expected.dart references
├── tests/                   # cold-LLM test results + methodology
│   └── v0.3.2 → v0.6.11/    # prompts + results per spec version
├── docs/                    # tutorial + project docs
│   └── tutorial-v2.5.md     # beginner tutorial (no programming experience needed)
├── assets/                  # logo (igni.svg + igni-dark-mode.svg, PNGs)
├── CHANGELOG.md             # spec evolution history
├── ROADMAP.md               # near-term plans + ideas
└── LICENSE                  # GPL v3 (transpiler) + CC BY-SA 4.0 (spec/docs)
```

## License

Dual-licensed. Transpiler and CLI: **GPL v3.0**. Spec and documentation: **CC BY-SA 4.0**. Your compiled output is yours — the GPL does not apply to generated Dart code. See [`LICENSE`](LICENSE).
