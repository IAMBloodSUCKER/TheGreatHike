-- Миграция для существующих БД (admin, feedback и длина хеша капчи).
ALTER TABLE IF EXISTS auth.captcha_challenges ALTER COLUMN answer_hash TYPE varchar(128);

ALTER TABLE IF EXISTS auth.users ADD COLUMN IF NOT EXISTS admin boolean;
UPDATE auth.users SET admin = false WHERE admin IS NULL;
ALTER TABLE IF EXISTS auth.users ALTER COLUMN admin SET DEFAULT false;
ALTER TABLE IF EXISTS auth.users ALTER COLUMN admin SET NOT NULL;

CREATE TABLE IF NOT EXISTS auth.feedback (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    username varchar(64) NOT NULL,
    message text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    admin_reply text,
    replied_at timestamptz
);

UPDATE auth.users SET admin = true WHERE username = 'admin';

UPDATE tracking.visits SET color = 'BROWN' WHERE color IS NULL;
