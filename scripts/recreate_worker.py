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
sftp = c.open_sftp()
sftp.put(
    r"D:\Study\pedagog_psychology\backend\docker-compose.prod.yml",
    "/opt/resource/docker-compose.prod.yml",
)
sftp.put(r"D:\Study\pedagog_psychology\backend\worker.py", "/opt/resource/worker.py")
sftp.close()

cmds = [
    "cd /opt/resource && docker compose -f docker-compose.prod.yml --env-file .env up -d --build --force-recreate worker",
    "sleep 10",
    "docker logs --tail 100 resource-worker-1 2>&1",
]
for cmd in cmds:
    print(">>", cmd[:160])
    _i, out, err = c.exec_command(cmd, timeout=300)
    print(out.read().decode("utf-8", "replace")[-3000:])
    e = err.read().decode("utf-8", "replace")
    if e.strip():
        print("ERR", e[-1500:])
c.close()
