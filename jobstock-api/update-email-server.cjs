const fs = require('fs');
let content = fs.readFileSync('src/email/email.service.ts', 'utf8');
content = content.replace(/http:\/\/localhost:3000/g, 'https://www.jobstock.com');
fs.writeFileSync('src/email/email.service.ts', content);
