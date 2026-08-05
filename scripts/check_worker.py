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
for cmd in [
    "docker ps -a --filter name=worker --format '{{.Names}} {{.Status}}'",
    "docker logs --tail 80 resource-worker-1 2>&1",
    "curl -sS https://whatislav.online/api/push/vapid-public-key | head -c 200; echo",
]:
    print(">>", cmd)
    _i, out, err = c.exec_command(cmd, timeout=60)
    print(out.read().decode("utf-8", "replace"))
    e = err.read().decode("utf-8", "replace")
    if e.strip():
        print(e)
c.close()
