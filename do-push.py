import subprocess
import os

os.chdir(r"c:\Users\Owner\Desktop\html")

def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    out = (r.stdout + r.stderr).strip()
    print(f"$ {cmd}\n{out}\n")
    return out

with open("push-result.txt", "w") as f:
    import sys
    sys.stdout = f
    run("git status")
    run("git log --oneline -6")
    run("git add -A")
    run('git commit -m "Fix: Cloudflare Pages - serve from root, correct wrangler config"')
    run("git push origin main")
    run("git log --oneline -4")
    sys.stdout = sys.__stdout__

print("Done! See push-result.txt")
