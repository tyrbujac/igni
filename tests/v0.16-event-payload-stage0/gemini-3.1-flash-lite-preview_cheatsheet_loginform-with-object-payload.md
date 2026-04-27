```igni
# --- Components ---

component LoginForm:
  email = ""
  password = ""

  layout vertical, gap: medium:
    input bind: email, placeholder: "Email"
    input bind: password, placeholder: "Password"
    button "Sign in", on tap: emit submit {email: email, password: password}

# --- Screens ---

screen Login:
  error_message = ""

  layout vertical, padding: large:
    label "Login", style: heading
    LoginForm on submit(data): authenticate(data.email, data.password)
    label error_message, color: danger

  authenticate(email, password):
    # Mocking a fetch result
    result = fetch("/api/login", method: "POST", body: {email: email, password: password})
    if result.success:
      navigate to Home
    else:
      error_message = result.error_message

screen Home:
  layout vertical, padding: large:
    label "Welcome", style: heading
```

### Explanation of Payload Packaging

The `LoginForm` component packages the data by creating an **object literal** `{email: email, password: password}` inside the `emit` command. This effectively packs multiple disparate pieces of state into a single structure.

In the parent `Login` screen, the handler `on submit(data):` captures this entire object as a single parameter (`data`). Because Igni supports field access on objects, the `authenticate` function can then easily extract the values using dot-notation (`data.email` and `data.password`) to perform the logic. This pattern satisfies the Igni constraint that the component must emit a single value, while allowing the developer to pass as much structured information as needed.