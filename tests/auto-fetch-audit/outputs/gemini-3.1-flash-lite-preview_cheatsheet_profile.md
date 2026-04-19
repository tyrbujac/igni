screen ProfileApp:
  user = fetch("/api/me")
  posts = fetch("/api/users/" + (user.id or "0") + "/posts")
  
  if user is loading or posts is loading:
    layout vertical, fill: true, align: center:
      spinner
  else if user is error or posts is error:
    layout vertical, fill: true, align: center:
      label "Failed to load profile"
  else:
    layout vertical, padding: large:
      image user.avatar_url, size: 80, round: true
      label user.name, style: heading
      label user.bio, style: body
      
      divider
      
      layout vertical, gap: medium:
        each post in posts:
          layout horizontal:
            label post.title
            label post.created_at, style: caption
            
      layout vertical, fill: true
      
      button "Refresh", on tap: refresh()

  refresh():
    user = fetch("/api/me")
    posts = fetch("/api/users/" + (user.id or "0") + "/posts")