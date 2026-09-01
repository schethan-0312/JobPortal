const fs = require('fs');
let content = fs.readFileSync('src/email/email.service.ts', 'utf8');
content = content.replace(/https:\/\/www\.jobstock\.com/g, 'http://localhost:3000');
fs.writeFileSync('src/email/email.service.ts', content);
