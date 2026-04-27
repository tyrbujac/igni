```igni
screen Login:
  error = ""

  layout vertical, padding: large, gap: medium:
    LoginForm on submit(credentials): handle_submit(credentials)
    if error is not empty:
      label error, color: danger

  handle_submit(credentials):
    result = authenticate(credentials.email, credentials.password)
    if result.success:
      navigate to Home
    else:
      error = result.error_message

screen Home:
  label "Welcome"

component LoginForm:
  email = ""
  password = ""

  layout vertical, gap: medium:
    input bind: email, placeholder: "Email"
    input bind: password, placeholder: "Password"
    button "Sign in", color: brand, on tap: emit submit {email: email, password: password}
```

**Packaging the multi-value payload.** `emit` only carries a single positional value, so to pass both email and password together I packed them into an object literal: `emit submit {email: email, password: password}`. The parent's handler receives that whole object under one name (`credentials`) using the `on submit(credentials):` parameter form, then reads `credentials.email` and `credentials.password` via field access when calling `authenticate(...)`. This is the canonical pattern from the cheatsheet's "Pack multiple values into an object" note — one channel, one payload, structured fields inside.