"""Upload fixed worker/config and restart worker (+api for config)."""

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


def run(c, cmd, timeout=300):
    print(">>", cmd[:220])
    _i, out, err = c.exec_command(cmd, timeout=timeout)
    o = out.read().decode("utf-8", "replace")
    e = err.read().decode("utf-8", "replace")
    code = out.channel.recv_exit_status()
    text = (o + ("\n" + e if e.strip() else "")).strip()
    if text:
        print(text[-4000:])
    print("exit", code)
    return code


def main():
    c = connect()
    sftp = c.open_sftp()
    for name in ["worker.py", "app/core/config.py"]:
        local = BACKEND / name
        remote = f"{REMOTE}/{name}"
        sftp.put(str(local), remote)
        print("put", name)
    sftp.close()

    run(
        c,
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml --env-file .env up -d --build --force-recreate api worker",
        timeout=900,
    )
    run(c, "sleep 35; docker logs --tail 50 resource-worker-1 2>&1")
    c.close()
    print("DONE")


if __name__ == "__main__":
    main()
