const fs = require('fs');
const path = require('path');

function walk(dir) {
  let fileList = [];
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      fileList = fileList.concat(walk(p));
    } else if (p.endsWith('.tsx') || p.endsWith('.ts') || p.endsWith('.json')) {
      fileList.push(p);
    }
  }
  return fileList;
}

const allFiles = walk('src');
console.log('Total files to check:', allFiles.length);

const targets = [];

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Check for literal dollar sign used as currency
  // Match patterns like:
  // "$100", "$", "$50k", "$job.", "$item.", "salary: '$", "$/hr", "$/month", "$/yr", "$PA", etc.
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // If line contains $ and it's not JS template variable ${var} OR if it is `$${` (e.g. `$${job.salaryMin}`)
    if (line.includes('$')) {
      // check if it's currency representation
      const isTemplateOnly = /^(?!.*(\$|USD|dollar)).*\$\{.*\}$/.test(line.trim());
      // Let's print candidate lines
      if (
        line.includes('$') &&
        !line.includes('process.env') &&
        !line.includes('jquery') &&
        !line.includes('API_URL') &&
        !line.includes('Authorization') &&
        !line.includes('Bearer')
      ) {
        // Test if it has literal $ or `$${` or `$` in JSX string or string literal
        if (/`.*\$(\$\{)?.*`|".*\$.*"|'.*\$.*'|>.*\$|^\s*\$.*/.test(line)) {
          targets.push({ file, lineNum: idx + 1, text: line.trim() });
        }
      }
    }
  });
});

console.log('Candidates for $ replacement:', targets.length);
targets.forEach(t => console.log(`[${t.file}:${t.lineNum}] ${t.text}`));
