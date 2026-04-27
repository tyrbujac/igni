Here is the complete Igni code for the app, following all constraints and reactivity rules.

```igni
component LoginForm:
  email = ""
  password = ""

  layout vertical, gap: medium:
    input bind: email, placeholder: "Email"
    input bind: password, placeholder: "Password"
    button "Sign in", on tap: emit submit {email: email, password: password}


screen Login:
  error_msg = ""

  layout vertical, padding: large, gap: medium:
    label "Log In", style: heading
    
    LoginForm on submit(data): handle_login(data)
    
    if error_msg is not empty:
      label error_msg, color: danger

  handle_login(data):
    result = authenticate(data.email, data.password)
    if result.success:
      navigate to Home
    else:
      error_msg = result.error_message

  authenticate(email, password):
    # Mock implementation of the assumed authentication function
    if email is "user@example.com" and password is "1234":
      return {success: true, error_message: ""}
    else:
      return {success: false, error_message: "Invalid email or password"}


screen Home:
  layout vertical, padding: large, align: center:
    label "Welcome", style: heading
```

### How the Multi-Value Payload works

In Igni, an `emit` statement can only pass a *single* positional value. To pass multiple variables (like `email` and `password`), you bundle them into an **object literal** right in the emit payload:

1. **Child emits an object:** Inside the `LoginForm`, the button’s action creates the object on the fly: 
   `emit submit {email: email, password: password}`
2. **Parent catches the payload:** The `Login` screen listens for the event, naming the incoming object whatever it likes in parentheses:
   `on submit(data): handle_login(data)`
3. **Parent unpacks fields:** Inside its internal function, the parent accesses the packed values using standard dot notation: `data.email` and `data.password`.