## `Login.igni`

```igni
screen Login:
  refresh = 0
  user = fetch(user_url())

  layout vertical, padding: large, gap: medium, transition: fade:
    if user is loading:
      spinner
    else if user is error:
      layout vertical, padding: medium, gap: small, background: card, rounded: medium:
        label "Couldn't load your account", color: danger
        button "Retry", color: brand, on tap: refresh = refresh + 1
    else:
      layout vertical, padding: medium, gap: small, background: card, rounded: medium:
        label "Welcome, " + user.name, style: heading
        label user.email
        button "Refresh", color: subtle, on tap: refresh = refresh + 1

  user_url():
    if refresh >= 0:
      return "/api/user/me"
    return "/api/user/me"
```

## `Login.test.igni`

```igni
test "Login loaded state":
  mock fetch:
    "/api/user/me": {name: "Tyr", email: "tyr@example.com"}
  render Login
  snapshot "login_loaded"
```

Brief note: Igni re-fetches when variables read by `fetch()` arguments change. To keep the requested URL exactly `/api/user/me` while still making `refresh` drive re-fetches, `user_url()` deliberately reads `refresh` and returns the same endpoint. The `transition: fade` is placed on the parent layout that owns the `if / else if / else` branch swap, not on an individual label or value.