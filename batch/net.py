"""HTTP 取得。全リクエストに UA を付け、1秒以上あける。"""

import ssl
import time
import urllib.error
import urllib.request
from pathlib import Path

UA = "capsulog-batch/0.1 (contact: ouchi@fintechsys.co.jp)"
INTERVAL = 1.0

# 接続の揺らぎで1社が丸ごと落ちないようにする。待ち時間は 2 秒、4 秒と広げる
RETRIES = 3
BACKOFF = 2.0

# ターリンのサーバは中間証明書を配信していないため、こちらで補う
_CTX = ssl.create_default_context()
_CTX.load_verify_locations(Path(__file__).parent / "globalsign-intermediate.pem")

_last = 0.0


def _fetch(url: str, timeout: int) -> bytes:
    """1回だけ取得する。前回のリクエストから1秒たっていなければ、たつまで待つ。

    メーカーのサーバに負荷をかけないための待機で、外してはいけない。
    """
    global _last
    wait = _last + INTERVAL - time.monotonic()
    if wait > 0:
        time.sleep(wait)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=_CTX) as f:
            body = f.read()
    except urllib.error.HTTPError as e:
        # ステータスだけでは原因を追えない。本文の先頭を理由に含めて投げ直す。
        # 型とコードを保つのは、呼び出し側がページ終端の判定に使うため
        detail = " ".join(e.read().decode("utf-8", "replace").split())[:200]
        raise urllib.error.HTTPError(
            e.url, e.code, f"{e.reason} body={detail}", e.headers, None
        ) from None
    _last = time.monotonic()
    return body


def get(url: str, timeout: int = 30, log=None) -> bytes:
    """URL を取得してボディを返す。繋がらなければ間隔をあけて3回まで試す。

    再試行するのは接続とタイムアウトの失敗だけ。
    HTTPError はサーバが返した答えなので、そのまま投げる。
    """
    for attempt in range(1, RETRIES):
        try:
            return _fetch(url, timeout)
        except urllib.error.HTTPError:
            raise
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            wait = BACKOFF * attempt
            if log:
                log.warning(f"取得に失敗 {attempt}/{RETRIES} {wait:.0f}s 待つ url={url} {e}")
            time.sleep(wait)
    # 最後の1回。ここで失敗したら呼び出し側に投げる
    return _fetch(url, timeout)


def get_text(url: str, timeout: int = 30, log=None) -> str:
    """URL を取得して UTF-8 文字列として返す。壊れたバイトは置換する。"""
    return get(url, timeout, log).decode("utf-8", "replace")
