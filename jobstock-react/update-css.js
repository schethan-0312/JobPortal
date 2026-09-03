const fs = require('fs');
let code = fs.readFileSync('src/app/globals.css', 'utf8');

const globalFontCss = `
/* Ensure Navbar, Footer, and general text explicitly use the primary font */
.header, .navigation, .nav-menu, .nav-menu > li > a, .nav-brand, 
footer, .footer, .custom-theme-footer,
.dashboard-wrap, .dashboard-content, .dashboard-sidebar {
  font-family: var(--primaryfont) !important;
}
`;

code += globalFontCss;
fs.writeFileSync('src/app/globals.css', code);
console.log('Appended clean global font CSS');
