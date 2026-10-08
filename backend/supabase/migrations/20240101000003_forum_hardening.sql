-- ─────────────────────────────────────────────────────────
-- Metztli — Endurece el foro anónimo
--
-- El foro permite publicar sin cuenta (rol anon), por eso se limita lo que
-- puede insertarse: categorías válidas, textos acotados y que nadie pueda
-- publicar a nombre de otra usuaria (user_id solo puede ser NULL o el propio).
-- ─────────────────────────────────────────────────────────

ALTER TABLE forum_posts DROP CONSTRAINT IF EXISTS forum_posts_alias_len;
ALTER TABLE forum_posts ADD CONSTRAINT forum_posts_alias_len
  CHECK (char_length(alias) BETWEEN 1 AND 40);

ALTER TABLE forum_posts DROP CONSTRAINT IF EXISTS forum_posts_question_len;
ALTER TABLE forum_posts ADD CONSTRAINT forum_posts_question_len
  CHECK (char_length(question) BETWEEN 1 AND 1000);

ALTER TABLE forum_posts DROP CONSTRAINT IF EXISTS forum_posts_category_valid;
ALTER TABLE forum_posts ADD CONSTRAINT forum_posts_category_valid
  CHECK (category IN ('ciclo_salud', 'embarazo_parto', 'saberes_ancestrales', 'menopausia'));

DROP POLICY IF EXISTS "Insert Forum Posts" ON forum_posts;
CREATE POLICY "Insert Forum Posts" ON forum_posts
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts (created_at DESC);
