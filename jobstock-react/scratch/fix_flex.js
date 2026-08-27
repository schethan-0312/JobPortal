const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src/app');
files.forEach(file => {
  if (file.includes('admin-')) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    const pattern = /className="(?![^"]*flex-wrap)(?![^"]*flex-column)([^"]*d-flex[^"]*gap-[12345][^"]*)"/g;
    
    content = content.replace(pattern, (match, p1) => {
      changed = true;
      return 'className="' + p1 + ' flex-wrap"';
    });

    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed flex-wrap in', file);
    }
  }
});
console.log('Done');
