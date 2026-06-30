-- Комментарий администратора при блокировке
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS block_comment TEXT;
