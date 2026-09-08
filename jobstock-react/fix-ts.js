const fs = require('fs');
let code = fs.readFileSync('src/components/home/CallToAction.tsx', 'utf8');
code = code.replace("onError={(e) => { (e.target).src = '/assets/img/team-1.jpg'; }}", "onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/team-1.jpg'; }}");
fs.writeFileSync('src/components/home/CallToAction.tsx', code);
console.log('Fixed TS error');
