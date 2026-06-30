ALTER TABLE IF EXISTS auth.captcha_challenges ALTER COLUMN answer_hash TYPE varchar(128);
