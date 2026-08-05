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
cmd = "docker exec resource-db-1 psql -U resource -d resource -c \"SELECT id, user_id, left(endpoint, 90) AS endpoint FROM push_subscriptions;\""
_i, out, err = c.exec_command(cmd, timeout=30)
print(out.read().decode())
print(err.read().decode())
c.close()
