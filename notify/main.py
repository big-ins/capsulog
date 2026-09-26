"""発売リマインドを Web Push で送る。日次で1回実行する。

送る相手と文面は schedule が決める。ここは DB を読み、送り、結果を書くだけ。
接続先は環境変数 D1_TARGET で選ぶ（既定はローカル）。
"""

import argparse
import datetime
import logging
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "shared"))

import d1
import logging_setup
import schedule
import webpush

logger = logging.getLogger("notify")

# 届いた。提供元によって 201 以外の 2xx も返す
DELIVERED = {200, 201, 202}
# 宛先が切れている。端末で通知を切った、ブラウザのデータを消した、など
GONE = {404, 410}


def load_reminds(db, today: datetime.date) -> list[schedule.Remind]:
    """まだ送っていないリマインドを読む。

    発売期間は月をまたぐことがある（月末に始まる週）。前の月の分まで読む。
    退会した人には送らない。
    """
    first = today.replace(day=1)
    previous = (first - datetime.timedelta(days=1)).strftime("%Y-%m")
    rows = db.query(
        """SELECT s.id AS state_id, s.user_id, s.remind_at,
                  p.id AS product_id, p.name, p.release_year_month,
                  p.release_precision, p.release_detail
           FROM user_product_states s
           JOIN products p ON p.id = s.product_id
           JOIN users u ON u.id = s.user_id
           WHERE s.remind = 1 AND s.notified_at IS NULL AND s.remind_at IS NOT NULL
             AND u.deletedAt IS NULL
             AND p.release_year_month BETWEEN ? AND ?""",
        [previous, today.strftime("%Y-%m")],
    )
    return [
        schedule.Remind(
            state_id=row["state_id"],
            user_id=row["user_id"],
            product_id=row["product_id"],
            name=row["name"],
            remind_at=datetime.datetime.fromisoformat(row["remind_at"]),
            year_month=row["release_year_month"],
            precision=row["release_precision"],
            detail=row["release_detail"],
        )
        for row in rows
    ]


def deliver(db, message: schedule.Message, private_key: str, now: str) -> bool:
    """1人の全端末へ送る。1台でも届けば、送った印を付けて True を返す。

    1台も届かなければ印を付けない。翌日に送り直す。
    宛先を1つも持っていない人も同じ。期間中に通知を許可すれば、翌朝に届く。
    """
    subscriptions = db.query(
        "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?",
        [message.user_id],
    )
    payload = {"title": message.title, "body": message.body, "url": message.url}

    delivered = False
    for sub in subscriptions:
        try:
            status = webpush.send(sub["endpoint"], sub["p256dh"], sub["auth"], payload, private_key)
        except Exception:  # 1台が繋がらなくても、他の端末には送る
            logger.exception(f"送れない user={message.user_id} sub={sub['id']}")
            continue
        if status in DELIVERED:
            delivered = True
        elif status in GONE:
            db.query("DELETE FROM push_subscriptions WHERE id = ?", [sub["id"]])
            logger.info(f"宛先が切れている。消す user={message.user_id} sub={sub['id']}")
        else:
            logger.warning(f"届かない user={message.user_id} sub={sub['id']} status={status}")

    if delivered:
        placeholders = ", ".join("?" for _ in message.state_ids)
        db.query(
            f"UPDATE user_product_states SET notified_at = ? WHERE id IN ({placeholders})",
            [now, *message.state_ids],
        )
    return delivered


def main():
    """今日送る通知を集めて送る。1人が失敗しても残りは進める。"""
    ap = argparse.ArgumentParser(description="発売リマインドを送る")
    ap.add_argument("--dry-run", action="store_true", help="送る内容を出すだけで送らない")
    ap.add_argument("--today", help="この日として動かす。YYYY-MM-DD。試すとき用")
    args = ap.parse_args()

    logging_setup.setup(Path(__file__).parent / "logs")
    now = datetime.datetime.now(datetime.UTC)
    today = (
        datetime.date.fromisoformat(args.today)
        if args.today
        else now.astimezone(schedule.JST).date()
    )
    private_key = os.environ.get("VAPID_PRIVATE_KEY")
    if not private_key and not args.dry_run:
        raise RuntimeError("VAPID_PRIVATE_KEY が未設定")

    db = d1.connect(str(Path(__file__).parent.parent))
    messages = schedule.plan(load_reminds(db, today), today)

    sent = failed = 0
    for message in messages:
        if args.dry_run:
            logger.info(
                f"送る user={message.user_id} {message.title} / {message.body!r} {message.url}"
            )
            continue
        try:
            if deliver(db, message, private_key, now.isoformat(timespec="seconds")):
                sent += 1
        except Exception:  # 1人の失敗で全体を止めない。送れなかった分は翌日に持ち越す
            logger.exception(f"失敗 user={message.user_id}")
            failed += 1

    logger.info(
        f"完了 today={today} 対象={len(messages)} 送れた={sent} 失敗={failed}"
        + (" dry_run=1" if args.dry_run else "")
    )
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
