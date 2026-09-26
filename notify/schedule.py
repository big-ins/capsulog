"""誰に何を送るかを決める。DB も通信も触らない。

期間の区切りは画面の判定（web/src/lib/calendar/format.ts）と揃える。
ずれると、発売期間中のバッジと通知の日が食い違う。
"""

import calendar
import datetime
from dataclasses import dataclass

JST = datetime.timezone(datetime.timedelta(hours=9))

STORE_NOTE = "店頭に並ぶ日はお店によって違います。お店の情報をご確認ください。"

# 旬の区切り。下旬の終わりは月末で、月ごとに違う
PERIODS = {"early": (1, 10, "上旬"), "mid": (11, 20, "中旬"), "late": (21, None, "下旬")}


@dataclass(frozen=True)
class Period:
    """発売期間。start と end を含む。"""

    start: datetime.date
    end: datetime.date
    # 通知のタイトル。「今日発売」とは書かない。分かっているのはメーカーの発売期間だけ
    title: str


@dataclass(frozen=True)
class Remind:
    """付いているリマインド1件。"""

    state_id: int
    user_id: int
    product_id: int
    name: str
    remind_at: datetime.datetime
    year_month: str
    precision: str | None
    detail: str | None


@dataclass(frozen=True)
class Message:
    """1人に送る1通。"""

    user_id: int
    title: str
    body: str
    url: str
    # 送れたら送った印を付ける行
    state_ids: tuple[int, ...]


def period(year_month: str, precision: str | None, detail: str | None) -> Period | None:
    """発売期間を返す。読めない値なら None。1件が壊れていても他の人には送る。"""
    try:
        return _period(year_month, precision, detail)
    except ValueError:
        return None


def _period(year_month: str, precision: str | None, detail: str | None) -> Period:
    year, month = int(year_month[:4]), int(year_month[5:7])
    last = calendar.monthrange(year, month)[1]
    if precision == "period" and detail in PERIODS:
        first, end, label = PERIODS[detail]
        return Period(
            datetime.date(year, month, first),
            datetime.date(year, month, end or last),
            f"今月{label}に発売予定",
        )
    if precision == "week" and detail:
        # 週は起点の月日だけを持つ。月末に始まる週は翌月にまたがる
        week_month, day = (int(part) for part in detail.split("-"))
        start = datetime.date(year, week_month, day)
        return Period(start, start + datetime.timedelta(days=6), "今週発売予定")
    return Period(datetime.date(year, month, 1), datetime.date(year, month, last), "今月発売予定")


def due(remind: Remind, today: datetime.date) -> Period | None:
    """今日送るべきなら、その発売期間を返す。

    送るのは、期間の中にいて、期間の初日より前に付けたもの。
    期間に入ってから付けた人は、もう発売を知っている。
    送れなかった日の分は、期間が終わるまで翌日以降に持ち越す。
    """
    span = period(remind.year_month, remind.precision, remind.detail)
    if span is None or not span.start <= today <= span.end:
        return None
    first_moment = datetime.datetime.combine(span.start, datetime.time(), JST)
    return span if remind.remind_at < first_moment else None


def plan(reminds: list[Remind], today: datetime.date) -> list[Message]:
    """今日送る通知を、人とタイトルごとに1通にまとめる。

    代表の商品は、リマインドを付けたのが一番早いもの。送るたびに変わらないようにする。
    1件なら商品詳細を、複数ならマイページを開く。
    """
    groups: dict[tuple[int, str], list[Remind]] = {}
    for remind in reminds:
        span = due(remind, today)
        if span:
            groups.setdefault((remind.user_id, span.title), []).append(remind)

    messages = []
    for (user_id, title), items in sorted(groups.items()):
        items.sort(key=lambda item: (item.remind_at, item.product_id))
        head = items[0]
        rest = f" 他{len(items) - 1}件" if len(items) > 1 else ""
        messages.append(
            Message(
                user_id=user_id,
                title=title,
                body=f"{head.name}{rest}\n{STORE_NOTE}",
                url=f"/products/{head.product_id}" if len(items) == 1 else "/mypage",
                state_ids=tuple(item.state_id for item in items),
            )
        )
    return messages
