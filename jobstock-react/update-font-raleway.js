const fs = require('fs');

// 1. Update layout.tsx
let layoutCode = fs.readFileSync('src/app/layout.tsx', 'utf8');
layoutCode = layoutCode.replace(
  'family=Saira:ital,wght@0,100..900;1,100..900&display=swap',
  'family=Raleway:ital,wght@0,100..900;1,100..900&display=swap'
);
fs.writeFileSync('src/app/layout.tsx', layoutCode);

// 2. Update globals.css
let cssCode = fs.readFileSync('src/app/globals.css', 'utf8');
cssCode = cssCode.replace(/'Saira', sans-serif !important/g, "'Raleway', sans-serif !important");
fs.writeFileSync('src/app/globals.css', cssCode);

console.log('Successfully updated to Raleway');
