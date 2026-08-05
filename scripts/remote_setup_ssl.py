"""Deploy Caddy SSL stack for whatislav.online."""

from __future__ import annotations

import os
import sys
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
    print(">>", cmd[:180])
    _i, out, err = c.exec_command(cmd, timeout=timeout)
    o = out.read().decode("utf-8", "replace")
    e = err.read().decode("utf-8", "replace")
    code = out.channel.recv_exit_status()
    text = (o + ("\n" + e if e.strip() else "")).strip()
    if text:
        print(text[-2500:])
    print("exit", code)
    return code


def put(sftp, local: Path, remote: str):
    print("put", local.name, "->", remote)
    sftp.put(str(local), remote)


def main():
    c = connect()
    sftp = c.open_sftp()
    put(sftp, BACKEND / "docker-compose.prod.yml", f"{REMOTE}/docker-compose.prod.yml")
    put(sftp, BACKEND / "Caddyfile", f"{REMOTE}/Caddyfile")

    # Update CORS in existing .env
    with sftp.file(f"{REMOTE}/.env", "r") as f:
        env = f.read().decode("utf-8", "replace")
    lines = []
    cors_set = False
    frontend_set = False
    cors_val = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "https://whatislav.online,http://whatislav.online,"
        "https://www.whatislav.online,http://www.whatislav.online,"
        "https://ragozina-ta.github.io,"
        f"http://{HOST},http://{HOST}:8000"
    )
    for line in env.splitlines():
        if line.startswith("CORS_ORIGINS="):
            lines.append(f"CORS_ORIGINS={cors_val}")
            cors_set = True
        elif line.startswith("FRONTEND_BASE_URL="):
            lines.append("FRONTEND_BASE_URL=https://whatislav.online")
            frontend_set = True
        else:
            lines.append(line)
    if not cors_set:
        lines.append(f"CORS_ORIGINS={cors_val}")
    if not frontend_set:
        lines.append("FRONTEND_BASE_URL=https://whatislav.online")
    with sftp.file(f"{REMOTE}/.env", "w") as f:
        f.write("\n".join(lines) + "\n")
    sftp.close()

    # Stop old published ports, recreate with Caddy
    run(c, f"cd {REMOTE} && docker compose -f docker-compose.prod.yml --env-file .env down")
    run(
        c,
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml --env-file .env up -d --build",
        timeout=900,
    )
    run(c, "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")
    run(c, "sleep 2; curl -sS http://127.0.0.1/health || true")
    run(c, "docker logs --tail 40 $(docker ps -qf name=caddy) 2>&1 || true")
    c.close()
    print("DONE")


if __name__ == "__main__":
    main()
