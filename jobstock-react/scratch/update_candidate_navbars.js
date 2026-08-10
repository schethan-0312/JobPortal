const fs = require('fs');
const path = require('path');

const dirs = fs.readdirSync('src/app').filter(f => f.startsWith('candidate-'));
dirs.forEach(f => {
  const p = path.join('src/app', f, 'page.tsx');
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    if (content.includes('Navbar5')) {
      content = content.replace(/Navbar5/g, 'Navbar7');
      fs.writeFileSync(p, content, 'utf8');
      console.log(`Updated ${f} to use Navbar7`);
    }
  }
});
