-- Server-side OAuth callbacks and sync use the service role key.
-- service_role bypasses RLS but still needs table-level grants in Postgres.

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

alter default privileges in schema public
grant select, insert, update, delete on tables to service_role;

alter default privileges in schema public
grant usage, select on sequences to service_role;