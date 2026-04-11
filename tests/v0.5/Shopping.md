# Cold-LLM Test: Shopping App (Igni v0.5)

**Spec version tested:** Igni v0.5
**Test run dates:** 2026-04-11 (all three models complete)
**Source prompt:** `prompts.md` → Shopping app

## The prompt

> Using only the Igni language spec above, write a small e-commerce app in Igni. It should have three screens: a product list (showing each product as a card with image, name, and price, with a tap-to-view-detail behaviour), a product detail screen (showing the same info plus a description and an "Add to Cart" button), and a cart screen (showing all added items with quantities, a total, and a "Remove" button per item). The cart should be accessible from any screen via a button or icon in the corner, and should persist as the user navigates between screens. Use a wrapper component for the product cards. Use the list builtins for adding, removing, and updating cart items.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

## Why this test exists

This is the **most comprehensive single-test exercise of v0.5's design.** It deliberately requires all three new v0.5 features in one app:

1. **Shared state** (`shared:` block, `shared.cart`) — the cart needs to be accessible from three screens and persist across navigation.
2. **Wrapper components with `body` slot** — the prompt explicitly asks for "a wrapper component for the product cards." The expected pattern is a wrapper using `body` for the inner content.
3. **List builtins** — adding, removing, and updating cart items (`+ [item]`, `without`, `replace`, plus `find`/`count`/`length`/`is in` as appropriate).

---

## Claude

**Model version:** Claude Opus 4.6
**Date:** 2026-04-11
**One-shot or split?:** One shot.

### Output

```igni
shared:
  cart: [CartItem] = []

screen ProductList:
  products: [Product] = fetch("/api/products")

  if products is loading:
    spinner
  else if products is error:
    label "Couldn't load products", color: danger
  else:
    layout vertical, gap: medium, padding: large:
      layout horizontal, spread: true:
        label "Products", style: heading
        icon "shopping-cart", size: large, on tap: navigate to Cart
      each product in products:
        ProductCard product:
          image product.image, size: 120
          label product.name, style: heading.small
          label "$" + product.price, style: body, color: subtle

screen ProductDetail(product):
  layout vertical, gap: medium, padding: large:
    layout horizontal, spread: true:
      label product.name, style: heading
      icon "shopping-cart", size: large, on tap: navigate to Cart
    image product.image, size: 240
    label "$" + product.price, style: heading.small
    label product.description, style: body, color: subtle
    button "Add to Cart", color: brand, on tap: add_to_cart()

  add_to_cart():
    existing = find(shared.cart, {product_id: product.id})
    if existing is not null:
      shared.cart = replace(shared.cart, existing, {product_id: existing.product_id, name: existing.name, price: existing.price, image: existing.image, quantity: existing.quantity + 1})
    else:
      shared.cart = shared.cart + [{product_id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1}]

screen Cart:
  layout vertical, gap: medium, padding: large:
    label "Your Cart", style: heading
    if shared.cart is empty:
      label "Your cart is empty", style: body, color: subtle
    else:
      each item in shared.cart:
        layout horizontal, gap: medium, padding: medium, background: card, rounded: medium:
          image item.image, size: 48
          layout vertical, gap: small:
            label item.name, style: body
            label "$" + item.price + " x " + item.quantity, style: caption, color: subtle
          icon "trash", size: medium, color: danger, on tap: remove_item(item)
      divider
      label "Total: $" + cart_total(), style: heading.small
    button "Back to Products", on tap: navigate back

  remove_item(item):
    shared.cart = without(shared.cart, item)

  cart_total():
    total = 0
    each item in shared.cart:
      total = total + item.price * item.quantity
    return total

component ProductCard(product):
  layout vertical, padding: medium, background: card, rounded: medium, on tap: navigate to ProductDetail product:
    body
```

### Grading

- **Invented syntax not in the spec?** **One subtle misuse:** `find(shared.cart, {product_id: product.id})` — Claude is treating `find` as a structural/key-based match (find an item where `product_id` matches), but the spec says `find` is identity-based. The dict literal `{product_id: product.id}` is a brand new object identity, so this `find` will *never* match anything in the cart, and the code will always go to the else branch and add a new cart item. **The bug:** quantities will never increment — every "Add to Cart" tap creates a new item.
- **Used existing syntax wrong?** Yes, the `find` misuse described above.
- **Valid Igni on first try?** **No** — the `find` misuse means the cart never increments quantities. The code parses but the logic is wrong because it depends on a behaviour the spec doesn't support.
- **Used `shared:` block?** **Yes** (with `[CartItem]` type annotation).
- **Used `body` slot wrapper?** **Yes** — `ProductCard` is a wrapper with `body` at the bottom and on tap on the layout. The call site provides indented children.
- **Used new v0.5 builtins?** `replace` (for the increment branch that never fires), `without` (for remove), attempted `find` (misused).
- **Line count:** ~58 lines.

### Notes

- **The wrapper pattern is the cleanest of the three.** Claude defined `ProductCard` as a `body`-slot wrapper with the on tap on the wrapper itself, and the call site provides image/name/price as the indented body. This is exactly the pattern v0.5 documents.
- **`find` misuse is the headline finding.** The spec's "identity-based" definition is technically clear, but Claude (like ChatGPT) reached for the JavaScript-style `Array.find(item => item.id === id)` mental model. **The spec needs an explicit warning** that `find` won't work for structural/key matching.
- **Cart item shape duplicates fields** — Claude stores `{product_id, name, price, image, quantity}` rather than `{product, quantity}`. This forces the reconstruction in `replace`. Slightly verbose but works.
- **`cart_total()` function** uses the v0.4.1 functions-as-expressions pattern, called inline in `label "Total: $" + cart_total()`.

---

## Gemini

**Model version:** Gemini 3.1 Pro
**Date:** 2026-04-11
**One-shot or split?:** One shot.

### Output

```igni
shared:
  cart = []
  unique_items = []
  cart_total = 0

screen ProductList:
  products = fetch("/api/products")

  layout vertical, gap: medium, padding: large:
    Header "Shop"

    if products is loading:
      spinner
    else if products is error:
      label "Could not load products", color: danger
    else:
      each product in products:
        CardWrapper:
          image product.image, size: 150
          label product.name, style: heading.small
          label "$" + product.price
          button "View Details", on tap: navigate to ProductDetail product

component Header(title):
  layout horizontal, spread: true, align: center:
    label title, style: heading
    layout horizontal, gap: small, align: center:
      icon "shopping-cart", size: large, on tap: navigate to Cart
      if shared.cart is not empty:
        badge length(shared.cart), color: brand

component CardWrapper():
  layout vertical, padding: medium, background: card, rounded: medium:
    body

screen ProductDetail(product):
  layout vertical, gap: medium, padding: large:
    Header product.name

    image product.image, size: 300
    label product.name, style: heading
    label "$" + product.price, style: heading.small
    label product.description, style: body

    button "Add to Cart", color: brand, on tap: add()

  add():
    shared.cart = shared.cart + [product]
    shared.cart_total = shared.cart_total + product.price
    if product is not in shared.unique_items:
      shared.unique_items = shared.unique_items + [product]

screen Cart:
  layout vertical, gap: medium, padding: large:
    Header "Your Cart"

    if shared.unique_items is empty:
      label "Your cart is empty", color: subtle
    else:
      each item in shared.unique_items:
        CartRow item

      divider
      layout horizontal, spread: true:
        label "Total:", style: heading.small
        label "$" + shared.cart_total, style: heading.small

component CartRow(item):
  qty = count(shared.cart, item)

  layout horizontal, spread: true, align: center, padding: medium:
    layout horizontal, gap: medium, align: center:
      image item.image, size: 50, round: true
      layout vertical:
        label item.name
        label "$" + item.price, color: subtle

    layout horizontal, gap: medium, align: center:
      label "Qty: " + qty
      button "Remove", color: danger, on tap: remove()

  remove():
    shared.cart = without(shared.cart, item)
    shared.cart_total = shared.cart_total - item.price
    if item is not in shared.cart:
      shared.unique_items = without(shared.unique_items, item)
```

### Grading

- **Invented syntax not in the spec?** **No.** Zero inventions.
- **Used existing syntax wrong?** **No.** Every feature used cleanly.
- **Valid Igni on first try?** **Yes.** This is the only PASS of the three Shopping outputs.
- **Used `shared:` block?** **Yes** — three shared variables (`cart`, `unique_items`, `cart_total`).
- **Used `body` slot wrapper?** **Yes** — `CardWrapper()` is a no-arg wrapper that just provides the card layout, with `body` for the children.
- **Used new v0.5 builtins?** **Yes — the most extensive use of any model.** `length(shared.cart)` for the badge count, `count(shared.cart, item)` for quantity computation, `is not in` and `is in` for membership checks (twice each), `without` for removal.
- **Line count:** ~70 lines.

### Notes

**This is the highest-quality Shopping output of the three by a wide margin** — and it's the only one that produces a working app. Several insights worth highlighting:

- **The `count`-for-quantity insight.** Gemini sidesteps the `find`-by-key problem entirely by using a clever data model: cart items are stored as duplicate product objects (`shared.cart + [product]`), and quantity is computed on demand via `count(shared.cart, item)`. This avoids the find-by-id question because there's no need to find by id — `count` does identity-based occurrence counting, which is exactly what `count` is designed for. **This is the right v0.5 pattern for "how many of each item."**
- **The `unique_items` parallel list.** Gemini maintains a second `shared.unique_items` list of distinct products to render in the cart, computed via `if product is not in shared.unique_items: shared.unique_items = ...` on add. This avoids rendering duplicates in the cart UI. Verbose but correct.
- **`CardWrapper()` as a no-arg wrapper.** The component takes no arguments and just provides the card chrome via `body`. The call site provides everything as indented children. **This is the canonical v0.5 wrapper pattern.**
- **Reusable `Header` component** with the cart icon AND a badge showing the count when non-empty. The badge uses `length(shared.cart)` as a function-call-as-expression — exactly the v0.4.1 pattern.
- **Tracking `cart_total` as a shared variable** rather than computing it each time. Avoids the find-by-key problem and keeps the math simple. The tradeoff: the total has to be manually kept in sync on add and remove.

**This is the v0.5 idiom done right.** Gemini understood the spec's identity-based semantics and built around them rather than trying to force structural matching.

---

## GPT

**Model version:** ChatGPT (free tier, model version not displayed)
**Date:** 2026-04-11
**One-shot or split?:** One shot.

### Output

```igni
shared:
  cart: [Item] = []

component ProductCard(product):
  layout vertical, padding: medium, background: card, rounded: medium:
    image product.image, size: 120
    label product.name, style: heading.small
    label "$" + product.price, style: body

component CartIcon():
  icon "cart", size: large, color: brand, on tap: navigate to Cart

screen ProductList:
  products = fetch("/api/products")

  if products is loading:
    spinner
  else if products is error:
    label "Failed to load products", color: danger
  else:
    layout vertical, gap: medium, padding: large:
      layout horizontal, spread: space-between:
        label "Products", style: heading
        CartIcon

      each product in products:
        ProductCard product, on tap: navigate to ProductDetail product

screen ProductDetail(product):
  layout vertical, gap: medium, padding: large:
    layout horizontal, spread: space-between:
      label "Details", style: heading
      CartIcon

    image product.image, size: 200
    label product.name, style: heading.small
    label "$" + product.price, style: body
    label product.description, style: body, color: subtle

    button "Add to Cart", color: brand, on tap: add_to_cart()

  add_to_cart():
    existing = find(shared.cart, product)

    if existing is null:
      shared.cart = shared.cart + [{product: product, quantity: 1}]
    else:
      updated = {product: product, quantity: existing.quantity + 1}
      shared.cart = replace(shared.cart, existing, updated)

screen Cart:
  layout vertical, gap: medium, padding: large:
    layout horizontal, spread: space-between:
      label "Cart", style: heading
      CartIcon

    if shared.cart is empty:
      label "Your cart is empty", color: subtle
    else:
      each item in shared.cart:
        layout horizontal, spread: space-between, padding: medium, background: card, rounded: medium:
          label item.product.name
          label "x" + item.quantity
          label "$" + (item.product.price * item.quantity)
          button "Remove", color: danger, on tap: remove_item(item)

      total = 0
      each item in shared.cart:
        total = total + (item.product.price * item.quantity)

      label "Total: $" + total, style: heading.small

  remove_item(item):
    shared.cart = without(shared.cart, item)
```

### Grading

- **Invented syntax not in the spec?** **Yes — three things:**
  1. **`find(shared.cart, product)`** — passes the product object as the target, but cart items are `{product, quantity}` shapes, so `find` will never match (the product object isn't in the list, the cart items contain it). Same `find` misuse as Claude — treating `find` as structural matching.
  2. **`spread: space-between`** — the spec lists `spread (space-between)` as a layout property. The notation is ambiguous: is `spread:` a boolean (`spread: true` means space-between) or a token (`spread: space-between`)? Claude and Gemini both used `spread: true`; ChatGPT used `spread: space-between`. **The spec is ambiguous and needs clarification.**
  3. **No-arg component invocation `CartIcon`** — used inside layouts as `CartIcon` with no arguments and no parens. The spec doesn't show this pattern. Borderline — the spec says "Invocation has no parentheses," so `CartIcon` alone could be the no-arg invocation, but the parser needs context to distinguish it from a variable reference. **Spec needs to clarify the no-arg component invocation form.**
- **Used existing syntax wrong?** Yes (the `find` misuse and the `spread` form).
- **Valid Igni on first try?** **No** — the `find` misuse means quantities never increment (same bug as Claude). The other issues are spec ambiguities, not strict invalidities.
- **Used `shared:` block?** **Yes**.
- **Used `body` slot wrapper?** **No** — `ProductCard` is a regular component, not a wrapper. The prompt asked for "a wrapper component for the product cards"; ChatGPT interpreted "wrapper component" as "a reusable component" rather than specifically as a `body`-slot wrapper.
- **Used new v0.5 builtins?** Attempted `find` (misused), `replace` (in the never-reached branch), `without` for delete.
- **Line count:** ~60 lines.

### Notes

- **The `find` misuse is the same as Claude's** — both models reach for structural matching that the spec doesn't support. **This is now a 2/3 cross-model gap and the strongest finding from this test.**
- **Didn't reach for the `body` wrapper.** The prompt explicitly asked for "a wrapper component for the product cards." ChatGPT defined `ProductCard` as a regular component that takes `product` and renders it inline. This is technically valid v0.5 (a normal component is also "a wrapper") but it doesn't exercise the new `body` slot feature. **Suggests the spec needs a stronger link between the term "wrapper component" and the `body` keyword.**
- **`spread: space-between` vs `spread: true`** — only ChatGPT used the token form. The spec text is ambiguous: `spread (space-between)` could mean either form. v0.5.1 should pick one and document it clearly.
- **No-arg component invocation** — `CartIcon` is invoked three times as just `CartIcon` with no arguments and no parens. The spec doesn't explicitly bless this form. Worth a one-line clarification.
- **Cart total computed inline** in the `else` branch — uses `each item in shared.cart` for the loop and stores the result in a local `total` variable. v0.5 each-in-functions used correctly.
- **Cart item shape `{product, quantity}`** is cleaner than Claude's flattened version, but the find-by-id problem remains.

---

## Gaps observed (across all three models)

This is a v0.5 acceptance test that exercises **all three new features at once**, and it surfaced **two real spec gaps** that need v0.5.1 documentation fixes.

### Cross-model feature usage matrix (Shopping)

| Feature | Claude | Gemini | ChatGPT |
|---|---|---|---|
| `shared:` block for cart | Yes | Yes (3 vars) | Yes |
| `body` slot wrapper | **Yes** (`ProductCard` with on tap + body) | **Yes** (`CardWrapper()` no-arg) | **No** (regular component) |
| `find` for product lookup | **Misused** (structural match) | n/a (used `count` instead) | **Misused** (structural match) |
| `count` for quantity | n/a | **Yes** (clever workaround) | n/a |
| `length` for badge | n/a | **Yes** | n/a |
| `replace` for update | Yes (never reached) | n/a | Yes (never reached) |
| `without` for delete | Yes | Yes | Yes |
| `is in` / `is not in` | n/a | **Yes** | n/a |
| `is empty` for empty state | Yes | Yes | Yes |
| Inventions/misuses | `find` with dict literal | None | `find` with object, `spread: space-between`, no-arg `CartIcon` |
| **Verdict** | **PARTIAL** | **PASS** | **PARTIAL** |

### Headline findings

1. **`find` is the most ambiguous v0.5 builtin and needs a v0.5.1 docs fix.** Two out of three models (Claude and ChatGPT) tried to use `find` for structural/key-based matching — the JavaScript `Array.find(item => item.id === id)` mental model. The spec says `find` is identity-based, but the wording isn't strong enough; the term "find" naturally suggests a search by criteria, not by reference equality. **v0.5.1 needs an explicit "what `find` is and isn't" callout** with a concrete example showing that `find(list, dict_literal)` does not work.

2. **`spread:` syntax is ambiguous.** The spec lists `spread (space-between)` as a layout property. Claude and Gemini interpreted this as `spread: true` (boolean). ChatGPT interpreted it as `spread: space-between` (token). **v0.5.1 needs to pick one form and document it explicitly.**

3. **The phrase "wrapper component" doesn't reliably map to the `body` slot.** ChatGPT interpreted "wrapper component for the product cards" as "a reusable component," not specifically as a `body`-slot wrapper. The spec should add a one-line note that **"wrapper component"** is the canonical Igni term for a component using the `body` slot to render caller-provided content.

4. **Gemini's `count`-for-quantity pattern is the right v0.5 idiom.** When you need to track how many of an item are in a collection, store duplicates in the list and use `count(list, item)` to get the quantity. This sidesteps the find-by-key problem entirely. **Worth documenting in v0.5.1 as the canonical "shopping cart with quantities" pattern.**

5. **No-arg component invocation needs clarification.** ChatGPT used `CartIcon` (no args, no parens) at multiple call sites. The spec doesn't explicitly bless this — worth a one-line note.

### What this validates about v0.5

- **`shared:` block landed cleanly across all three models.** Universal use, no inventions.
- **`body` slot is partially discoverable** — 2/3 models (Claude and Gemini) used it, with two different but valid styles. ChatGPT missed it. The "wrapper component" terminology link could be stronger.
- **The new list builtins are partially successful:**
  - `without`, `length`, `count`, `is in` / `is not in` all used correctly.
  - `replace` used in syntactically valid forms (but in unreachable branches due to the `find` misuse).
  - `find` is the problem child — the identity-based semantics aren't sufficiently warned against.

### v0.5.1 docs patch (recommended)

Five small additions, all documentation, no new features:

1. **`find` is identity-based, not structural.** Add an explicit warning to the *Lists → Finding items and counting* subsection: *"`find(list, target)` returns an item only if the target is the same object identity. To find by a key field, store the target in a variable and pass it directly, or use `each` to iterate and check the field manually. `find(list, {id: x})` will NOT work — the dict literal is a new identity that's not in the list."*
2. **`spread:` is boolean.** Update the layout properties list to clarify: *"`spread: true` puts space between children (equivalent to `space-between`)."* Pick the boolean form, document it, and remove the parenthetical that suggests a token.
3. **Wrapper component terminology.** Add a one-line cross-reference in the Components section: *"A 'wrapper component' is a component that uses the `body` keyword to render caller-provided content (see *Wrapper components with `body`*)."*
4. **`count` for quantity tracking.** Add Gemini's pattern as an example in the Lists section: *"To track quantities of items in a collection (e.g. a shopping cart), store duplicates in the list and use `count(list, item)` to get the count of each."*
5. **No-arg component invocation.** Add a one-line note to Components: *"A component with no arguments is invoked by name alone (e.g. `CartIcon`). The parser distinguishes component invocations from variable references by position."*

All five are documentation-only, no new language features, total budget impact zero.

---

## v0.5 acceptance verdict for Shopping

**PARTIAL.** One clean PASS (Gemini) and two PARTIAL outputs (Claude and ChatGPT, both with the `find` misuse). The PARTIAL findings are addressable with the five-point v0.5.1 documentation patch above.

**This is informative**, not concerning. Gemini's clean output proves the v0.5 design is correct and discoverable. Claude and ChatGPT's misuses reveal a specific spec ambiguity that the prompt happened to surface — `find`'s identity-based semantics aren't strong enough in the documentation. A targeted v0.5.1 patch closes the gap.

**v0.5 ships as the stable release** with a queued v0.5.1 docs patch. The transpiler workstream is unblocked.

---

## Hand-written attempt (optional but valuable)

Your own attempt at this app in Igni v0.5 — would be valuable as a sanity check, particularly to see whether you'd hit the `find`-by-key trap that Claude and ChatGPT both did.

```igni
(paste your hand-written attempt here)
```
