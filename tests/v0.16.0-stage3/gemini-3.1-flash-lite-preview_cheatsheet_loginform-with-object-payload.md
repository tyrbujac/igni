```igni
# Login.igni

component LoginForm:
  email = ""
  password = ""
  
  layout vertical, gap: medium:
    input bind: email, placeholder: "Email"
    input bind: password, placeholder: "Password"
    button "Sign in", on tap: emit submit {email: email, password: password}

screen Login:
  error_msg = ""
  
  layout vertical, padding: large:
    LoginForm on submit(data):
      result = authenticate(data.email, data.password)
      if result.success:
        navigate to Home
      else:
        error_msg = result.error_message
    
    if error_msg is not empty:
      label error_msg, color: danger

screen Home:
  layout vertical, padding: large:
    label "Welcome"
```

### Explanation of Payload Packaging
To pass multiple values from the `LoginForm` to its parent, I utilized an **object literal** inside the `emit` statement: `{email: email, password: password}`. 

In the `Login` screen, I defined the handler using a single parameter `(data)`. Because Igni supports field access on objects, the parent accesses the individual values via dot notation (`data.email` and `data.password`) within the handler body. This keeps the event signature clean while allowing the transfer of structured, multi-field state.