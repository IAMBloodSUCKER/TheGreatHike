-- Миграция v3: поля users и feedback, добавленные после первого релиза.

ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS gender varchar(8);
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS recovery_key_hash varchar(255);

ALTER TABLE auth.feedback ADD COLUMN IF NOT EXISTS admin_initiated boolean NOT NULL DEFAULT false;
ALTER TABLE auth.feedback ADD COLUMN IF NOT EXISTS reply_read_at timestamptz;

UPDATE auth.users SET blocked = false WHERE blocked IS NULL;
UPDATE auth.users SET gender = 'MALE' WHERE gender IS NULL;
