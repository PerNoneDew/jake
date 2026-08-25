/*
# Create role_permissions table

## Purpose
A persistent, admin-configurable permission matrix that controls which sidebar
module groups each system role can see and use. Replaces the hard-coded
`roles: string[]` arrays in the Sidebar nav config so the admin can grant or
revoke access to entire feature areas per role without changing code.

## New Tables
- `role_permissions`
  - `id` text PRIMARY KEY — permission key (format: `<role>:<module>`).
  - `role` text NOT NULL — app role: admin, health_officer, staff, faculty, employee, student.
  - `module` text NOT NULL — sidebar module group key (e.g. inventory_purchases).
  - `allowed` boolean NOT NULL DEFAULT true — whether the role can access the module.
  - `updated_at` timestamp DEFAULT now().
  - Unique constraint on (role, module).

## Security (RLS)
Single-tenant app: the frontend uses the anon key (no Supabase Auth sign-in
screen), so policies are scoped to `TO anon, authenticated` with true
predicates. The permission matrix is intentionally shared/public data.

## Notes
1. Seeded with defaults matching the current hard-coded sidebar config.
2. admin always has full access (app fallback); admin toggles are hidden in UI.
3. Missing role/module rows fall back to the built-in default (allowed).
*/
CREATE TABLE IF NOT EXISTS role_permissions (
  id text PRIMARY KEY,
  role text NOT NULL,
  module text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (role, module)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rp_select_all" ON role_permissions;
CREATE POLICY "rp_select_all" ON role_permissions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "rp_insert_all" ON role_permissions;
CREATE POLICY "rp_insert_all" ON role_permissions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "rp_update_all" ON role_permissions;
CREATE POLICY "rp_update_all" ON role_permissions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "rp_delete_all" ON role_permissions;
CREATE POLICY "rp_delete_all" ON role_permissions FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO role_permissions (id, role, module, allowed) VALUES
  ('health_officer:people_health_records', 'health_officer', 'people_health_records', true),
  ('student:people_health_records', 'student', 'people_health_records', true),
  ('staff:people_health_records', 'staff', 'people_health_records', true),
  ('faculty:people_health_records', 'faculty', 'people_health_records', true),
  ('employee:people_health_records', 'employee', 'people_health_records', true),
  ('health_officer:health_services', 'health_officer', 'health_services', true),
  ('student:health_services', 'student', 'health_services', true),
  ('staff:health_services', 'staff', 'health_services', true),
  ('faculty:health_services', 'faculty', 'health_services', true),
  ('employee:health_services', 'employee', 'health_services', true),
  ('health_officer:inventory_purchases', 'health_officer', 'inventory_purchases', true),
  ('health_officer:reports_notifications', 'health_officer', 'reports_notifications', true),
  ('student:reports_notifications', 'student', 'reports_notifications', true),
  ('staff:reports_notifications', 'staff', 'reports_notifications', true),
  ('faculty:reports_notifications', 'faculty', 'reports_notifications', true),
  ('employee:reports_notifications', 'employee', 'reports_notifications', true)
ON CONFLICT (id) DO NOTHING;
