const fs = require('fs');
const path = require('path');

function walk(dir) {
  let fileList = [];
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      fileList = fileList.concat(walk(p));
    } else if (p.endsWith('.tsx') || p.endsWith('.ts') || p.endsWith('.js') || p.endsWith('.json')) {
      fileList.push(p);
    }
  }
  return fileList;
}

const files = walk('src');
const results = [];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    // Look for $ used in text, placeholders, labels, mock data, options, salary
    if (/\$|USD|Dollar/i.test(line)) {
      // Exclude pure code constructs like jQuery, process.env, template strings without currency
      const isPureCode = /process\.env|\$\(|jquery|window\.\$|const \$|import \$|\$\{[a-zA-Z0-9_\.]+\}/.test(line) && !line.includes('$`') && !line.includes('$"') && !line.includes("'$") && !line.includes('>$') && !/\$\s*\d/.test(line);
      if (!isPureCode) {
        results.push({ file: f, line: i + 1, text: line.trim() });
      }
    }
  });
});

console.log('Currency occurrences:', results.length);
results.forEach(r => console.log(`[${r.file}:${r.line}] ${r.text}`));
