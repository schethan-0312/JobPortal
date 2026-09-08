const fs = require('fs');
let code = fs.readFileSync('src/app/globals.css', 'utf8');

// Remove the previous overrides I added to keep it clean
code = code.replace(/\/\* Global Font Override \*\/[\s\S]*?(?=\n\n|$)/g, '');
code = code.replace(/\/\* Ensure Navbar, Footer, and general text explicitly use the primary font \*\/[\s\S]*?(?=\n\n|$)/g, '');

const aggressiveOverride = `
/* =========================================================
   AGGRESSIVE FONT OVERRIDE FOR THE ENTIRE TEMPLATE
   ========================================================= */
body, 
h1, h2, h3, h4, h5, h6, 
p, a, span, div, li, ul, 
button, input, textarea, select,
.header, .navigation, .nav-menu, .nav-menu > li > a, .nav-brand, 
footer, .footer, .custom-theme-footer,
.explore-content h1, .explore-content h2, .explore-content p,
.banner-content h1, .banner-content p {
  font-family: var(--primaryfont) !important;
}

/* Explicitly protect icon libraries from the aggressive font override */
i, [class^="fa-"], [class*=" fa-"], [class^="mdi-"], [class*=" mdi-"], .fas, .fab, .far, .fal, .fa {
  font-family: inherit; /* Allow icons to use their own fonts */
}
`;

code = code.trim() + '\n' + aggressiveOverride + '\n';
fs.writeFileSync('src/app/globals.css', code);
console.log('Successfully added aggressive CSS font override');
