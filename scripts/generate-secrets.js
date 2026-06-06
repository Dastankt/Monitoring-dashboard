const fs = require('fs');
const path = require('path');

const key = process.env.NEWS_API_KEY || '';
const file = path.join(__dirname, '..', 'secrets.js');
const content = `export const SECRETS = {\n  newsApiKey: '${key}',\n};\n`;

fs.writeFileSync(file, content, 'utf8');
console.log('secrets.js created');
