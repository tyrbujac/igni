# Cold-LLM Test: Dashboard (Igni v0.6.1 — Cheat Sheet)

**Spec version tested:** Igni v0.6.1 cheat sheet (228 lines)
**Test run date:** 2026-04-12
**Source prompt:** `prompts.md` → Dashboard
**First cold test of wrapper components with `body` slot.**

## The prompt

> Using only the Igni language spec above, write a Dashboard screen in Igni. It should have three stat cards at the top (Users, Revenue, Orders), each showing a number and an icon. Use a wrapper component for the cards with a `body` slot. Below the cards, show an activity feed — a list of recent events, each with a description and a timestamp. Include a "Refresh" button that simulates reloading the data.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

---

## Cross-model results

| Feature | ChatGPT 5.3 | Gemini 3 Flash | Gemini 3.1 Pro | Claude Opus 4.6 |
| --- | --- | --- | --- | --- |
| Wrapper with `body` | Partial (empty body) | **Yes** (badges inside) | **Yes** (values inside) | **Yes** (values inside) |
| `icon` | ✓ | ✓ | ✓ | ✓ |
| `badge` | No | **Yes** | No | No |
| Activity feed `each` | ✓ | ✓ | ✓ | ✓ |
| `shared:` state | No | No | No | Yes |
| `fetch` mutations | No | No | No | Yes (POST) |
| Refresh function | Local mutation | Identity reassign | Local mutation | fetch + shared |
| `divider` | No | No | ✓ | No |
| **Verdict** | **PARTIAL** | **PASS** | **PASS** | **PASS** |

## Headline findings

### 1. Wrapper `body` slot: 3/4 discovered from cheat sheet

Gemini Flash, Gemini Pro, and Opus all correctly defined a wrapper component with `body` and invoked it with caller-provided content. The cheat sheet's 4-line wrapper example was sufficient. ChatGPT understood the structure (placed `body` in the def) but didn't provide content in the invocations.

### 2. Gemini Flash produced the most creative output

Used `body` to inject different badges inside each stat card:
```igni
StatCard "Users", value: users, icon_name: "users":
  badge "+12%", color: green
StatCard "Revenue", value: revenue, icon_name: "dollar":
  badge "Stable", color: subtle
```

This is the wrapper pattern at its best — same card chrome, different content per instance. A fast/cheap model discovered this from 228 lines.

### 3. Opus went furthest architecturally

Used `shared:` state for all dashboard data and `fetch` with `method: "POST"` for the refresh. Most production-realistic but also most complex. Shows that frontier models produce more ambitious architectures even from the same cheat sheet.

### 4. ChatGPT's empty-body invocation is a new pattern

```igni
StatCard "Users", users, icon_name: "users":
StatCard "Revenue", revenue, icon_name: "chart":
```

The trailing `:` with no indented content is valid syntax (empty body) but defeats the purpose. ChatGPT understood wrapper structure but didn't provide the content. This might improve with a cheat sheet example that shows caller content explicitly.

## Cheat sheet effectiveness (Dashboard)

The wrapper `body` example in the cheat sheet (4 lines) was enough for 3/4 models. The one failure (ChatGPT) is borderline — it got the structure right, just didn't fill the body. This is the strongest validation of the cheat sheet format: a complex feature (wrapper composition) is learnable from a minimal example.
