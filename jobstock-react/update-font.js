const fs = require('fs');
let code = fs.readFileSync('src/app/layout.tsx', 'utf8');

code = code.replace(
  'import { Plus_Jakarta_Sans } from "next/font/google";',
  'import { Quicksand } from "next/font/google";'
);

code = code.replace(
  /const plusJakartaSans = Plus_Jakarta_Sans\([\s\S]*?\}\);/,
  `const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--primaryfont",
  display: "swap",
});`
);

code = code.replace(
  'className={plusJakartaSans.variable}',
  'className={quicksand.variable}'
);

fs.writeFileSync('src/app/layout.tsx', code);
console.log('Successfully updated layout.tsx to Quicksand');
