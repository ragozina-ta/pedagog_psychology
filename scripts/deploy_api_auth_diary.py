"""Upload auth/diary schema changes and restart api."""
from __future__ import annotations

import os
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
HOST = os.environ["SSH_HOST"]
USER = os.environ["SSH_USER"]
PASSWORD = os.environ["SSH_PASS"]
REMOTE = "/opt/resource"


def connect():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PASSWORD, timeout=30, allow_agent=False, look_for_keys=False)
    return c


def run(c, cmd, timeout=600):
    print(">>", cmd[:200])
    _i, out, err = c.exec_command(cmd, timeout=timeout)
    o = out.read().decode("utf-8", "replace")
    e = err.read().decode("utf-8", "replace")
    code = out.channel.recv_exit_status()
    text = (o + ("\n" + e if e.strip() else "")).strip()
    if text:
        print(text[-3500:])
    print("exit", code)
    return code


def main():
    c = connect()
    sftp = c.open_sftp()
    for name in [
        "app/schemas.py",
        "app/routers/auth.py",
        "app/db/models.py",
    ]:
        sftp.put(str(BACKEND / name), f"{REMOTE}/{name}")
        print("put", name)
    sftp.close()
    run(
        c,
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml --env-file .env up -d --build api",
        timeout=900,
    )
    run(c, "curl -sS https://whatislav.online/health; echo")
    c.close()
    print("DONE")


if __name__ == "__main__":
    main()
