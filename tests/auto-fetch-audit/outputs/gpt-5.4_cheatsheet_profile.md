screen ProfileApp:
  refresh_key = 0
  user_url = "/api/me?refresh=" + refresh_key
  user = fetch(user_url)

  posts_url = ""
  if user is not loading and user is not error and user is not null:
    posts_url = "/api/users/" + user.id + "/posts?refresh=" + refresh_key
  posts = fetch(posts_url)

  loading = false
  if user is loading:
    loading = true
  else if posts_url is not "" and posts is loading:
    loading = true

  layout vertical, padding: large:
    if loading:
      layout vertical, fill: true, align: center:
        spinner
    else if user is error:
      layout vertical, fill: true, align: center:
        label "Failed to load profile"
    else if posts_url is not "" and posts is error:
      layout vertical, fill: true, align: center:
        label "Failed to load posts"
    else:
      layout vertical, gap: medium, fill: true:
        label user.name, style: heading
        label user.bio, style: body
        divider
        each post in posts:
          layout horizontal, spread: true:
            label post.title
            label post.created_at, style: caption

    button "Refresh", on tap: refresh_key = refresh_key + 1