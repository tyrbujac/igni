layout vertical, fill: true:
            ValueCard "AGE", shared.age, on decrement: shared.age = shared.age - 1, on increment: shared.age = shared.age + 1
        ```
        Or just make the component's top level `layout vertical, fill: true`. Since it's UI-first, top-level layout in component *is* the widget. Let's do that.

        Let's extract `GenderCard` as well to reduce visual noise, or just keep it inline since inline fits in 4 levels.
        Let's check inline Gender cards nesting:
        1. `screen Calculator`
        2. `layout vertical`
        3. `layout horizontal`
        4. `layout vertical` (male background) -> OK, 4 levels!

        Let's check Height card nesting:
        1. `screen Calculator`
        2. `layout vertical`
        3. `layout vertical` (Height card)
        4. `layout horizontal` (value + cm) -> OK, 4 levels!
        (The `slider` is also at level 4, sibling to `layout horizontal`). OK.

        So only the Weight/Age card was too deep.
        Here is the `ValueCard` component:
        ```igni
        component ValueCard(title_text, value):
          layout vertical, fill: true, align: center, background: card, rounded: medium, padding: large, gap: small