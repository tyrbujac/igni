Here is the complete Igni code for your two-screen app:

```igni
component LoginForm:
  email = ""
  password = ""

  layout vertical, gap: medium:
    input bind: email, placeholder: "Email"
    input bind: password, placeholder: "Password"
    button "Sign in", on tap: emit submit {email: email, password: password}

screen Login:
  auth_error = ""

  layout vertical, padding: large, align: center:
    label "Log In", style: heading
    
    LoginForm on submit(data): process_login(data)
    
    if auth_error is not empty:
      label auth_error, color: danger

  process_login(data):
    result = authenticate(data.email, data.password)
    
    if result.success:
      navigate to Home
    else:
      auth_error = result.error_message

  authenticate(email, password):
    # Mocking the requested authentication function
    if email is "user@example.com" and password is "password":
      return {success: true, error_message: ""}
    
    return {success: false, error_message: "Invalid credentials"}

screen Home:
  layout vertical, padding: large, align: center:
    label "Welcome", style: heading
```

### How the multi-value payload was packaged

Igni's `emit` keyword allows exactly one positional payload per event. To send both the `email` and `password` up to the parent simultaneously, I packed them into a single object literal:

1. **Emission:** In the child component, the button's action uses an object literal to package the variables: `emit submit {email: email, password: password}`. 
2. **Reception:** In the parent screen, the component declaration receives this object by defining a single parameter in parentheses: `on submit(data): process_login(data)`.
3. **Access:** The parent function accesses the fields via standard dot-notation (`data.email`, `data.password`).