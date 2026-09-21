-- Migration number: 0005 	 2026-09-21
-- 商品に対する自分の状態。お気に入りとリマインドをそれぞれ独立に付けられる

CREATE TABLE user_product_states (
  id                INTEGER PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id        INTEGER REFERENCES products(id) ON DELETE CASCADE,
  custom_product_id INTEGER,                      -- 自分用の商品。テーブルは後で作る
  favorited         INTEGER NOT NULL DEFAULT 0,   -- 後で見返したい
  remind            INTEGER NOT NULL DEFAULT 0,   -- 発売を知らせてほしい
  created_at        TEXT    NOT NULL,
  updated_at        TEXT    NOT NULL,
  -- どちらか一方だけが埋まる
  CHECK ((product_id IS NULL) <> (custom_product_id IS NULL)),
  -- 両方外れた行は残さない
  CHECK (favorited + remind > 0)
);

-- 同じ商品に二重の行を作らない。NULL は UNIQUE の対象外なので列ごとに張る
CREATE UNIQUE INDEX idx_states_product        ON user_product_states(user_id, product_id);
CREATE UNIQUE INDEX idx_states_custom_product ON user_product_states(user_id, custom_product_id);
