"""webpush の組み立てが RFC どおりかを確かめる。

uv run python -m unittest discover -s notify
"""

import json
import unittest

import webpush
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature
from webpush import b64decode, b64encode


class EncryptTest(unittest.TestCase):
    def test_rfc8291_appendix_a(self):
        """RFC 8291 付録 A の見本と、1バイトも違わない暗号文になる。"""
        server_key = ec.derive_private_key(
            int.from_bytes(b64decode("yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw")),
            ec.SECP256R1(),
        )
        body = webpush.encrypt(
            b"When I grow up, I want to be a watermelon",
            p256dh="BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4",
            auth="BTBZMqHH6r4Tts7J_aSIgg",
            salt=b64decode("DGv6ra1nlYgDCS1FRnbzlw"),
            server_key=server_key,
        )
        self.assertEqual(
            b64encode(body),
            "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6"
            "e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3o"
            "ZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN",
        )


class VapidTest(unittest.TestCase):
    # テスト専用の鍵。どこにも登録していない
    PRIVATE = b64encode((1234567890).to_bytes(32))

    def _parts(self, header):
        token = header.removeprefix("vapid t=").split(", k=")[0]
        return token.split("."), header.split(", k=")[1]

    def test_claims(self):
        """宛先のオリジン・期限・連絡先が入る。"""
        header = webpush.vapid_header(
            "https://fcm.googleapis.com/fcm/send/abc", self.PRIVATE, now=1_000_000
        )
        (_, payload, _), _ = self._parts(header)
        claims = json.loads(b64decode(payload))
        self.assertEqual(claims["aud"], "https://fcm.googleapis.com")
        self.assertEqual(claims["exp"], 1_000_000 + 12 * 60 * 60)
        self.assertEqual(claims["sub"], webpush.SUBJECT)

    def test_signature_verifies_with_public_key(self):
        """添えた公開鍵で署名を検証できる。"""
        header = webpush.vapid_header("https://web.push.apple.com/x", self.PRIVATE)
        (head, payload, signature), public = self._parts(header)
        raw = b64decode(signature)
        self.assertEqual(len(raw), 64)
        der = encode_dss_signature(int.from_bytes(raw[:32]), int.from_bytes(raw[32:]))
        key = ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(), b64decode(public))
        key.verify(der, f"{head}.{payload}".encode(), ec.ECDSA(hashes.SHA256()))


if __name__ == "__main__":
    unittest.main()
