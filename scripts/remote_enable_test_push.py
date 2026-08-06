"""Generate VAPID keys, update server env, deploy worker with 30s test pushes."""

from __future__ import annotations

import os
from pathlib import Path

import paramiko
from py_vapid import Vapid
from py_vapid.utils import b64urlencode

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


def run(c, cmd, timeout=900):
    print(">>", cmd[:200])
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
    vapid = Vapid()
    vapid.generate_keys()
    priv_pem = vapid.private_pem()
    if isinstance(priv_pem, bytes):
        priv_pem = priv_pem.decode()
    nums = vapid.public_key.public_numbers()
    pub_b64 = b64urlencode(b"\x04" + nums.x.to_bytes(32, "big") + nums.y.to_bytes(32, "big"))
    print("VAPID public:", pub_b64[:40], "...")

    c = connect()
    sftp = c.open_sftp()

    with sftp.file(f"{REMOTE}/vapid_private.pem", "w") as f:
        f.write(priv_pem)
    with sftp.file(f"{REMOTE}/vapid_public.txt", "w") as f:
        f.write(pub_b64)

    for name in [
        "worker.py",
        "docker-compose.prod.yml",
        "Dockerfile",
        "requirements.txt",
        "app/core/config.py",
    ]:
        local = BACKEND / name
        remote = f"{REMOTE}/{name}"
        # ensure parent
        parent = "/".join(remote.split("/")[:-1])
        try:
            sftp.stat(parent)
        except OSError:
            pass
        sftp.put(str(local), remote)
        print("put", name)

    with sftp.file(f"{REMOTE}/.env", "r") as f:
        env = f.read().decode("utf-8", "replace")

    mapping = {
        "VAPID_PUBLIC_KEY": pub_b64,
        "VAPID_PRIVATE_KEY": "/app/vapid_private.pem",
        "VAPID_MAILTO": "mailto:admin@whatislav.online",
        "PUSH_TEST_MODE": "1",
        "PUSH_TEST_INTERVAL_SEC": "30",
    }
    lines = []
    seen = set()
    for line in env.splitlines():
        key = line.split("=", 1)[0] if "=" in line else ""
        if key in mapping:
            lines.append(f"{key}={mapping[key]}")
            seen.add(key)
        elif key.startswith("VAPID_PRIVATE_KEY"):
            # skip broken multiline leftovers
            continue
        else:
            lines.append(line)
    for k, v in mapping.items():
        if k not in seen:
            lines.append(f"{k}={v}")

    with sftp.file(f"{REMOTE}/.env", "w") as f:
        f.write("\n".join(lines) + "\n")
    sftp.close()

    # mount pem into api+worker via compose patch already using file path;
    # copy pem into image build context and adjust compose volumes
    run(
        c,
        f"""
cd {REMOTE}
# ensure compose mounts vapid file
grep -q vapid_private.pem docker-compose.prod.yml || true
docker compose -f docker-compose.prod.yml --env-file .env up -d --build api worker
""",
        timeout=900,
    )
    run(c, "docker ps --format 'table {{.Names}}\t{{.Status}}'")
    run(c, "sleep 3; docker logs --tail 40 $(docker ps -qf name=worker) 2>&1 || true")
    c.close()
    print("DONE")


if __name__ == "__main__":
    main()
