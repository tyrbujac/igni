# v0.22 Stage 0 cold-test prompts

Combined hover + size-token cold-test against the v0.22 cheatsheet draft (`cheatsheet-draft.md`). Three prompts × frontier panel. Reach test: do the panels produce canonical Igni source for each surface, given the spec but no examples beyond the cheatsheet?

Pre-registered ship bars per `README.md`:
- **Strong:** 3/3 P1 + 3/3 P2 + 3/3 P3 (9/9 cells canonical)
- **Soft:** 2/3 on any prompt → patch teaching, re-run minimal subset
- **Fail:** ≤1/3 on any prompt → reopen design (Stage 2 lock revisit)

Cost estimate ~$0.70 (matches v0.20-stage0's $0.83 for spec-injected 3×3).

---

## 1. Card grid with hover-lift

> Build a 3-column grid of recipe cards. Each card has a header image, a title, and a small icon row (favourite, share, more) underneath. On pointer hover, the card visually lifts: its background shifts from `card` to `brand`, a `medium` shadow appears, and the cursor turns to `pointer`. The recipe icon row stays tightly packed — no extra gap between icons. Use realistic recipe data (3 recipes is fine).
>
> Author canonical Igni from the cheatsheet. Don't invent syntax not in the spec.

**Reach test:** uses `hover:` sub-block for the property overrides (background, shadow, cursor); does NOT use `if is_hovered():` for those property overrides; uses `gap: none` for the tightly-packed icon row.

## 2. Card list with hover-revealed preview

> Build a vertical list of book cards. Each card shows the cover image and title by default; when the user hovers a card, a one-line preview description appears below the title (hidden when not hovered). The card itself also subtly highlights — `background: brand` on hover. Use realistic book data (3-4 books).
>
> Author canonical Igni from the cheatsheet. Don't invent syntax not in the spec.

**Reach test:** uses `hover:` sub-block for the `background: brand` property override; uses `is_hovered()` inside an `if` block for the conditionally-rendered preview description (NOT inside `hover:`); description label is the right primitive shape.

## 3. Contact card with pill button, circular avatar, disabled state

> Build a contact card with three regions:
> 1. A circular avatar image at the top (use `rounded: full` for the circle).
> 2. The contact's name and role below the avatar.
> 3. A row of two buttons: a pill-shaped "Follow" button (rounded: full + brand background) and a "Message" button. If the contact is already followed, the Follow button shows as disabled — its cursor turns to `not_allowed` on hover and its background becomes `subtle`.
>
> The button row should sit tight against the name (`gap: none` between the name section and the button row). Use realistic contact data.
>
> Author canonical Igni from the cheatsheet. Don't invent syntax not in the spec.

**Reach test:** uses `rounded: full` for both circular avatar AND pill button; uses `gap: none` between name and button row; uses `cursor: not_allowed` inside `hover:` for disabled state; conditional disabled-state logic uses `if is_followed:` (or equivalent state-driven shape) — NOT magic state inference.
