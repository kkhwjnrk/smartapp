import fs from 'fs';
import { getFlatNewPricelist, rawSections } from './generate_new_pricelist.js';

// Baca data lama
const oldPricelist = JSON.parse(fs.readFileSync('./src/data/pricelist.json', 'utf-8'));
const oldPnMap = new Map();
oldPricelist.forEach(item => {
  oldPnMap.set(String(item.pn).trim(), item);
});

const newItems = getFlatNewPricelist();
const newPnMap = new Map();
newItems.forEach(item => {
  newPnMap.set(String(item.pn).trim(), item);
});

console.log('Total items di data lama:', oldPricelist.length, '(Unique PN:', oldPnMap.size, ')');
console.log('Total items di data baru:', newItems.length, '(Unique PN:', newPnMap.size, ')');

// Cari barang lama yang TIDAK ada di data baru
const missingInNew = [];
oldPricelist.forEach(item => {
  const pn = String(item.pn).trim();
  if (!newPnMap.has(pn)) {
    missingInNew.push(item);
  }
});

console.log('Jumlah barang lama yang TIDAK ADA di pricelist baru:', missingInNew.length);

// Kelompokkan missing barang berdasarkan kategori lama
const groupedMissing = {};
missingInNew.forEach(item => {
  const cat = item.category || 'Tanpa Kategori';
  if (!groupedMissing[cat]) groupedMissing[cat] = [];
  groupedMissing[cat].push(item);
});

console.log('\n--- DAFTAR BARANG YANG TIDAK TERCANTUM DI PRICELIST BARU ---');
for (const [cat, items] of Object.entries(groupedMissing)) {
  console.log(`\n### Kategori: ${cat} (${items.length} item)`);
  items.forEach(it => {
    console.log(`- [${it.pn}] ${it.description} (Harga lama: Rp ${it.price})`);
  });
}

// Simpan juga ke file JSON scratch agar bisa dianalisis jika perlu
fs.writeFileSync('./scratch/missing_items.json', JSON.stringify(missingInNew, null, 2), 'utf-8');

