const fs = require('fs');
let content = fs.readFileSync('.env', 'utf8');
content = content.replace(/FRONTEND_URL=http:\/\/localhost:3000/g, 'FRONTEND_URL=https://www.jobstock.com');
fs.writeFileSync('.env', content);
