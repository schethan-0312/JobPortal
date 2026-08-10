const fs = require('fs');
const path = require('path');

const matches = [];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      const content = fs.readFileSync(p, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Look for literal $ sign (e.g. $10k, $500, $, etc) but not ES template literal syntax `${` or `$` alone if part of JS identifier/selector
        // Actually let's catch all lines containing '$' and filter for currency representation
        if (line.includes('$')) {
          matches.push({ file: p, line: idx + 1, text: line.trim() });
        }
      });
    }
  }
}

walk('src');
console.log('Found total lines with $:', matches.length);

// Let's filter for currency uses (e.g., "$", "$10", "$50k", "$120/hr", "₹", etc.)
const currencyMatches = matches.filter(m => {
  const t = m.text;
  // Ignore purely template literals like `${foo}` unless there is a literal $ before or in text like `$${foo}` or `($` or `$` in JSX text
  // Let's check regex for currency pattern
  return /\$\s*\d|\$\{\s*|\$\s*\/|\$\s*k|\$\s*-\s*\$|\$\s*M|\$\s*B|salary|price|cost|pay|rate|\/hr|\/yr|\/mo/i.test(t);
});

console.log('Filtered currency matches:', currencyMatches.length);
fs.writeFileSync('scratch/currency_matches.json', JSON.stringify(currencyMatches, null, 2));
