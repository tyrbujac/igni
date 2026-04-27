```igni
screen Login:
  error = ""

  layout vertical, padding: large, gap: medium:
    label "Sign in", style: heading
    LoginForm on submit(creds): handle_signin(creds)
    if error is not empty:
      label error, color: danger

  handle_signin(creds):
    result = authenticate(creds.email, creds.password)
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

**How the multi-value payload works:**

`emit` only carries a single positional value, so to send both the email and password together I packed them into an object literal: `emit submit {email: email, password: password}`. On the parent side, the handler receives that object as one named parameter — `on submit(creds):` — and then reads the fields with dot access (`creds.email`, `creds.password`) when calling `authenticate`. This is the canonical "pack multiple values into an object" pattern from the cheatsheet's component-events section.