const fs = require('fs');
let code = fs.readFileSync('src/app/globals.css', 'utf8');

code = code.replace(
  'p, a, span, div, li, ul, ',
  'p, a, li, ul, label, '
);

fs.writeFileSync('src/app/globals.css', code);
console.log('Fixed globals.css');
