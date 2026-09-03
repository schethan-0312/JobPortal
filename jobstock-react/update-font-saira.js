const fs = require('fs');
let code = fs.readFileSync('src/app/layout.tsx', 'utf8');

code = code.replace(
  'import { Quicksand } from "next/font/google";',
  'import { Saira } from "next/font/google";'
);

code = code.replace(
  /const quicksand = Quicksand\([\s\S]*?\}\);/,
  `const saira = Saira({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--primaryfont",
  display: "swap",
});`
);

code = code.replace(
  'className={quicksand.variable}',
  'className={saira.variable}'
);

fs.writeFileSync('src/app/layout.tsx', code);
console.log('Successfully updated layout.tsx to Saira');
