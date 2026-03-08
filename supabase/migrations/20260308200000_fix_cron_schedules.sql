-- Fix cron schedules:
-- 1. send-reminders-1day: change Mon-Sat to daily (include Sunday for Monday clients)
-- 2. Handle DST: fire at both 17:00 and 18:00 UTC to cover 19:00 Polish time in both CET and CEST
--    Function is idempotent (checks reminder_1day_sent IS NULL), so double-fire is safe.

-- Remove old 1-day cron
SELECT cron.unschedule('send-reminders-1day');

-- Add two crons to cover both CET (UTC+1) and CEST (UTC+2)
-- 17:00 UTC = 19:00 CEST (summer) / 18:00 CET (winter)
-- 18:00 UTC = 20:00 CEST (summer) / 19:00 CET (winter)
SELECT cron.schedule(
  'send-reminders-1day',
  '0 17 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xsscqmlrnrodwydmgvac.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2NxbWxybnJvZHd5ZG1ndmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTMyMTgsImV4cCI6MjA4ODQ4OTIxOH0.Eg0RgjC0Pw2UyePtqNZaJV_MGoTR_R4WqmhJVtH0_jg"}'::jsonb,
    body := '{"type": "1day"}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'send-reminders-1day-dst',
  '0 18 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xsscqmlrnrodwydmgvac.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2NxbWxybnJvZHd5ZG1ndmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTMyMTgsImV4cCI6MjA4ODQ4OTIxOH0.Eg0RgjC0Pw2UyePtqNZaJV_MGoTR_R4WqmhJVtH0_jg"}'::jsonb,
    body := '{"type": "1day"}'::jsonb
  ) AS request_id;
  $$
);

-- Also fix 1-hour crons to include Sunday
SELECT cron.unschedule('send-reminders-1hour-w1');
SELECT cron.unschedule('send-reminders-1hour-w2');
SELECT cron.unschedule('send-reminders-1hour-w3');

-- Window 1: 06:00 + 07:00 UTC (covers 08:00 Polish in both CET and CEST)
SELECT cron.schedule(
  'send-reminders-1hour-w1',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xsscqmlrnrodwydmgvac.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2NxbWxybnJvZHd5ZG1ndmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTMyMTgsImV4cCI6MjA4ODQ4OTIxOH0.Eg0RgjC0Pw2UyePtqNZaJV_MGoTR_R4WqmhJVtH0_jg"}'::jsonb,
    body := '{"type": "1hour", "window": 1}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'send-reminders-1hour-w1-dst',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xsscqmlrnrodwydmgvac.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2NxbWxybnJvZHd5ZG1ndmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTMyMTgsImV4cCI6MjA4ODQ4OTIxOH0.Eg0RgjC0Pw2UyePtqNZaJV_MGoTR_R4WqmhJVtH0_jg"}'::jsonb,
    body := '{"type": "1hour", "window": 1}'::jsonb
  ) AS request_id;
  $$
);

-- Window 2: 09:00 + 10:00 UTC (covers 11:00 Polish in both CET and CEST)
SELECT cron.schedule(
  'send-reminders-1hour-w2',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xsscqmlrnrodwydmgvac.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2NxbWxybnJvZHd5ZG1ndmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTMyMTgsImV4cCI6MjA4ODQ4OTIxOH0.Eg0RgjC0Pw2UyePtqNZaJV_MGoTR_R4WqmhJVtH0_jg"}'::jsonb,
    body := '{"type": "1hour", "window": 2}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'send-reminders-1hour-w2-dst',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xsscqmlrnrodwydmgvac.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2NxbWxybnJvZHd5ZG1ndmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTMyMTgsImV4cCI6MjA4ODQ4OTIxOH0.Eg0RgjC0Pw2UyePtqNZaJV_MGoTR_R4WqmhJVtH0_jg"}'::jsonb,
    body := '{"type": "1hour", "window": 2}'::jsonb
  ) AS request_id;
  $$
);

-- Window 3: 12:00 + 13:00 UTC (covers 14:00 Polish in both CET and CEST)
SELECT cron.schedule(
  'send-reminders-1hour-w3',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xsscqmlrnrodwydmgvac.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2NxbWxybnJvZHd5ZG1ndmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTMyMTgsImV4cCI6MjA4ODQ4OTIxOH0.Eg0RgjC0Pw2UyePtqNZaJV_MGoTR_R4WqmhJVtH0_jg"}'::jsonb,
    body := '{"type": "1hour", "window": 3}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'send-reminders-1hour-w3-dst',
  '0 13 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xsscqmlrnrodwydmgvac.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzc2NxbWxybnJvZHd5ZG1ndmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTMyMTgsImV4cCI6MjA4ODQ4OTIxOH0.Eg0RgjC0Pw2UyePtqNZaJV_MGoTR_R4WqmhJVtH0_jg"}'::jsonb,
    body := '{"type": "1hour", "window": 3}'::jsonb
  ) AS request_id;
  $$
);
