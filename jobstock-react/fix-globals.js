const fs = require('fs');
let code = fs.readFileSync('src/app/globals.css', 'utf8');

// Replace var(--primaryfont) with 'Saira', sans-serif
code = code.replace(/var\(--primaryfont\)/g, "'Saira', sans-serif");

fs.writeFileSync('src/app/globals.css', code);
console.log('Fixed globals.css');
