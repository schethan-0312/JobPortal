const fs = require('fs');
const path = require('path');

const dirs = fs.readdirSync('src/app').filter(f => f.startsWith('candidate-'));
dirs.forEach(f => {
  const p = path.join('src/app', f, 'page.tsx');
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf8');
    const navLines = content.split('\n').filter(l => l.includes('Navbar'));
    console.log(`${f}: ${navLines.join(' | ')}`);
  }
});
