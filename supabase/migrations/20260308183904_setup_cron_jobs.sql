-- Cron jobs for SMS reminders and offer reminders
-- Schedules are in UTC (pg_cron runs in UTC)
-- All target functions have verify_jwt = false, so anon key is sufficient

-- Job: send-offer-reminders - daily at 12:30 UTC (14:30 PL summer)
SELECT cron.schedule(
  'send-offer-reminders',
  '30 12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xsscqmlrnrodwydmgvac.supabase.co/functions/v1/send-offer-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2NxbWxybnJvZHd5ZG1ndmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTMyMTgsImV4cCI6MjA4ODQ4OTIxOH0.Eg0RgjC0Pw2UyePtqNZaJV_MGoTR_R4WqmhJVtH0_jg"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Job: send-reminders 1day - Mon-Sat at 17:00 UTC (19:00 PL summer)
SELECT cron.schedule(
  'send-reminders-1day',
  '0 17 * * 1-6',
  $$
  SELECT net.http_post(
    url := 'https://xsscqmlrnrodwydmgvac.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2NxbWxybnJvZHd5ZG1ndmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTMyMTgsImV4cCI6MjA4ODQ4OTIxOH0.Eg0RgjC0Pw2UyePtqNZaJV_MGoTR_R4WqmhJVtH0_jg"}'::jsonb,
    body := '{"type": "1day"}'::jsonb
  ) AS request_id;
  $$
);

-- Job: send-reminders 1hour window 1 - Mon-Sat at 06:00 UTC (08:00 PL summer)
SELECT cron.schedule(
  'send-reminders-1hour-w1',
  '0 6 * * 1-6',
  $$
  SELECT net.http_post(
    url := 'https://xsscqmlrnrodwydmgvac.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2NxbWxybnJvZHd5ZG1ndmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTMyMTgsImV4cCI6MjA4ODQ4OTIxOH0.Eg0RgjC0Pw2UyePtqNZaJV_MGoTR_R4WqmhJVtH0_jg"}'::jsonb,
    body := '{"type": "1hour", "window": 1}'::jsonb
  ) AS request_id;
  $$
);

-- Job: send-reminders 1hour window 2 - Mon-Sat at 09:00 UTC (11:00 PL summer)
SELECT cron.schedule(
  'send-reminders-1hour-w2',
  '0 9 * * 1-6',
  $$
  SELECT net.http_post(
    url := 'https://xsscqmlrnrodwydmgvac.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2NxbWxybnJvZHd5ZG1ndmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTMyMTgsImV4cCI6MjA4ODQ4OTIxOH0.Eg0RgjC0Pw2UyePtqNZaJV_MGoTR_R4WqmhJVtH0_jg"}'::jsonb,
    body := '{"type": "1hour", "window": 2}'::jsonb
  ) AS request_id;
  $$
);

-- Job: send-reminders 1hour window 3 - Mon-Sat at 12:00 UTC (14:00 PL summer)
SELECT cron.schedule(
  'send-reminders-1hour-w3',
  '0 12 * * 1-6',
  $$
  SELECT net.http_post(
    url := 'https://xsscqmlrnrodwydmgvac.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2NxbWxybnJvZHd5ZG1ndmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTMyMTgsImV4cCI6MjA4ODQ4OTIxOH0.Eg0RgjC0Pw2UyePtqNZaJV_MGoTR_R4WqmhJVtH0_jg"}'::jsonb,
    body := '{"type": "1hour", "window": 3}'::jsonb
  ) AS request_id;
  $$
);
