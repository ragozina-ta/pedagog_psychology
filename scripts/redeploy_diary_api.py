"""Redeploy API with diary multi-entry migration (preserves server .env)."""
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

FILES = [
    "app/db/models.py",
    "app/db/session.py",
    "app/routers/diary.py",
    "app/routers/friends.py",
]


def connect():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PASSWORD, timeout=30, allow_agent=False, look_for_keys=False)
    return c


def run(c, cmd, timeout=900):
    print(">>", cmd[:220])
    _i, out, err = c.exec_command(cmd, timeout=timeout)
    o = out.read().decode("utf-8", "replace")
    e = err.read().decode("utf-8", "replace")
    code = out.channel.recv_exit_status()
    text = (o + ("\n" + e if e.strip() else "")).strip()
    if text:
        print(text[-4500:])
    print("exit", code)
    return code


def main():
    c = connect()
    sftp = c.open_sftp()
    for name in FILES:
        sftp.put(str(BACKEND / name), f"{REMOTE}/{name}")
        print("put", name)
    sftp.close()

    run(
        c,
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml --env-file .env up -d --build --force-recreate api",
        timeout=900,
    )
    run(c, "sleep 10; curl -sS https://whatislav.online/health; echo")
    run(
        c,
        "docker exec resource-db-1 psql -U resource -d resource -c "
        "\"SELECT conname FROM pg_constraint WHERE conrelid = 'diary_entries'::regclass;\"",
    )
    run(c, "docker logs --tail 50 resource-api-1 2>&1")
    c.close()
    print("DONE")


if __name__ == "__main__":
    main()
