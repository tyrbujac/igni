```igni
screen Profile:
  tick = 0
  me = fetch("/api/me?t=" + tick)

  posts = null
  if me is not loading and me is not error:
    posts = fetch("/api/users/" + me.id + "/posts?t=" + tick)

  if me is loading or posts is null:
    spinner
  else if posts is loading:
    spinner
  else if me is error or posts is error:
    label "Error loading profile"
  else:
    layout vertical, padding: large:
      layout vertical, fill: true, gap: medium:
        image me.avatar_url, size: 80, round: true
        label me.name, style: heading
        label me.bio, style: body
        
        divider
        
        if posts is empty:
          label "No posts yet"
        else:
          each post in posts:
            layout horizontal, spread: true:
              label post.title
              label post.created_at, style: caption
              
      button "Refresh", on tap: tick = tick + 1
```