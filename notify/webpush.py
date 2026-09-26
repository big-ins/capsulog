"""Web Push を1通送る。

本文は端末しか読めない形にして送る（RFC 8291）。途中でブラウザの提供元のサーバを通るため。
送り主は VAPID の鍵で署名して示す（RFC 8292）。

暗号の部品は cryptography を使う。標準ライブラリには楕円曲線も AES-GCM も無い。
ここで書くのは、部品を RFC どおりに組み合わせる部分だけ。
"""

import base64
import json
import os
import struct
import time
import urllib.error
import urllib.parse
import urllib.request

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

# 送り主の連絡先。届かない・多すぎるときに、提供元がここへ連絡してくる
SUBJECT = "mailto:ouchi421taiga@gmail.com"

# 1つの暗号文の大きさの上限。本文は1つに収まる短さなので、仕様の既定値のまま
RECORD_SIZE = 4096

# 届けるのを諦めるまでの時間。発売時期の知らせは翌日には古い
TTL_SECONDS = 12 * 60 * 60


def b64decode(value: str) -> bytes:
    """パディングの無い base64url を戻す。"""
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def b64encode(value: bytes) -> str:
    """パディングの無い base64url にする。"""
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode()


def _hkdf(salt: bytes, ikm: bytes, info: bytes, length: int) -> bytes:
    return HKDF(algorithm=hashes.SHA256(), length=length, salt=salt, info=info).derive(ikm)


def _public_bytes(key: ec.EllipticCurvePrivateKey) -> bytes:
    """公開鍵を 65 バイトの非圧縮形式にする。先頭が 0x04。"""
    return key.public_key().public_bytes(
        serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint
    )


def encrypt(
    plaintext: bytes,
    p256dh: str,
    auth: str,
    salt: bytes | None = None,
    server_key: ec.EllipticCurvePrivateKey | None = None,
) -> bytes:
    """本文を端末しか読めない形にする。送る本体をそのまま返す。

    salt と server_key は送るたびに作り直す。テストで決まった値を渡すためだけに引数にしている。

    Args:
        plaintext: 送る本文。
        p256dh: 端末の公開鍵。宛先を作ったときにブラウザが渡してくる。
        auth: 端末が作った乱数。同上。
    """
    salt = salt or os.urandom(16)
    server_key = server_key or ec.generate_private_key(ec.SECP256R1())

    ua_public = b64decode(p256dh)
    as_public = _public_bytes(server_key)
    shared = server_key.exchange(
        ec.ECDH(), ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(), ua_public)
    )

    # 端末の乱数と鍵交換の結果から、この1通だけの鍵を作る。順序と区切りの 0 は RFC の定め
    ikm = _hkdf(b64decode(auth), shared, b"WebPush: info\x00" + ua_public + as_public, 32)
    key = _hkdf(salt, ikm, b"Content-Encoding: aes128gcm\x00", 16)
    nonce = _hkdf(salt, ikm, b"Content-Encoding: nonce\x00", 12)

    # 末尾の 0x02 は「これが最後の塊」の印
    ciphertext = AESGCM(key).encrypt(nonce, plaintext + b"\x02", None)
    header = salt + struct.pack(">IB", RECORD_SIZE, len(as_public)) + as_public
    return header + ciphertext


def vapid_header(endpoint: str, private_key: str, now: int | None = None) -> str:
    """送り主を示す Authorization の値を作る。

    宛先のサーバごとに署名が要る。aud には宛先のオリジンを入れる。

    Args:
        endpoint: 宛先の URL。
        private_key: VAPID の秘密鍵。base64url の 32 バイト。
    """
    key = ec.derive_private_key(int.from_bytes(b64decode(private_key)), ec.SECP256R1())
    url = urllib.parse.urlsplit(endpoint)
    claims = {
        "aud": f"{url.scheme}://{url.netloc}",
        # 上限は 24 時間。送り終えるまで持てばよい
        "exp": (now or int(time.time())) + 12 * 60 * 60,
        "sub": SUBJECT,
    }
    signing_input = ".".join(
        b64encode(json.dumps(part, separators=(",", ":")).encode())
        for part in ({"typ": "JWT", "alg": "ES256"}, claims)
    )
    # cryptography は DER で返す。JWT は r と s を 32 バイトずつ並べた形を求める
    r, s = decode_dss_signature(key.sign(signing_input.encode(), ec.ECDSA(hashes.SHA256())))
    signature = r.to_bytes(32) + s.to_bytes(32)
    token = f"{signing_input}.{b64encode(signature)}"
    return f"vapid t={token}, k={b64encode(_public_bytes(key))}"


def send(endpoint: str, p256dh: str, auth: str, message: dict, private_key: str) -> int:
    """1通送り、宛先のサーバが返したステータスを返す。

    201 で届いた。404 か 410 は宛先が切れている。
    繋がらないときは例外にする。宛先のせいか、こちらのせいか分からないため。
    """
    body = encrypt(json.dumps(message, ensure_ascii=False).encode(), p256dh, auth)
    req = urllib.request.Request(
        endpoint,
        data=body,
        method="POST",
        headers={
            "Authorization": vapid_header(endpoint, private_key),
            "Content-Encoding": "aes128gcm",
            "Content-Type": "application/octet-stream",
            "TTL": str(TTL_SECONDS),
            "Urgency": "normal",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as f:
            return f.status
    except urllib.error.HTTPError as e:
        return e.code
