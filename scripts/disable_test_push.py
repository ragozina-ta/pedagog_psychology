"""Set PUSH_TEST_MODE=0 (production cron) and restart worker."""
from __future__ import annotations

import os
from pathlib import Path

import paramiko

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
        print(text[-3000:])
    print("exit", code)
    return code


def main():
    c = connect()
    sftp = c.open_sftp()
    with sftp.file(f"{REMOTE}/.env", "r") as f:
        env = f.read().decode("utf-8", "replace")

    mapping = {
        "PUSH_TEST_MODE": "0",
        "PUSH_TEST_INTERVAL_SEC": "30",
    }
    lines = []
    seen = set()
    for line in env.splitlines():
        key = line.split("=", 1)[0] if "=" in line else ""
        if key in mapping:
            lines.append(f"{key}={mapping[key]}")
            seen.add(key)
        else:
            lines.append(line)
    for k, v in mapping.items():
        if k not in seen:
            lines.append(f"{k}={v}")

    with sftp.file(f"{REMOTE}/.env", "w") as f:
        f.write("\n".join(lines) + "\n")
    sftp.close()

    # Also update local compose default for future deploys
    run(
        c,
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml --env-file .env up -d --force-recreate worker",
        timeout=300,
    )
    run(c, "sleep 3; docker logs --tail 20 resource-worker-1 2>&1")
    run(c, "grep PUSH_TEST /opt/resource/.env")
    c.close()
    print("DONE")


if __name__ == "__main__":
    main()
