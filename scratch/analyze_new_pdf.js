import fs from 'fs';

const raw = fs.readFileSync('./src/data/pricelist.json', 'utf-8');
const oldPricelist = JSON.parse(raw);
console.log('Old pricelist count:', oldPricelist.length);

const oldCategories = {};
oldPricelist.forEach(item => {
  oldCategories[item.category] = (oldCategories[item.category] || 0) + 1;
});
console.log('Old categories:', JSON.stringify(oldCategories, null, 2));
