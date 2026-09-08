const fs = require('fs');
let code = fs.readFileSync('src/app/globals.css', 'utf8');

const finalOverride = `
/* =========================================================
   AGGRESSIVE FONT OVERRIDE FOR THE ENTIRE TEMPLATE
   ========================================================= */
body, 
h1, h2, h3, h4, h5, h6, 
p, a, li, ul, label, 
button, input, textarea, select,
.header, .navigation, .nav-menu, .nav-menu > li > a, .nav-brand, 
footer, .footer, .custom-theme-footer,
.explore-content h1, .explore-content h2, .explore-content p,
.banner-content h1, .banner-content p {
  font-family: var(--primaryfont) !important;
}

/* Explicitly protect icon libraries */
i[class*="fa-"], span[class*="fa-"], 
i[class*="mdi-"], span[class*="mdi-"],
.fas, .fab, .far, .fal, .fa, .mdi {
  font-family: "Font Awesome 6 Free", "Font Awesome 5 Free", "Material Design Icons", sans-serif !important;
}
`;

code = code.trim() + '\n' + finalOverride + '\n';
fs.writeFileSync('src/app/globals.css', code);
console.log('Appended flawless CSS override');
