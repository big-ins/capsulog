-- Migration number: 0006 	 2026-09-25
-- 発売リマインドを Web Push で送るための宛先と、送る判定に使う時刻

-- 通知の宛先。通知を許可した端末ごとに1行
CREATE TABLE push_subscriptions (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- 同じ端末で別の人がログインし直したら、行を増やさず持ち主を付け替える
  endpoint   TEXT    NOT NULL UNIQUE,   -- 宛先の URL。ブラウザが発行する
  p256dh     TEXT    NOT NULL,          -- 端末の公開鍵。本文を端末しか読めない形にする
  auth       TEXT    NOT NULL,          -- 端末が作った乱数。暗号化の材料に混ぜる
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

-- リマインドを付けた時刻。外すと NULL に戻す。
-- created_at は行を作った時刻で、先にお気に入りを付けていると区別できない
ALTER TABLE user_product_states ADD COLUMN remind_at TEXT;

-- 通知を送った時刻。バッチを再実行しても二重に送らない
ALTER TABLE user_product_states ADD COLUMN notified_at TEXT;

-- 付いている分は付けた時刻が分からない。最後に更新した時刻で埋める。
-- 実際より遅い時刻になるので、送るべきでないものに送ることはない
UPDATE user_product_states SET remind_at = updated_at WHERE remind = 1;
