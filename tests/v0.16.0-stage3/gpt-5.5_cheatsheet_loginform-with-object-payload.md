```igni
component LoginForm:
  email = ""
  password = ""

  layout vertical, gap: medium:
    input bind: email, placeholder: "Email"
    input bind: password, placeholder: "Password"
    button "Sign in", color: brand, on tap: emit submit {email: email, password: password}


screen Login:
  error_message = ""

  layout vertical, padding: large, gap: medium:
    LoginForm, on submit(credentials): sign_in(credentials)

    if error_message is not empty:
      label error_message, color: danger

  sign_in(credentials):
    result = authenticate(credentials.email, credentials.password)

    if result.success:
      navigate to Home
    else:
      error_message = result.error_message


screen Home:
  layout vertical, padding: large:
    label "Welcome", style: heading
```

The form packages the two values into a single object payload:

```igni
{email: email, password: password}
```

It emits that object with:

```igni
emit submit {email: email, password: password}
```

The parent receives it as `credentials`, then reads `credentials.email` and `credentials.password` when calling `authenticate(...)`.