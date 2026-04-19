```igni
screen Profile:
  refresh_token = 0
  me = fetch("/api/me?_=" + refresh_token)
  user_id = ""
  posts = fetch("/api/users/" + user_id + "/posts")

  layout vertical, gap: medium, padding: large:
    if me is loading:
      spinner
    else if me is error:
      label "Failed to load user"
    else:
      capture_id()
      if user_id is "":
        spinner
      else if posts is loading:
        layout vertical, gap: medium:
          label me.name, style: heading
          label me.bio
          spinner
      else if posts is error:
        layout vertical, gap: medium:
          label me.name, style: heading
          label me.bio
          label "Failed to load posts"
      else:
        layout vertical, gap: medium, fill: true:
          label me.name, style: heading
          label me.bio
          each post in posts:
            layout horizontal, gap: medium, spread: true:
              label post.title
              label post.created_at, style: caption

    button "Refresh", color: brand, on tap: refresh()

  capture_id():
    user_id = me.id

  refresh():
    user_id = ""
    refresh_token = refresh_token + 1
```

**Notes on what I'd want the language to add:**

1. **Chained async is awkward.** The spec's reactive-fetch footgun rule rejects `fetch("/api/users/" + me.id + "/posts")` because `me` is itself an async value in the same screen. I worked around it with a `user_id` trigger variable populated by a `capture_id()` call rendered as a side effect inside the `else` branch — but UI primitives are the only things allowed in screen bodies, and calling a plain function from a render position isn't clearly specified. I'd want either **(a) an explicit `then:` / chained-fetch form** like `posts = fetch("/api/users/" + me.id + "/posts") when: me is not loading`, or **(b) a blessed "derived async" rule** that permits `fetch(expr)` when `expr` only reads resolved async values (`is not loading and is not error`).

2. **Refresh of an async value.** There's no documented way to re-trigger a `fetch()` on demand. I used a `refresh_token` counter concatenated into the URL as a cache-buster, which is a hack. I'd want `refetch(me)` or `me.refresh()` as a first-class operation.

3. **Rendering a function call for its side effect** (`capture_id()` inside the layout) isn't clearly legal — the spec says UI primitives only render in screen/component bodies, but doesn't say whether bare function calls are allowed there. An `on load:` / `on resolve:` hook on `fetch` results would express this cleanly: `me = fetch("/api/me"), on resolve: user_id = me.id`.