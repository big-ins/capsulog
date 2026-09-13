FROM mcr.microsoft.com/devcontainers/base:bookworm

# uv は公式イメージからバイナリを取る。Python 自体も uv が管理する
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# .venv を使わず、コンテナ内の固定パスに環境を作る
ENV UV_PROJECT_ENVIRONMENT=/home/vscode/.venv \
    PATH=/home/vscode/.venv/bin:$PATH

# Playwright の Chromium が要る共有ライブラリ。
# playwright install-deps は X11 や Xvfb まで入れるが、ヘッドレスでは使わない
RUN apt-get update && apt-get install -y --no-install-recommends \
      libasound2 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libcairo2 \
      libcups2 \
      libdbus-1-3 \
      libdrm2 \
      libgbm1 \
      libglib2.0-0 \
      libnspr4 \
      libnss3 \
      libpango-1.0-0 \
      libxcomposite1 \
      libxdamage1 \
      libxfixes3 \
      libxkbcommon0 \
      libxrandr2 \
    && rm -rf /var/lib/apt/lists/*

# volume をマウントする先を先に作る。イメージ側の所有者が volume に引き継がれるため、
# ここで用意しないと root 所有になって書き込めない
RUN mkdir -p /home/vscode/.venv \
             /home/vscode/.claude \
             /home/vscode/.config/.wrangler \
             /home/vscode/.cache/ms-playwright \
    && chown -R vscode:vscode /home/vscode/.venv /home/vscode/.claude \
                              /home/vscode/.config /home/vscode/.cache
