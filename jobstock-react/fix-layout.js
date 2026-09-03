const fs = require('fs');
let code = fs.readFileSync('src/app/layout.tsx', 'utf8');

// Remove next/font/google imports and declarations
code = code.replace(/import \{ Saira \} from "next\/font\/google";\n?/g, '');
code = code.replace(/const saira = Saira\(\{[\s\S]*?\}\);\n?/g, '');

// Change html tag back to standard
code = code.replace(/<html lang="en" className=\{saira\.variable\}>/, '<html lang="en">');

// Add the standard link tags for Saira to head
const linkTags = `
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Saira:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />`;

code = code.replace(/<head>/, '<head>' + linkTags);

fs.writeFileSync('src/app/layout.tsx', code);
console.log('Fixed layout.tsx');
