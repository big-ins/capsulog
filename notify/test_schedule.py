"""送る相手と文面の決め方を確かめる。

uv run python -m unittest discover -s notify
"""

import datetime
import unittest

from schedule import JST, STORE_NOTE, Remind, due, period, plan


def at(text: str) -> datetime.datetime:
    """日本時間の時刻。"""
    return datetime.datetime.fromisoformat(text).replace(tzinfo=JST)


def remind(
    state_id=1, user_id=1, product_id=1, name="商品", remind_at="2026-09-01T12:00", **release
):
    release = {"year_month": "2026-10", "precision": "month", "detail": None, **release}
    return Remind(
        state_id=state_id,
        user_id=user_id,
        product_id=product_id,
        name=name,
        remind_at=at(remind_at),
        **release,
    )


class PeriodTest(unittest.TestCase):
    def test_month(self):
        span = period("2026-02", "month", None)
        self.assertEqual(
            (span.start, span.end), (datetime.date(2026, 2, 1), datetime.date(2026, 2, 28))
        )
        self.assertEqual(span.title, "今月発売予定")

    def test_period(self):
        self.assertEqual(period("2026-10", "period", "early").end, datetime.date(2026, 10, 10))
        self.assertEqual(period("2026-10", "period", "mid").start, datetime.date(2026, 10, 11))
        # 下旬は月末まで
        self.assertEqual(period("2026-10", "period", "late").end, datetime.date(2026, 10, 31))
        self.assertEqual(period("2026-10", "period", "mid").title, "今月中旬に発売予定")

    def test_week_crosses_month(self):
        """月末に始まる週は翌月にまたがる。"""
        span = period("2026-09", "week", "09-28")
        self.assertEqual(
            (span.start, span.end), (datetime.date(2026, 9, 28), datetime.date(2026, 10, 4))
        )
        self.assertEqual(span.title, "今週発売予定")

    def test_unreadable(self):
        self.assertIsNone(period("2026-09", "week", "13-40"))


class DueTest(unittest.TestCase):
    def test_on_first_day(self):
        """期間の初日に送る。"""
        self.assertIsNotNone(due(remind(), datetime.date(2026, 10, 1)))

    def test_before_and_after(self):
        """期間の前と後には送らない。"""
        self.assertIsNone(due(remind(), datetime.date(2026, 9, 30)))
        self.assertIsNone(due(remind(), datetime.date(2026, 11, 1)))

    def test_carry_over(self):
        """送れなかった日の分は、期間の中なら翌日以降に送る。"""
        self.assertIsNotNone(due(remind(), datetime.date(2026, 10, 15)))

    def test_set_during_period(self):
        """期間に入ってから付けたものには送らない。"""
        self.assertIsNone(due(remind(remind_at="2026-10-01T00:00"), datetime.date(2026, 10, 2)))
        # 前日の夜に付けたものは送る
        self.assertIsNotNone(due(remind(remind_at="2026-09-30T23:59"), datetime.date(2026, 10, 1)))


class PlanTest(unittest.TestCase):
    TODAY = datetime.date(2026, 10, 1)

    def test_single(self):
        [message] = plan([remind(product_id=7, name="ちいかわ マスコット")], self.TODAY)
        self.assertEqual(message.title, "今月発売予定")
        self.assertEqual(message.body, f"ちいかわ マスコット\n{STORE_NOTE}")
        self.assertEqual(message.url, "/products/7")

    def test_grouped_with_earliest_as_head(self):
        """同じタイトルは1通にまとめ、付けたのが一番早い商品を代表にする。"""
        reminds = [
            remind(state_id=1, product_id=1, name="後", remind_at="2026-09-10T00:00"),
            remind(state_id=2, product_id=2, name="先", remind_at="2026-09-01T00:00"),
            remind(state_id=3, product_id=3, name="中", remind_at="2026-09-05T00:00"),
        ]
        [message] = plan(reminds, self.TODAY)
        self.assertEqual(message.body, f"先 他2件\n{STORE_NOTE}")
        self.assertEqual(message.url, "/mypage")
        self.assertEqual(sorted(message.state_ids), [1, 2, 3])

    def test_split_by_title_and_user(self):
        """タイトルが違えば分ける。人が違えば分ける。"""
        reminds = [
            remind(state_id=1, user_id=1),
            remind(state_id=2, user_id=1, precision="period", detail="early"),
            remind(state_id=3, user_id=2),
        ]
        messages = plan(reminds, self.TODAY)
        self.assertEqual(
            sorted((m.user_id, m.title) for m in messages),
            [(1, "今月上旬に発売予定"), (1, "今月発売予定"), (2, "今月発売予定")],
        )

    def test_nothing_due(self):
        self.assertEqual(plan([remind()], datetime.date(2026, 9, 15)), [])


if __name__ == "__main__":
    unittest.main()
