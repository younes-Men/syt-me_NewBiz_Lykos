
const fs = require('fs');

const configFile = fs.readFileSync('c:/Users/dell/Desktop/scraping demo 2/backend/night_scraper_config.json', 'utf8');
const config = JSON.parse(configFile);

const constantsFile = fs.readFileSync('c:/Users/dell/Desktop/scraping demo 2/backend/utils/constants.js', 'utf8');
// Extract the array using regex
const match = constantsFile.match(/OPCOMMERCE_NAF_CODES = \s*\[([\s\S]*?)\]/);
const opcommerceCodesRaw = match[1];
const opcommerceCodes = opcommerceCodesRaw.match(/"\d{2}\.\d{2}[A-Z]"/g).map(s => s.replace(/"/g, ''));

const sectorsInConfig = config.secteurs;

const intersection = sectorsInConfig.filter(code => opcommerceCodes.includes(code));

console.log('Total codes in config:', sectorsInConfig.length);
console.log('Codes in config that are OPCOMMERCE:', intersection.length);
console.log('List of matching codes:', JSON.stringify(intersection, null, 2));
