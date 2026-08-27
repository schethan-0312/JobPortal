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
  if (file.includes('candidate-')) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    // find className="col-xl-3 col-lg-6 col-md-6 col-sm-6"
    const pattern = /className="col-xl-\d+ col-lg-\d+ col-md-\d+ col-sm-\d+"/g;
    
    content = content.replace(pattern, (match) => {
      changed = true;
      return match.replace('className="', 'className="col-12 ');
    });

    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed col-12 in', file);
    }
  }
});
console.log('Done');
