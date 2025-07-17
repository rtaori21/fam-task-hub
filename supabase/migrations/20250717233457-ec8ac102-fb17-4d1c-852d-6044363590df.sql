-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the event reminder checker to run every minute
SELECT cron.schedule(
  'check-event-reminders',
  '* * * * *', -- every minute
  $$
  SELECT
    net.http_post(
        url:='https://mkmriglevzxrdlpkxkwv.supabase.co/functions/v1/check-event-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbXJpZ2xldnp4cmRscGt4a3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMDE5NDAsImV4cCI6MjA2Nzg3Nzk0MH0.FZlLP8aEuy2Cy34cO9Cmfqg4AHeD07PBVeMaygk0fDg"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);