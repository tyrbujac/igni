```igni
shared persisted:
  work_mins = 25
  break_mins = 5
  sound = true

screen Pomodonut:
  is_work = true
  is_running = false

  start_time = now()
  elapsed_accumulated = 0
  tick = now()

  every 1s:
    tick = now()
    if is_running:
      current_elapsed = elapsed_accumulated + (tick - start_time)
      
      current_total = shared.break_mins * 60
      if is_work:
        current_total = shared.work_mins * 60
        
      if current_total - current_elapsed <= 0:
        if shared.sound:
          play("ding.wav")
        is_work = not is_work
        elapsed_accumulated = current_elapsed - current_total
        start_time = now()

  elapsed():
    ans = elapsed_accumulated
    if is_running:
      ans = elapsed_accumulated + (tick - start_time)
    return ans

  total_secs():
    ans = shared.break_mins * 60
    if is_work:
      ans = shared.work_mins * 60
    return ans

  remaining_secs():
    rem = total_secs() - elapsed()
    if rem < 0:
      rem = 0
    return