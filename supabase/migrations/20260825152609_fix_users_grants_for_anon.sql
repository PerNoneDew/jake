-- Restore table-level GRANTs on the users table for the anon/authenticated roles.
-- A prior migration had revoked SELECT/INSERT/UPDATE/DELETE, leaving only TRIGGER.
-- Without these GRANTs, the anon-key frontend cannot read the users table at all,
-- so mock login always fails with "invalid email or password" even though the
-- row exists and RLS policies are open.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
