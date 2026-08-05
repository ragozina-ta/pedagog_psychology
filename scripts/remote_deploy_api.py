"""Upload backend and start production compose on remote host."""

from __future__ import annotations

import os
import secrets
import sys
from pathlib import Path

import paramiko
from scp import SCPClient

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"

HOST = os.environ["SSH_HOST"]
USER = os.environ["SSH_USER"]
PASSWORD = os.environ["SSH_PASS"]
REMOTE_DIR = "/opt/resource"


def connect():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(
        HOST,
        username=USER,
        password=PASSWORD,
        timeout=30,
        allow_agent=False,
        look_for_keys=False,
    )
    return c


def run(c, cmd, timeout=900):
    print(">>", cmd[:200])
    _stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    code = stdout.channel.recv_exit_status()
    text = (out + ("\n" + err if err.strip() else "")).strip()
    if text:
        print(text[-3000:])
    print("exit", code)
    return code, out, err


def main():
    # Ensure scp package
    try:
        from scp import SCPClient  # noqa: F401
    except ImportError:
        print("scp missing")
        sys.exit(1)

    pg_pass = secrets.token_urlsafe(18)
    secret = secrets.token_urlsafe(48)
    cors = ",".join(
        [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://ragozina-ta.github.io",
            f"http://{HOST}",
            f"http://{HOST}:8000",
        ]
    )
    env_body = f"""POSTGRES_PASSWORD={pg_pass}
SECRET_KEY={secret}
CORS_ORIGINS={cors}
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
FRONTEND_BASE_URL=https://ragozina-ta.github.io/pedagog_psychology/
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_MAILTO=mailto:admin@resource.app
"""

    c = connect()
    run(c, f"mkdir -p {REMOTE_DIR}")
    run(c, "apt-get install -y rsync >/dev/null 2>&1 || true")

    # Upload selected backend files via SFTP
    sftp = c.open_sftp()

    def put_dir(local: Path, remote: str):
        try:
            sftp.stat(remote)
        except OSError:
            sftp.mkdir(remote)
        for path in local.rglob("*"):
            rel = path.relative_to(local).as_posix()
            if any(part in {".venv", "__pycache__", ".git", "pgdata"} for part in path.parts):
                continue
            if path.suffix in {".db", ".pyc"}:
                continue
            if path.name == "resource.db":
                continue
            rpath = f"{remote}/{rel}"
            if path.is_dir():
                try:
                    sftp.stat(rpath)
                except OSError:
                    # create nested dirs
                    parts = rel.split("/")
                    cur = remote
                    for p in parts:
                        cur = f"{cur}/{p}"
                        try:
                            sftp.stat(cur)
                        except OSError:
                            sftp.mkdir(cur)
            else:
                # ensure parent dirs
                parent = "/".join(rpath.split("/")[:-1])
                parts = parent[len(remote) :].strip("/").split("/") if parent != remote else []
                cur = remote
                for p in parts:
                    if not p:
                        continue
                    cur = f"{cur}/{p}"
                    try:
                        sftp.stat(cur)
                    except OSError:
                        sftp.mkdir(cur)
                print("put", rel)
                sftp.put(str(path), rpath)

    put_dir(BACKEND, REMOTE_DIR)

    with sftp.file(f"{REMOTE_DIR}/.env", "w") as f:
        f.write(env_body)
    sftp.chmod(f"{REMOTE_DIR}/.env", 0o600)
    sftp.close()

    code, _, _ = run(
        c,
        f"cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yml --env-file .env up -d --build",
        timeout=900,
    )
    run(c, "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")
    run(c, "sleep 3; curl -sS http://127.0.0.1:8000/health || curl -sS http://127.0.0.1/health || true")
    c.close()

    print("\n=== DEPLOY SUMMARY ===")
    print(f"API health: http://{HOST}/health")
    print(f"ReDoc:      http://{HOST}/redoc")
    print(f"Swagger:    http://{HOST}/docs")
    print(f"OpenAPI:    http://{HOST}/openapi.json")
    print("Set OPENAI_API_KEY on server later: edit /opt/resource/.env and recreate api container")
    print(f"Frontend VITE_API_URL should be: http://{HOST}")
    sys.exit(code)


if __name__ == "__main__":
    main()
