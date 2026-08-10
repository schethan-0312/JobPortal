const fs = require('fs');
const data = require('./currency_matches.json');

const fileMap = {};
data.forEach(d => {
  if (!fileMap[d.file]) fileMap[d.file] = [];
  fileMap[d.file].push(d);
});

console.log(`Found matches in ${Object.keys(fileMap).length} files:\n`);
for (const [file, items] of Object.entries(fileMap)) {
  console.log(`--- ${file} (${items.length} matches) ---`);
  items.slice(0, 5).forEach(i => console.log(`  L${i.line}: ${i.text}`));
}
