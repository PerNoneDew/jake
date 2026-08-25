-- Restore open CRUD policies on users table for the single-tenant mock-auth app.
-- A later migration had replaced the original open policies with session-based
-- ones (app_current_user_id), which return nothing before login — so the anon
-- client could never read the users table and login always failed.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "session_select_users" ON public.users;
DROP POLICY IF EXISTS "anon_select_users" ON public.users;
CREATE POLICY "anon_select_users" ON public.users FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_users" ON public.users;
CREATE POLICY "anon_insert_users" ON public.users FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_users" ON public.users;
CREATE POLICY "anon_update_users" ON public.users FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_users" ON public.users;
CREATE POLICY "anon_delete_users" ON public.users FOR DELETE
  TO anon, authenticated USING (true);
