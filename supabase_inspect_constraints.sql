-- INSPECT CONSTRAINTS
-- Run this script to see EXACTLY which table is linking to `auth.users`
-- and what the specific name of that constraint is.

SELECT
    conrelid::regclass AS table_from,
    conname AS constraint_name,
    confrelid::regclass AS table_to
FROM
    pg_constraint
WHERE
    confrelid = 'auth.users'::regclass;
