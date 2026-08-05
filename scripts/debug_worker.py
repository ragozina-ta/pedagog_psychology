import os
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(
    os.environ["SSH_HOST"],
    username=os.environ["SSH_USER"],
    password=os.environ["SSH_PASS"],
    timeout=30,
    allow_agent=False,
    look_for_keys=False,
)
cmds = [
    "docker exec resource-worker-1 ps aux",
    "docker exec resource-worker-1 ls -la /app/vapid_private.pem",
    "docker exec resource-worker-1 python -c \"from app.core.config import settings; print(bool(settings.vapid_private_key), len(settings.vapid_private_key), settings.vapid_public_key[:20] if settings.vapid_public_key else None)\"",
    "docker compose -f /opt/resource/docker-compose.prod.yml --env-file /opt/resource/.env restart worker",
    "sleep 5",
    "docker logs --tail 50 resource-worker-1 2>&1",
]
for cmd in cmds:
    print(">>", cmd[:120])
    _i, out, err = c.exec_command(cmd, timeout=120)
    print(out.read().decode("utf-8", "replace"))
    e = err.read().decode("utf-8", "replace")
    if e.strip():
        print("ERR", e[-1000:])
c.close()
