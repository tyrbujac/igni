## `Login.igni`

```igni
screen Login:
  refresh = 0
  user = fetch("/api/user/me", body: {refresh: refresh})

  layout vertical, padding: large, gap: medium, transition: fade:
    if user is loading:
      spinner
    else if user is error:
      layout vertical, padding: medium, gap: small, background: card, rounded: medium:
        label "Couldn't load — try again"
        button "Retry", color: brand, on tap: refresh = refresh + 1
    else:
      layout vertical, padding: medium, gap: small, background: card, rounded: medium:
        label "Welcome, " + user.name, style: heading
        label user.email
        button "Refresh", color: subtle, on tap: refresh = refresh + 1
```

## `Login.test.igni`

```igni
test "loaded login state matches snapshot":
  mock fetch:
    "/api/user/me": {name: "Tyr", email: "tyr@example.com"}
  render Login
  snapshot "login_loaded"
```

Brief note: the `transition: fade` is on the outer layout because that layout’s immediate child set changes via the `if / else if / else` branches. Also, Igni only re-fetches when variables appear in `fetch()` arguments, so `refresh` is included in the request arguments while keeping the URL as `"/api/user/me"` for the mock.