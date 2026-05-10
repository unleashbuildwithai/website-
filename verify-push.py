import subprocess
cwd = r'c:\Users\Owner\Desktop\html'
log = subprocess.run(['git', 'log', '--oneline', '-3'], capture_output=True, text=True, cwd=cwd)
status = subprocess.run(['git', 'status'], capture_output=True, text=True, cwd=cwd)
with open(r'c:\Users\Owner\Desktop\html\verify-result.txt', 'w') as f:
    f.write("=== GIT LOG ===\n")
    f.write(log.stdout or log.stderr)
    f.write("\n=== GIT STATUS ===\n")
    f.write(status.stdout or status.stderr)
print("done")
