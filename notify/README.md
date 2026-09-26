# notify

発売リマインドを Web Push で送る。日次で1回実行する。

## 実行

```bash
uv run --env-file notify/.env notify/main.py                        # 送る
uv run notify/main.py --dry-run                                     # 送る内容を出すだけ
uv run --env-file notify/.env notify/main.py --today 2026-10-01     # この日として送る
```

`notify/.env` に開発用の `VAPID_PRIVATE_KEY` を置く。コミットしない。`--dry-run` なら要らない。

接続先は環境変数 `D1_TARGET` で選ぶ。収集と同じ。

| 値 | 先 |
|---|---|
| `local`（既定） | 手元の D1。`web/.wrangler/` の SQLite |
| `remote` | 本番の D1。`CLOUDFLARE_API_TOKEN` が要る |

## 送るもの

**送るのは、発売期間の中にいて、期間の初日より前に付けていて、まだ送っていないリマインド。**
期間に入ってから付けた人は、もう発売を知っている。

送れたら `notified_at` を入れる。再実行しても二重に送らない。
送れなかった日の分は、期間が終わるまで翌日以降に持ち越す。

| 粒度 | 期間 | タイトル |
|---|---|---|
| 週 | 起点の日から6日後まで | 今週発売予定 |
| 旬 | 上旬 1〜10日、中旬 11〜20日、下旬 21日〜月末 | 今月上旬に発売予定 |
| 月 | 1日〜月末 | 今月発売予定 |

期間の区切りは画面の判定（`web/src/lib/calendar/format.ts`）と揃える。
ずれると、発売期間中のバッジと通知の日が食い違う。

**同じ人の同じタイトルは1通にまとめる。** 代表はリマインドを付けたのが一番早い商品。
1件なら商品詳細を、複数ならマイページを開く。

**その人の全端末に送る。** 1台でも届けば送った印を付ける。
404 か 410 が返った宛先は切れているので消す。
宛先を1つも持っていない人には送らず、印も付けない。期間中に通知を許可すれば、翌朝に届く。

## 日次実行

`.github/workflows/notify.yml` が毎朝8時（JST）に本番へ送る。
収集（5時）の後にして、発売時期が新しいもので判定する。

## コードの書き方

`batch/` と同じ。docstring は PEP 257 に従う。

**依存が1つある。** `cryptography`。本文の暗号化と送り主の署名に、楕円曲線と AES-GCM が要る。
標準ライブラリには無い。部品だけを借り、組み立ては `webpush.py` で RFC どおりに書く。

| ファイル | 中身 |
|---|---|
| `main.py` | DB を読み、送り、結果を書く |
| `schedule.py` | 誰に何を送るかを決める。DB も通信も触らない |
| `webpush.py` | 1通送る。暗号化（RFC 8291）と署名（RFC 8292） |

## テスト

```bash
uv run python -m unittest discover -s notify
```

暗号化は RFC 8291 付録 A の見本の値と、1バイトも違わないかで確かめる。

## lint

```bash
ruff check .
ruff format .
```
