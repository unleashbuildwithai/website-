const { execSync } = require('child_process');
const fs = require('fs');

const dir = 'c:\\Users\\Owner\\Desktop\\html';
let out = '';

function run(cmd) {
  out += `\n$ ${cmd}\n`;
  try {
    const result = execSync(cmd, { cwd: dir, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] });
    out += result + '\n';
  } catch (e) {
    out += (e.stdout || '') + (e.stderr || '') + '\n';
  }
}

run('git status');
run('git log --oneline -6');
run('git add -A');
run('git commit -m "Fix: Cloudflare Pages serve from root - wrangler.toml and package.json"');
run('git push origin main');
run('git log --oneline -4');

fs.writeFileSync(dir + '\\push-result.txt', out, 'utf8');
console.log(out);
