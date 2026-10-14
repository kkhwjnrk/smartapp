import fs from 'fs';

// Helper parse string harga Indonesia "18.204" atau "1.449.993" menjadi number integer
function parsePrice(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  // Hapus titik ribuan
  const clean = String(str).replace(/\./g, '').trim();
  return parseInt(clean, 10) || 0;
}

// Data mentah per section dari 15 halaman PDF yang dikirimkan user
export const rawSections = [
  // Page 1
  {
    category: "Busi",
    subCategory: "Tapered Spark Plug",
    items: [
      { pn: "3389", desc: "Karisma, Blade, Blade125 - DYT_CPR6EA-9", het: "18.204", d24: "13.835", d27: "13.289", d29: "12.925" },
      { pn: "3561", desc: "Vario 125 Techno, SupraX125 - DYT_CPR7EA-9", het: "18.204", d24: "13.835", d27: "13.289", d29: "12.925" },
      { pn: "3390", desc: "Vario150/125, Beat fi, Nmax - DYT_CPR9EA-9", het: "18.204", d24: "13.835", d27: "13.289", d29: "12.925" },
      { pn: "3391", desc: "Mio, Mio J - DYT_CR6HSA", het: "18.204", d24: "13.835", d27: "13.289", d29: "12.925" },
      { pn: "3392", desc: "MX135, MX-150, Vixion - DYT_CR8E", het: "18.204", d24: "13.835", d27: "13.289", d29: "12.925" },
      { pn: "3533", desc: "Tiger, Scorpio - DYT_D8EA", het: "18.204", d24: "13.835", d27: "13.289", d29: "12.925" },
      { pn: "3562", desc: "Ninja 150R/150RR, Satria 120 - DYT_BP8ES", het: "18.204", d24: "13.835", d27: "13.289", d29: "12.925" },
      { pn: "3563", desc: "RX-King, F1, F1ZR - DYT_BP8HS", het: "18.204", d24: "13.835", d27: "13.289", d29: "12.925" },
      { pn: "4982", desc: "Grass Cutting 2 Stroke Machine - DYT_BPM6A", het: "18.204", d24: "13.835", d27: "13.289", d29: "12.925" },
      { pn: "5047", desc: "C90, S90Z - DYT_D6HS", het: "18.204", d24: "13.835", d27: "13.289", d29: "12.925" },
      { pn: "5319", desc: "Vario 110 Carburetor - DYT_CR7EH-9", het: "18.204", d24: "13.835", d27: "13.289", d29: "12.925" }
    ]
  },
  {
    category: "Busi",
    subCategory: "Double Iridium Spark Plug",
    items: [
      { pn: "3393", desc: "SupraX125, Blade - DYT_CPR7EA-9", het: "104.895", d24: "79.720", d27: "76.573", d29: "74.475" },
      { pn: "3394", desc: "Vario125, Vario150 - DYT_CPR9EA-9", het: "104.895", d24: "79.720", d27: "76.573", d29: "74.475" },
      { pn: "3395", desc: "MX135, MX-150, Vixion - DYT_CR9E", het: "104.895", d24: "79.720", d27: "76.573", d29: "74.475" },
      { pn: "3398", desc: "Jupiter Z, Vega - DYT_CR7HSA", het: "104.895", d24: "79.720", d27: "76.573", d29: "74.475" },
      { pn: "5046", desc: "Vario160, PCX160, Xmax - DYT_LMAR8A-9", het: "119.991", d24: "91.193", d27: "87.593", d29: "85.194" },
      { pn: "5051", desc: "Tiger, Scorpio - DYT_D8EA", het: "104.895", d24: "79.720", d27: "76.573", d29: "74.475" },
      { pn: "3831", desc: "RX-King, F1ZR - DYT_BP8HS", het: "104.895", d24: "79.720", d27: "76.573", d29: "74.475" },
      { pn: "3830", desc: "Ninja 150, Satria 120 - DYT_BP8ES", het: "104.895", d24: "79.720", d27: "76.573", d29: "74.475" }
    ]
  },
  {
    category: "Busi",
    subCategory: "Evo Spark Plug Cap (Cangklong Busi)",
    items: [
      { pn: "5239", desc: "90 degree Short (Honda)", het: "54.945", d24: "41.758", d27: "40.110", d29: "39.011" },
      { pn: "5742", desc: "90 degree Long (Yamaha)", het: "54.945", d24: "41.758", d27: "40.110", d29: "39.011" },
      { pn: "5299", desc: "180 degree (Straight)", het: "59.940", d24: "45.554", d27: "43.756", d29: "42.557" }
    ]
  },
  {
    category: "Kampas Rem",
    subCategory: "Superstock Brake Pad",
    items: [
      { pn: "4065", desc: "SupraX125(Fr), Ninja150(Fr), Fu(Fr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "4066", desc: "Beat Fi (Fr), Vario125CBS (Fr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "4067", desc: "Verza (Fr), CB150R(Fr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "4068", desc: "Mio Sporty(Fr), Mio J(Fr), Nmax (Rr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "4069", desc: "Mio M3(Fr), X-Ride(Fr), Mio Z(Fr), Nmax(Fr), MX150(Fr), Mio GT 125 New(Fr), NewVixion(Fr), Lexi(Fr), Aerox(Fr), Jupiter Z1(Fr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "4070", desc: "New Vixion(Rr), R15(Rr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "4071", desc: "New Blade / Blade 125(Fr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "4072", desc: "PCX150 (Fr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "4073", desc: "PCX150 (Rr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "4075", desc: "Jupiter Z (Fr), RX-KING (Fr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "4903", desc: "Vario 150 2018, Vario 125, Genio (Fr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "5031", desc: "CB150R(Rr), CRF150(Rr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "5032", desc: "R15 V3(Rr), Vixion R 155(Rr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "5178", desc: "CRF150(Fr), PCX150 ABS(Fr), ADV160 ABS 22-23(Fr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "5231", desc: "KLX150, D-Tracker (Fr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "5232", desc: "KLX150, D-Tracker (Rr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "5297", desc: "Satria Fu Fi (Rr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "5298", desc: "Satria Fu Fi, GSX150 (Fr)", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" }
    ]
  },

  // Page 2
  {
    category: "Kampas Rem",
    subCategory: "Premium Brake Pad (Lapinus Fiber)",
    items: [
      { pn: "3388", desc: "Mio Sporty(Fr), Mio J(Fr), Nmax (Rr)", het: "84.915", d24: "64.535", d27: "61.988", d29: "60.290" },
      { pn: "3459", desc: "Mio M3(Fr), N-Max (Fr)", het: "84.915", d24: "64.535", d27: "61.988", d29: "60.290" },
      { pn: "3852", desc: "R25(Rr), Xmax (Rr)", het: "154.956", d24: "117.767", d27: "113.118", d29: "110.019" },
      { pn: "3854", desc: "R25(Fr), Xmax (Fr)", het: "154.956", d24: "117.767", d27: "113.118", d29: "110.019" },
      { pn: "3386", desc: "SupraX125(Fr), Ninja150(Fr), Fu(Fr)", het: "84.915", d24: "64.535", d27: "61.988", d29: "60.290" },
      { pn: "4119", desc: "PCX150 (Fr)", het: "84.915", d24: "64.535", d27: "61.988", d29: "60.290" },
      { pn: "4120", desc: "PCX150 (Rr)", het: "84.915", d24: "64.535", d27: "61.988", d29: "60.290" },
      { pn: "5033", desc: "Brembo 4P Caliper", het: "154.956", d24: "117.767", d27: "113.118", d29: "110.019" },
      { pn: "5034", desc: "Brembo 2P Caliper", het: "84.915", d24: "64.535", d27: "61.988", d29: "60.290" },
      { pn: "5361", desc: "CRF150 FR, PCX150/160 ABS FR, ADV150/160 FR", het: "84.915", d24: "64.535", d27: "61.988", d29: "60.290" },
      { pn: "5403", desc: "Verza (Fr), CB150R (Fr), CBR150R", het: "84.915", d24: "64.535", d27: "61.988", d29: "60.290" },
      { pn: "6021", desc: "Beat, Beat Fi, Scoopy Fi, Vario 110/125 old (Fr)", het: "84.915", d24: "64.535", d27: "61.988", d29: "60.290" }
    ]
  },
  {
    category: "Kampas Rem",
    subCategory: "Superstock Brake Shoe (Tromol)",
    items: [
      { pn: "5059", desc: "Beat,Beat Fi, Scoopy, Vario 125, Vario 150, PCX150 CBU", het: "53.946", d24: "40.999", d27: "39.381", d29: "38.302" },
      { pn: "5060", desc: "Karisma, Supra X125, Blade FI, Revo FI", het: "43.956", d24: "33.407", d27: "32.088", d29: "31.209" },
      { pn: "5061", desc: "Mio, Soul GT115/125, X-Ride, Fazzio, Fino, M3, Xeon", het: "56.943", d24: "43.277", d27: "41.568", d29: "40.430" },
      { pn: "5062", desc: "Aerox, Old Vixion, FreeGo, Jupiter MX 135, Lexi, RX-King", het: "58.941", d24: "44.795", d27: "43.027", d29: "41.848" }
    ]
  },
  {
    category: "Vanbelt",
    subCategory: "Ultradrive Belt Only",
    items: [
      { pn: "3998", desc: "Mio Sporty, Mio Soul, Fino - DYT_5TL-WE76J-00", het: "101.898", d24: "77.442", d27: "74.386", d29: "72.348" },
      { pn: "3999", desc: "Mio J, Fino Fi, Mio GT, X-Ride - DYT_54P/2BJ/1KP", het: "102.897", d24: "78.202", d27: "75.115", d29: "73.057" },
      { pn: "4000", desc: "Beat, Scoopy, Spacy - DYT_23100-KVY-900", het: "128.982", d24: "98.026", d27: "94.157", d29: "91.577" },
      { pn: "4001", desc: "Beat Fi, Scoopy Fi, Spacy Fi - DYT_23100-KZL-900", het: "134.976", d24: "102.582", d27: "98.532", d29: "95.833" },
      { pn: "4002", desc: "Vario 110 - DYT_23100-KVB-900", het: "144.966", d24: "110.174", d27: "105.825", d29: "102.926" },
      { pn: "4003", desc: "Vario125 CBS Fi - DYT_23100-KZR-900", het: "154.956", d24: "117.767", d27: "113.118", d29: "110.019" },
      { pn: "4004", desc: "Beat ESP / POP & Scoopy ESP - DYT_23100-K44-V01", het: "138.972", d24: "105.619", d27: "101.450", d29: "98.670" },
      { pn: "4006", desc: "N-Max - DYT_2DP-E7641-00", het: "184.926", d24: "140.544", d27: "134.996", d29: "131.297" },
      { pn: "4007", desc: "Mio M3 & All New Soul GT - DYT_2PH-E7641-00", het: "134.976", d24: "102.582", d27: "98.532", d29: "95.833" },
      { pn: "4898", desc: "New Nmax, Aerox, Lexi - DYT_B65-E7641-00", het: "184.926", d24: "140.544", d27: "134.996", d29: "131.297" },
      { pn: "5042", desc: "Vario 150 ESP - DYT_23100-K36-J01", het: "174.936", d24: "132.951", d27: "127.703", d29: "124.205" },
      { pn: "5043", desc: "Beat K1A, Genio, Scoopy - DYT_23100-K0J-N01", het: "131.979", d24: "100.304", d27: "96.345", d29: "93.705" },
      { pn: "5044", desc: "Vespa 150 - DYT_237930", het: "234.987", d24: "178.590", d27: "171.541", d29: "166.841" },
      { pn: "5045", desc: "Vespa LX125, S125 3V, iget - DYT_D16447", het: "234.987", d24: "178.590", d27: "171.541", d29: "166.841" },
      { pn: "5440", desc: "Vario 160 ESP - DYT_23100-K2S-900", het: "153.957", d24: "117.007", d27: "112.389", d29: "109.309" },
      { pn: "5441", desc: "PCX150, ADV150 - DYT_23100-K97-900", het: "154.956", d24: "117.767", d27: "113.118", d29: "110.019" },
      { pn: "5442", desc: "PCX160, ADV160 - DYT_2300-K1Z-900", het: "154.956", d24: "117.767", d27: "113.118", d29: "110.019" },
      { pn: "5443", desc: "Fazzio, Grand Filano - DYT_B3Y-E7641-00", het: "94.905", d24: "72.128", d27: "69.281", d29: "67.383" },
      { pn: "5444", desc: "Suzuki Next FI", het: "104.895", d24: "79.720", d27: "76.573", d29: "74.475" },
      { pn: "5557", desc: "Yamaha Xmax 250, B5X", het: "279.942", d24: "212.756", d27: "204.358", d29: "198.759" }
    ]
  },
  {
    category: "Vanbelt",
    subCategory: "Drive Belt and Weight Roller Set (Vanbelt + Roller)",
    items: [
      { pn: "4452", desc: "Mio Sporty, Mio Soul, Fino - DYT_5TL-E7641-01", het: "179.931", d24: "136.748", d27: "131.350", d29: "127.751" },
      { pn: "4453", desc: "Mio J, Fino Fi, Mio GT, X-Ride - DYT_54P/2BJ/1KP-E7641", het: "159.951", d24: "121.563", d27: "116.764", d29: "113.565" },
      { pn: "4454", desc: "Beat, Scoopy, Spacy - DYT_23100-KVY-901", het: "157.953", d24: "120.044", d27: "115.306", d29: "112.147" },
      { pn: "4455", desc: "Beat Fi, Scoopy Fi, Spacy Fi - DYT_23100-KZL-900", het: "169.941", d24: "129.155", d27: "124.057", d29: "120.658" },
      { pn: "4456", desc: "Vario 110 - DYT_23100-KVB-900", het: "191.919", d24: "145.858", d27: "140.101", d29: "136.262" },
      { pn: "4457", desc: "Vario CBS125 Fi - DYT_23100-KZR-601", het: "210.900", d24: "160.284", d27: "153.957", d29: "149.739" },
      { pn: "4458", desc: "Beat ESP - DYT_23100-K44-V01", het: "186.924", d24: "142.062", d27: "136.455", d29: "132.716" },
      { pn: "4460", desc: "N-Max 2015-2021 - DYT_2DP-E7641-00", het: "229.992", d24: "174.794", d27: "167.894", d29: "163.294" },
      { pn: "4461", desc: "Mio M3 - DYT_2PH-E7641-00", het: "179.931", d24: "136.748", d27: "131.350", d29: "127.751" },
      // Page 3
      { pn: "4908", desc: "Aerox, New Nmax, Lexi - DYT_B65-E7641-00", het: "229.992", d24: "174.794", d27: "167.894", d29: "163.294" },
      { pn: "5040", desc: "Vario 150 Double Cog - DYT_23100-K36-J01", het: "240.204", d24: "182.555", d27: "175.349", d29: "170.545" },
      { pn: "5041", desc: "Beat K1A, Genio, Scoopy New - DYT_23100-K0J-N01", het: "179.931", d24: "136.748", d27: "131.350", d29: "127.751" }
    ]
  },
  {
    category: "Roller",
    subCategory: "Mio / Fino / X-Ride",
    items: [
      { pn: "4558", desc: "Mio, Fino, Mio J, Mio GT, X-Ride - 5gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4559", desc: "Mio, Fino, Mio J, Mio GT, X-Ride - 6gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4549", desc: "Mio, Fino, Mio J, Mio GT, X-Ride - 7gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4540", desc: "Mio, Fino, Mio J, Mio GT, X-Ride - 8gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4550", desc: "Mio, Fino, Mio J, Mio GT, X-Ride - 9gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4541", desc: "Mio, Fino, Mio J, Mio GT, X-Ride - 9.5gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4542", desc: "Mio, Fino, Mio J, Mio GT, X-Ride - 10.5gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" }
    ]
  },
  {
    category: "Roller",
    subCategory: "Beat / Scoopy Karbu",
    items: [
      { pn: "4556", desc: "Beat, Scoopy Carburetor - 5gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4557", desc: "Beat, Scoopy Carburetor - 6gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4548", desc: "Beat, Scoopy Carburetor - 7gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4530", desc: "Beat, Scoopy Carburetor - 8gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4531", desc: "Beat, Scoopy Carburetor - 9gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4532", desc: "Beat, Scoopy Carburetor - 10gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" }
    ]
  },
  {
    category: "Roller",
    subCategory: "Beat FI / Scoopy FI / Vario 110",
    items: [
      { pn: "4560", desc: "Beat Fi, Scoopy Fi / ESP - 5gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4561", desc: "Beat Fi, Scoopy Fi / ESP - 6gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4551", desc: "Beat Fi, Scoopy Fi / ESP - 7gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4552", desc: "Beat Fi, Scoopy Fi / ESP - 8gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4553", desc: "Beat Fi, Scoopy Fi / ESP - 9gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4533", desc: "Beat Fi, Scoopy Fi / ESP - 10gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4534", desc: "Beat Fi, Scoopy Fi / ESP - 11gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "5219", desc: "Beat Fi, Scoopy Fi / ESP - 12gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4535", desc: "Beat Fi, Scoopy Fi / ESP - 13gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "5741", desc: "Beat Fi, Scoopy Fi / ESP - 5.5gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" }
    ]
  },
  {
    category: "Roller",
    subCategory: "Mio M3 / Soul GT / NMAX / Xeon",
    items: [
      { pn: "4543", desc: "Xeon, GT125, Xeon Rc, Mio M3, All New Soul GT, Nmax - 7gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4544", desc: "Xeon, GT125, Xeon Rc, Mio M3, All New Soul GT, Nmax - 8gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4545", desc: "Xeon, GT125, Xeon Rc, Mio M3, All New Soul GT, Nmax - 9gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4546", desc: "Xeon, GT125, Xeon Rc, Mio M3, All New Soul GT, Nmax - 10gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4547", desc: "Xeon, GT125, Xeon Rc, Mio M3, All New Soul GT, Nmax - 11gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4554", desc: "Xeon, GT125, Xeon Rc, Mio M3, All New Soul GT, Nmax - 12gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4555", desc: "Xeon, GT125, Xeon Rc, Mio M3, All New Soul GT, Nmax - 13gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" }
    ]
  },
  {
    category: "Roller",
    subCategory: "Vario 125 / Vario 150 / PCX / Genio",
    items: [
      { pn: "4968", desc: "Genio, New Beat, Vario 125/150, PCX - 8gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4899", desc: "Genio, New Beat, Vario 125/150, PCX - 9gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4900", desc: "Genio, New Beat, Vario 125/150, PCX - 10gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4969", desc: "Genio, New Beat, Vario 125/150, PCX - 11gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4536", desc: "Genio, New Beat, Vario 125/150, PCX - 12gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4537", desc: "Genio, New Beat, Vario 125/150, PCX - 13gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "4538", desc: "Genio, New Beat, Vario 125/150, PCX - 15gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      // Page 4
      { pn: "5214", desc: "Genio, New Beat, Vario 125/150, PCX - 7gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "5215", desc: "Genio, New Beat, Vario 125/150, PCX - 16gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "5216", desc: "Genio, New Beat, Vario 125/150, PCX - 17gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "5217", desc: "Genio, New Beat, Vario 125/150, PCX - 18gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "5218", desc: "Genio, New Beat, Vario 125/150, PCX - 19gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" },
      { pn: "5672", desc: "Genio, New Beat, Vario 125/150, PCX - 14gr", het: "45.399", d24: "34.503", d27: "33.141", d29: "32.233" }
    ]
  },
  {
    category: "Roller",
    subCategory: "Vespa / Piaggio",
    items: [
      { pn: "4970", desc: "Vespa, Piaggio - 8gr", het: "62.937", d24: "47.832", d27: "45.944", d29: "44.685" },
      { pn: "4971", desc: "Vespa, Piaggio - 9gr", het: "62.937", d24: "47.832", d27: "45.944", d29: "44.685" },
      { pn: "4972", desc: "Vespa, Piaggio - 10gr", het: "62.937", d24: "47.832", d27: "45.944", d29: "44.685" },
      { pn: "4973", desc: "Vespa, Piaggio - 11gr", het: "62.937", d24: "47.832", d27: "45.944", d29: "44.685" },
      { pn: "4974", desc: "Vespa, Piaggio - 12gr", het: "62.937", d24: "47.832", d27: "45.944", d29: "44.685" }
    ]
  },
  {
    category: "Roller",
    subCategory: "Yamaha XMAX 250",
    items: [
      { pn: "5174", desc: "XMAX 250 - 15gr", het: "62.937", d24: "47.832", d27: "45.944", d29: "44.685" },
      { pn: "5175", desc: "XMAX 250 - 16gr", het: "62.937", d24: "47.832", d27: "45.944", d29: "44.685" },
      { pn: "5176", desc: "XMAX 250 - 17gr", het: "62.937", d24: "47.832", d27: "45.944", d29: "44.685" },
      { pn: "5313", desc: "XMAX 250 - 10gr", het: "62.937", d24: "47.832", d27: "45.944", d29: "44.685" },
      { pn: "5314", desc: "XMAX 250 - 12gr", het: "62.937", d24: "47.832", d27: "45.944", d29: "44.685" },
      { pn: "5315", desc: "XMAX 250 - 14gr", het: "62.937", d24: "47.832", d27: "45.944", d29: "44.685" }
    ]
  },
  {
    category: "Kampas Ganda Matic",
    subCategory: "Kevlar Clutch Shoe",
    items: [
      { pn: "4630", desc: "Beat/Beat Fi/Mio/Fino/Nex - DYT_22535-KVY/KZL/5TL-E6620/21501-09J00", het: "162.948", d24: "123.840", d27: "118.952", d29: "115.693" },
      { pn: "4631", desc: "Vario110/Vario160/PCX160/Mio M3/New Soul GT12/Freego - DYT_22535-KVB/K1N-V00 2SX/2PH/B5D-E6620", het: "222.000", d24: "168.720", d27: "162.060", d29: "157.620" },
      { pn: "4632", desc: "PCX150/Vario CBS 125/All New Vario125/Vario150 - DYT_22535-KWN/K35-901", het: "222.000", d24: "168.720", d27: "162.060", d29: "157.620" },
      { pn: "4633", desc: "All New Beat ESP - DYT_22535-K44-V00", het: "157.953", d24: "120.044", d27: "115.306", d29: "112.147" },
      { pn: "4634", desc: "N-Max - DYT_2DP-E6620-00", het: "225.996", d24: "171.757", d27: "164.977", d29: "160.457" },
      { pn: "4635", desc: "Aerox 155/Lexi 2018~2020 - DYT_B65-E6620-00/B65-WE662", het: "222.000", d24: "168.720", d27: "162.060", d29: "157.620" },
      { pn: "4636", desc: "Soul GT 115/Mio J/Fino Fi/X-ride - DYT_54P-E6620-10", het: "199.911", d24: "151.932", d27: "145.935", d29: "141.937" },
      { pn: "4637", desc: "New Beat Eco 2016~2020 CBS/ISS, Scoopy 2016-Up - DYT_22535-K16-A40", het: "215.451", d24: "163.743", d27: "157.279", d29: "152.970" },
      { pn: "5058", desc: "X-Max - DYT_B74-E6620-00", het: "472.971", d24: "359.458", d27: "345.269", d29: "335.809" },
      { pn: "5291", desc: "Vespa S150IE, LX125 Carb, LX150IE, Liberty 150IE - DYT_CM1440175", het: "349.983", d24: "265.987", d27: "255.488", d29: "248.488" },
      { pn: "5300", desc: "Xeon RC - DYT_1LB-E6620-00", het: "221.445", d24: "168.298", d27: "161.655", d29: "157.226" }
    ]
  },
  {
    category: "Kampas Ganda Bebek",
    subCategory: "Primary Clutch Shoe",
    items: [
      { pn: "5755", desc: "Honda Blade 110, Revo Absolute - KWB", het: "74.925", d24: "56.943", d27: "54.695", d29: "53.197" },
      { pn: "5756", desc: "Honda Legenda, Revo 100, Supra Fit - KFL", het: "84.915", d24: "64.535", d27: "61.988", d29: "60.290" },
      { pn: "5757", desc: "Honda Karisma, Kirana, Supra X 125 - KPH", het: "84.915", d24: "64.535", d27: "61.988", d29: "60.290" },
      { pn: "5758", desc: "Honda Grand, Prima - GN5", het: "74.925", d24: "56.943", d27: "54.695", d29: "53.197" },
      { pn: "5759", desc: "Yamaha Jupiter MX 135 - 1S7", het: "87.468", d24: "66.476", d27: "63.852", d29: "62.102" },
      { pn: "5760", desc: "Yamaha Jupiter Z - 5TN", het: "74.925", d24: "56.943", d27: "54.695", d29: "53.197" },
      { pn: "5761", desc: "Yamaha Vega ZR, RR - 5D9", het: "84.915", d24: "64.535", d27: "61.988", d29: "60.290" },
      { pn: "5762", desc: "Yamaha Jupiter Z1 - 1DY", het: "84.915", d24: "64.535", d27: "61.988", d29: "60.290" }
    ]
  },
  {
    category: "Kampas Kopling",
    subCategory: "Kevlar Friction Disc",
    items: [
      { pn: "4600", desc: "Revo, Supra Fit, Supra, Kirana, Legenda, Astrea", het: "69.708", d24: "52.978", d27: "50.887", d29: "49.493" },
      // Page 5
      { pn: "4601", desc: "Tiger", het: "112.776", d24: "85.710", d27: "82.326", d29: "80.071" },
      { pn: "4602", desc: "CB150R, CBR150 K45, Verza, GL Series", het: "112.776", d24: "85.710", d27: "82.326", d29: "80.071" },
      { pn: "4603", desc: "All New CB150/CBR150R, Sonic, GTR150", het: "112.776", d24: "85.710", d27: "82.326", d29: "80.071" },
      { pn: "4604", desc: "New Blade 125 Fi / Supra125Fi Helm in", het: "95.571", d24: "72.634", d27: "69.767", d29: "67.855" },
      { pn: "4605", desc: "Revo 110 / New Blade", het: "69.708", d24: "52.978", d27: "50.887", d29: "49.493" },
      { pn: "4606", desc: "Karisma / SupraX125", het: "135.753", d24: "103.172", d27: "99.100", d29: "96.385" },
      { pn: "4607", desc: "SCORPIO", het: "270.840", d24: "205.838", d27: "197.713", d29: "192.296" },
      { pn: "4608", desc: "RX-King", het: "195.360", d24: "148.474", d27: "142.613", d29: "138.706" },
      { pn: "4613", desc: "F1ZR", het: "146.520", d24: "111.355", d27: "106.960", d29: "104.029" },
      { pn: "4614", desc: "Jupiter Z 110 '05~08, Vega R '04~05", het: "135.753", d24: "103.172", d27: "99.100", d29: "96.385" },
      { pn: "4616", desc: "Jupiter Z '10~12, Vega ZR, Jupiter Z1 '12~14", het: "81.585", d24: "62.005", d27: "59.557", d29: "57.925" },
      { pn: "4617", desc: "Jupiter MX135 ‘07~’08", het: "108.447", d24: "82.420", d27: "79.166", d29: "76.997" },
      { pn: "4618", desc: "Jupiter MX135 '11~13, New Vixion ‘13-14 NVL", het: "139.527", d24: "106.041", d27: "101.855", d29: "99.064" },
      { pn: "4619", desc: "Jupiter MX 150, New Vixion Advance NVA", het: "108.447", d24: "82.420", d27: "79.166", d29: "76.997" },
      { pn: "4620", desc: "Satria FU 150", het: "112.776", d24: "85.710", d27: "82.326", d29: "80.071" },
      { pn: "4621", desc: "Ninja 250 R/FI", het: "300.699", d24: "228.531", d27: "219.510", d29: "213.496" },
      { pn: "4622", desc: "Ninja RR Mono", het: "268.398", d24: "203.982", d27: "195.931", d29: "190.563" },
      { pn: "4623", desc: "KLX150", het: "108.447", d24: "82.420", d27: "79.166", d29: "76.997" },
      { pn: "4624", desc: "Kawasaki NINJA 150", het: "246.975", d24: "187.701", d27: "180.292", d29: "175.352" },
      { pn: "4625", desc: "New Mega Pro, Mega Pro Fi, CRF150", het: "108.447", d24: "82.420", d27: "79.166", d29: "76.997" },
      { pn: "4626", desc: "Vixion (old) FZ150 ‘07-11", het: "193.251", d24: "146.871", d27: "141.073", d29: "137.208" },
      { pn: "4627", desc: "All New VXN150R, All New R15 VVA", het: "119.103", d24: "90.518", d27: "86.945", d29: "84.563" },
      { pn: "4865", desc: "FR80", het: "146.298", d24: "111.186", d27: "106.798", d29: "103.872" }
    ]
  },
  {
    category: "Per CVT",
    subCategory: "1.000 RPM (White)",
    items: [
      { pn: "4800", desc: "Beat, Beat Fi, Beat Esp, Beat Pop, Genio, Scoopy - K44 KZL", het: "98.901", d24: "75.165", d27: "72.198", d29: "70.220" },
      { pn: "5224", desc: "Mio 03~12 / Fino - 5TL", het: "98.901", d24: "75.165", d27: "72.198", d29: "70.220" },
      { pn: "4805", desc: "Aerox155, Nmax155 - B65", het: "115.995", d24: "88.156", d27: "84.676", d29: "82.356" },
      { pn: "4807", desc: "N-MAX ‘15~19 - 2DP", het: "115.995", d24: "88.156", d27: "84.676", d29: "82.356" },
      { pn: "5225", desc: "Vario150, PCX CBU - K36", het: "115.995", d24: "88.156", d27: "84.676", d29: "82.356" },
      { pn: "4809", desc: "PCX150, PCX160, Vario125, ADV160 - K35", het: "115.995", d24: "88.156", d27: "84.676", d29: "82.356" },
      { pn: "4811", desc: "Mio J ‘12~14 / MIO GT - 54P", het: "98.901", d24: "75.165", d27: "72.198", d29: "70.220" },
      { pn: "4943", desc: "Mio M3, Mio S, Mio Z - 2SX", het: "98.901", d24: "75.165", d27: "72.198", d29: "70.220" },
      { pn: "4988", desc: "Vespa 150cc 3V, iGet 150 Primavera, GTS ’19 - B013 304", het: "115.995", d24: "88.156", d27: "84.676", d29: "82.356" },
      { pn: "6255", desc: "NMAX Turbo, AEROX Turbo", het: "139.971", d24: "106.378", d27: "102.179", d29: "99.379" },
      { pn: "5264", desc: "Xmax ‘16~23 - B74 - 1.000 RPM", het: "169.941", d24: "129.155", d27: "124.057", d29: "120.658" }
    ]
  },
  {
    category: "Per CVT",
    subCategory: "1.200 RPM (Blue)",
    items: [
      { pn: "6261", desc: "Beat, Beat Fi, Beat Esp, Beat Pop, Genio, Scoopy - K44 KZL", het: "98.901", d24: "75.165", d27: "72.198", d29: "70.220" },
      { pn: "6263", desc: "PCX150, PCX160, Vario125, ADV160 - K35", het: "115.995", d24: "88.156", d27: "84.676", d29: "82.356" },
      { pn: "6265", desc: "Vario150, PCX CBU - K36", het: "115.995", d24: "88.156", d27: "84.676", d29: "82.356" },
      { pn: "6267", desc: "Mio 03~12 / Fino - 5TL", het: "98.901", d24: "75.165", d27: "72.198", d29: "70.220" },
      { pn: "6269", desc: "Aerox155, Nmax155 - B65", het: "115.995", d24: "88.156", d27: "84.676", d29: "82.356" }
    ]
  },
  {
    category: "Per CVT",
    subCategory: "1.500 RPM (Orange)",
    items: [
      { pn: "4801", desc: "Beat, Beat Fi, Beat Esp, Beat Pop, Genio, Scoopy - K44 KZL", het: "98.901", d24: "75.165", d27: "72.198", d29: "70.220" },
      { pn: "4803", desc: "Mio 03~12 / Fino - 5TL", het: "98.901", d24: "75.165", d27: "72.198", d29: "70.220" },
      { pn: "4806", desc: "Aerox155, Nmax155 - B65", het: "115.995", d24: "88.156", d27: "84.676", d29: "82.356" },
      { pn: "4808", desc: "N-MAX ‘15~19 - 2DP", het: "115.995", d24: "88.156", d27: "84.676", d29: "82.356" },
      { pn: "5226", desc: "Vario150, PCX CBU - K36", het: "115.995", d24: "88.156", d27: "84.676", d29: "82.356" },
      { pn: "4810", desc: "PCX150, PCX160, Vario125, ADV160 - K35", het: "115.995", d24: "88.156", d27: "84.676", d29: "82.356" },
      { pn: "4812", desc: "Mio J ‘12~14 / MIO GT - 54P", het: "98.901", d24: "75.165", d27: "72.198", d29: "70.220" },
      { pn: "4944", desc: "Mio M3, Mio S, Mio Z - 2SX", het: "98.901", d24: "75.165", d27: "72.198", d29: "70.220" },
      { pn: "4989", desc: "Vespa 150cc 3V, iGet 150 Primavera, GTS ’19 - B013 304", het: "115.995", d24: "88.156", d27: "84.676", d29: "82.356" },
      // Page 6
      { pn: "6256", desc: "NMAX Turbo, AEROX Turbo", het: "139.971", d24: "106.378", d27: "102.179", d29: "99.379" },
      { pn: "5265", desc: "Xmax ‘16~23 - B74 - 1.500 RPM", het: "169.941", d24: "129.155", d27: "124.057", d29: "120.658" }
    ]
  },
  {
    category: "Per CVT",
    subCategory: "2.000 RPM (Gold)",
    items: [
      { pn: "4802", desc: "Beat, Beat Fi, Beat Esp, Beat Pop, Genio, Scoopy - K44 KZL", het: "98.901", d24: "75.165", d27: "72.198", d29: "70.220" },
      { pn: "4804", desc: "Mio 03~12 / Fino - 5TL", het: "98.901", d24: "75.165", d27: "72.198", d29: "70.220" },
      { pn: "5230", desc: "Aerox155, Nmax155 - B65", het: "115.995", d24: "88.156", d27: "84.676", d29: "82.356" },
      { pn: "5229", desc: "Vario150, PCX CBU - K36", het: "115.995", d24: "88.156", d27: "84.676", d29: "82.356" },
      { pn: "5238", desc: "PCX150, PCX160, Vario125, ADV160 - K35", het: "115.995", d24: "88.156", d27: "84.676", d29: "82.356" }
    ]
  },
  {
    category: "Per Sentrik",
    subCategory: "1.000 RPM (Silver)",
    items: [
      { pn: "4953", desc: "Mio, Fino('12-13), XMax('16-23), Beat Karbu/FI, Scoopy, Genio, Beat ESP - 5TL-E6626-00, 22401-KVY-900, 22401-GCC-900", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "4955", desc: "Aerox('17-21), New N-Max('20up), PCX160 (2021), Vario160, Fazzio - B65-E6626-00, 22401-KGG-910", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "4957", desc: "PCX/Vario150/Vario125ESP/Vario110, N-Max upto 2019, Vario Techno 125, Vespa 125/150 - 22401-KVB-900, 2DP-E6626-00, 22401-KWN-000, 2PH-E6626-00", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "5303", desc: "XMax(’16-23) - B74-E6626-00", het: "99.900", d24: "75.924", d27: "72.927", d29: "70.929" }
    ]
  },
  {
    category: "Per Sentrik",
    subCategory: "1.500 RPM (Orange)",
    items: [
      { pn: "4954", desc: "Mio, Fino('12-13), XMax('16-23), Beat Karbu/FI, Scoopy, Genio, Beat ESP - 5TL-E6626-00, 22401-KVY-900, 22401-GCC-900", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "4956", desc: "Aerox('17-21), New N-Max('20up), PCX160 (2021), Vario160, Fazzio - B65-E6626-00, 22401-KGG-910", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "4958", desc: "PCX/Vario150/Vario125ESP/Vario110, N-Max upto 2019, Vario Techno 125, Vespa 125/150 - 22401-KVB-900, 2DP-E6626-00, 22401-KWN-000, 2PH-E6626-00", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "5305", desc: "XMax(’16-23) - B74-E6626-00", het: "99.900", d24: "75.924", d27: "72.927", d29: "70.929" }
    ]
  },
  {
    category: "Per Sentrik",
    subCategory: "2.000 RPM (Gold)",
    items: [
      { pn: "5711", desc: "Mio, Fino('12-13), XMax('16-23), Beat Karbu/FI, Scoopy, Genio, Beat ESP - 5TL-E6626-00, 22401-KVY-900, 22401-GCC-900", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "5712", desc: "Aerox('17-21), New N-Max('20up), PCX160 (2021), Vario160, Fazzio - B65-E6626-00, 22401-KGG-910", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" },
      { pn: "5713", desc: "PCX/Vario150/Vario125ESP/Vario110, N-Max upto 2019, Vario Techno 125, Vespa 125/150 - 22401-KVB-900, 2DP-E6626-00, 22401-KWN-000, 2PH-E6626-00", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" }
    ]
  },
  {
    category: "Filter Udara",
    subCategory: "Superstock Air Filter",
    items: [
      { pn: "3500", desc: "New Beat Fi, New Scoopy Fi, New Vario Fi - 17210-K16-900", het: "48.840", d24: "37.118", d27: "35.653", d29: "34.676" },
      { pn: "3501", desc: "Vario 125, Vario 150, PCX 150 - 17210-KZR-600", het: "65.046", d24: "49.435", d27: "47.484", d29: "46.183" },
      { pn: "3945", desc: "Mio M3, All New Soul GT - 2PH-E4450-00", het: "45.621", d24: "34.672", d27: "33.303", d29: "32.391" },
      { pn: "3499", desc: "Beat, Scoopy - 117210-KVY-960", het: "48.840", d24: "37.118", d27: "35.653", d29: "34.676" },
      { pn: "3949", desc: "Nmax - 2DP-E4451-00", het: "56.943", d24: "43.277", d27: "41.568", d29: "40.430" },
      { pn: "3504", desc: "Mio J, Mio GT, Mio Fino fi, X-ride, Soul GT - 54P-WE445-00", het: "49.839", d24: "37.878", d27: "36.382", d29: "35.386" },
      { pn: "3498", desc: "Vario, Vario Techno - 117210-KVB-700", het: "54.279", d24: "41.252", d27: "39.624", d29: "38.538" },
      { pn: "3502", desc: "Mio, Mio Sporty - 5TL-E4450-00", het: "46.731", d24: "35.516", d27: "34.114", d29: "33.179" },
      { pn: "3947", desc: "All New CBR150R, All New CB150R - 17211-K15-900", het: "52.170", d24: "39.649", d27: "38.084", d29: "37.041" },
      // Page 7
      { pn: "3948", desc: "Supra X125 FI, New Revo FI, Blade125 FI - 17210-K03-N30", het: "46.287", d24: "35.178", d27: "33.790", d29: "32.864" },
      { pn: "3506", desc: "Vixion NVL / NVA - 1PA-E4450-00", het: "54.279", d24: "41.252", d27: "39.624", d29: "38.538" },
      { pn: "4831", desc: "R15, Xabre, Vixion (20P) - 20P-E4450-00", het: "70.485", d24: "53.569", d27: "51.454", d29: "50.044" },
      { pn: "4832", desc: "Aerox155 - B65-E4451-00", het: "54.279", d24: "41.252", d27: "39.624", d29: "38.538" },
      { pn: "5029", desc: "Genio, All New Beat, New Scoopy - 17210-K0J-600", het: "56.943", d24: "43.277", d27: "41.568", d29: "40.430" },
      { pn: "5028", desc: "PCX150, ADV150 - 17210-K97-600", het: "80.586", d24: "61.245", d27: "58.828", d29: "57.216" },
      { pn: "5234", desc: "Vario 160, PCX160, ADV160 - 17210-K1Z-N20", het: "80.586", d24: "61.245", d27: "58.828", d29: "57.216" },
      { pn: "5235", desc: "Nmax 155, All New AEROX - B6H-E4451-00", het: "59.052", d24: "44.880", d27: "43.108", d29: "41.927" },
      { pn: "5236", desc: "Fazzio - BEJ-E4450-00", het: "48.840", d24: "37.118", d27: "35.653", d29: "34.676" }
    ]
  },
  {
    category: "Filter Udara",
    subCategory: "Stainless Racing Filter",
    items: [
      { pn: "5566", desc: "New Beat Fi, New Scoopy Fi, New Vario Fi - 17210-K16-900", het: "139.971", d24: "106.378", d27: "102.179", d29: "99.379" },
      { pn: "5567", desc: "Vario 125, Vario 150, PCX 150 - 17210-KZR-600", het: "149.961", d24: "113.970", d27: "109.472", d29: "106.472" },
      { pn: "5568", desc: "Mio M3, All New Soul GT - 2PH-E4450-00", het: "149.961", d24: "113.970", d27: "109.472", d29: "106.472" },
      { pn: "5569", desc: "Nmax - 2DP-E4451-00", het: "169.941", d24: "129.155", d27: "124.057", d29: "120.658" },
      { pn: "5571", desc: "Aerox155 - B65-E4451-00", het: "149.961", d24: "113.970", d27: "109.472", d29: "106.472" },
      { pn: "5572", desc: "Vario 160, PCX160, ADV160 - 17210-K1Z-N20", het: "169.941", d24: "129.155", d27: "124.057", d29: "120.658" },
      { pn: "5574", desc: "Genio, All New Beat, New Scoopy - 17210-K0J-600", het: "149.961", d24: "113.970", d27: "109.472", d29: "106.472" },
      { pn: "5575", desc: "Nmax155, New AEROX - B6H-E4451-00", het: "169.941", d24: "129.155", d27: "124.057", d29: "120.658" }
    ]
  },
  {
    category: "Filter Udara",
    subCategory: "Filter Oli (Oil Filter)",
    items: [
      { pn: "3508", desc: "Vixion, Jupiter MX, Scorpio Z, Jupiter Z Fi", het: "28.971", d24: "22.018", d27: "21.149", d29: "20.569" },
      { pn: "3509", desc: "Smash, Shogun, Satria F150, Thunder, Spin, Skywave, Skydrive", het: "25.752", d24: "19.572", d27: "18.799", d29: "18.284" }
    ]
  },
  {
    category: "Gas Spontan",
    subCategory: "Racing Throttle Kit",
    items: [
      { pn: "4921", desc: "2 Cable Universal Matic - 1800mm", het: "259.962", d24: "197.571", d27: "189.772", d29: "184.573" },
      { pn: "4922", desc: "2 Cable Universal Sport/Bebek, Underbone - 900mm", het: "259.962", d24: "197.571", d27: "189.772", d29: "184.573" },
      { pn: "5497", desc: "Single Cable Sport/Bebek, Underbone - 1.100mm", het: "209.901", d24: "159.525", d27: "153.228", d29: "149.030" },
      { pn: "6258", desc: "Single Cable Matic - 1870mm", het: "219.891", d24: "167.117", d27: "160.520", d29: "156.123" }
    ]
  },
  {
    category: "Handgrip",
    subCategory: "Universal Handgrip",
    items: [
      { pn: "2738", desc: "Road Race Grip, Black Grey", het: "75.924", d24: "57.702", d27: "55.425", d29: "53.906" },
      { pn: "2725", desc: "Road Race Grip, Blue Grey", het: "75.924", d24: "57.702", d27: "55.425", d29: "53.906" },
      { pn: "2736", desc: "Road Race Grip, Red Grey", het: "75.924", d24: "57.702", d27: "55.425", d29: "53.906" },
      { pn: "5538", desc: "Road Race Grip 2, Black", het: "74.925", d24: "56.943", d27: "54.695", d29: "53.197" },
      { pn: "4866", desc: "Slash Grips 120mm 7/8\", Gray/Black", het: "75.924", d24: "57.702", d27: "55.425", d29: "53.906" },
      { pn: "4867", desc: "Slash Grips 120mm 7/8\", Red/Black", het: "75.924", d24: "57.702", d27: "55.425", d29: "53.906" },
      { pn: "4869", desc: "Slash Grips 120mm 7/8\", Blue/Black", het: "75.924", d24: "57.702", d27: "55.425", d29: "53.906" },
      { pn: "4870", desc: "Supercross Grip 120mm 7/8\", Gray/Black - Closed-End, Dual Compound", het: "75.924", d24: "57.702", d27: "55.425", d29: "53.906" },
      { pn: "4871", desc: "Supercross Grip 120mm 7/8\", Red/Black - Closed-End, Dual Compound", het: "75.924", d24: "57.702", d27: "55.425", d29: "53.906" },
      { pn: "2726", desc: "Motorcross Grip, Blue Grey", het: "75.924", d24: "57.702", d27: "55.425", d29: "53.906" },
      { pn: "2741", desc: "Motorcross Grip, Red Grey", het: "75.924", d24: "57.702", d27: "55.425", d29: "53.906" },
      { pn: "2742", desc: "Motorcross Grip, Green Grey", het: "75.924", d24: "57.702", d27: "55.425", d29: "53.906" },
      { pn: "2743", desc: "Motorcross Grip, Black Grey", het: "75.924", d24: "57.702", d27: "55.425", d29: "53.906" },
      // Page 8
      { pn: "5057", desc: "Superstock Grip SS-1, Black, Diamond", het: "49.905", d24: "37.928", d27: "36.431", d29: "35.433" },
      { pn: "5213", desc: "Superstock Grip SS-2, Black, Hair Line", het: "49.950", d24: "37.962", d27: "36.464", d29: "35.465" },
      { pn: "5240", desc: "Superstock Grip SS-3, Black, Octagon", het: "49.950", d24: "37.962", d27: "36.464", d29: "35.465" },
      { pn: "5241", desc: "Katana Grip, Black Gray", het: "74.925", d24: "56.943", d27: "54.695", d29: "53.197" },
      { pn: "5457", desc: "Katana Grip, Black Red", het: "74.925", d24: "56.943", d27: "54.695", d29: "53.197" }
    ]
  },
  {
    category: "Disc Rotor",
    subCategory: "Superstock Disc Rotor (Non-Floating)",
    items: [
      { pn: "4928", desc: "Nmax ‘15~19, New Nmax ’19~22, Aerox155 ‘16~22, Lexi ’18~22 Front, 230mm", het: "211.899", d24: "161.043", d27: "154.686", d29: "150.448" },
      { pn: "4929", desc: "Nmax ‘15~19, New Nmax ’19~22 Rear, 230mm", het: "211.899", d24: "161.043", d27: "154.686", d29: "150.448" },
      { pn: "4930", desc: "PCX150 ‘17~22 Front, 220mm", het: "211.899", d24: "161.043", d27: "154.686", d29: "150.448" },
      { pn: "4931", desc: "PCX160 ‘21-22 Front, 220mm", het: "211.899", d24: "161.043", d27: "154.686", d29: "150.448" },
      { pn: "4932", desc: "PCX150 ‘17~22, PCX160 ‘21-22 Rear, 220mm", het: "211.899", d24: "161.043", d27: "154.686", d29: "150.448" },
      { pn: "5024", desc: "Beat, Beat Fi, Beat ESP, Scoopy, Genio, K1A Front, 190mm", het: "179.931", d24: "136.748", d27: "131.350", d29: "127.751" },
      { pn: "5025", desc: "Mio M3, Mio Z, Fino, Soul, Gear, Mio J Front, 190mm", het: "179.931", d24: "136.748", d27: "131.350", d29: "127.751" },
      { pn: "5095", desc: "Mio, Mio Sporty, Mio Soul Karbu Front, 190mm", het: "179.931", d24: "136.748", d27: "131.350", d29: "127.751" },
      { pn: "5026", desc: "Vario 150 LED Lubang 5 (K59) 2018-2022 Front, 190mm", het: "189.921", d24: "144.340", d27: "138.642", d29: "134.844" },
      { pn: "5492", desc: "CRF150 Front, 240mm", het: "224.997", d24: "170.998", d27: "164.248", d29: "159.748" },
      { pn: "5493", desc: "KLX150 Front, 240mm", het: "224.997", d24: "170.998", d27: "164.248", d29: "159.748" },
      { pn: "5494", desc: "KLX150 Rear, 190mm", het: "199.911", d24: "151.932", d27: "145.935", d29: "141.937" },
      { pn: "5495", desc: "Vixion, NVA, NVL Front, 245mm", het: "224.997", d24: "170.998", d27: "164.248", d29: "159.748" },
      { pn: "5899", desc: "Xmax Rear, 245mm", het: "249.972", d24: "189.979", d27: "182.480", d29: "177.480" }
    ]
  },
  {
    category: "Disc Rotor",
    subCategory: "Floating Race Disc Rotor",
    items: [
      { pn: "5177", desc: "Nmax, Aerox, 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5545", desc: "Beat, Vario 125 FR, 220mm 4-Hole", het: "649.905", d24: "493.928", d27: "474.431", d29: "461.433" },
      { pn: "5266", desc: "Jupiter Z, 298mm", het: "899.988", d24: "683.991", d27: "656.991", d29: "638.991" },
      { pn: "5267", desc: "Beat, Beat FI, Scoopy, 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5268", desc: "MX-King, 298mm", het: "899.988", d24: "683.991", d27: "656.991", d29: "638.991" },
      { pn: "5540", desc: "Mio, Mio Sporty, 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" }
    ]
  },
  {
    category: "Disc Rotor",
    subCategory: "SUPERPRO T-Floating Race Disc Rotor",
    items: [
      { pn: "5498", desc: "Jupiter Z 300mm, Black", het: "1.449.993", d24: "1.101.995", d27: "1.058.495", d29: "1.029.495" },
      { pn: "5499", desc: "Beat, Beat Fi, Esp 260mm, Black", het: "1.199.910", d24: "911.932", d27: "875.934", d29: "851.936" },
      { pn: "5614", desc: "Jupiter Z 300mm, Orange", het: "1.449.993", d24: "1.101.995", d27: "1.058.495", d29: "1.029.495" },
      { pn: "5615", desc: "Beat, Beat Fi, Esp 260mm, Orange", het: "1.199.910", d24: "911.932", d27: "875.934", d29: "851.936" },
      { pn: "5897", desc: "Xmax 300mm, Black", het: "1.499.943", d24: "1.139.957", d27: "1.094.958", d29: "1.064.960" },
      { pn: "5898", desc: "Xmax 300mm, Orange", het: "1.499.943", d24: "1.139.957", d27: "1.094.958", d29: "1.064.960" },
      { pn: "6207", desc: "Mio 260mm, Black", het: "1.199.910", d24: "911.932", d27: "875.934", d29: "851.936" },
      { pn: "6208", desc: "Mio 260mm, Orange", het: "1.199.910", d24: "911.932", d27: "875.934", d29: "851.936" }
    ]
  },

  // Page 9
  {
    category: "Komstir",
    subCategory: "Steam Bearing (Komstir)",
    items: [
      { pn: "4913", desc: "Nmax155 (2020-Up), Aerox155 (up to 2020) - 4RT/1P6/4RT/2TD/2TD", het: "130.980", d24: "99.545", d27: "95.615", d29: "92.996" },
      { pn: "4914", desc: "N-Max 150(2015-2019) Xeon (2010-2015) - 54P/5TL/54P/5BP/5BP", het: "130.980", d24: "99.545", d27: "95.615", d29: "92.996" },
      { pn: "4915", desc: "Vixion (2007-2011), Vixion NVA & NVL (2013-2016) R15(2014-2016), VXN150 &155 (2017-2020) R15 V3 (2017-2020) - 1PA/5TL/4FP/5BP", het: "130.980", d24: "99.545", d27: "95.615", d29: "92.996" },
      { pn: "4916", desc: "Aerox 155(2021 up), Mio Fino, Mio GT, Mio M3, Mio S, Mio Z, Mio, Mio Soul, Mio Sporty, Jupiter Z - 54P/5TL/28D/18G", het: "101.898", d24: "77.442", d27: "74.386", d29: "72.348" },
      { pn: "4919", desc: "Supra, Supra X125, Revo 110, Blade Carb, Blade125, Beat Fi, Scoopy Fi, Beat ESP, Vario125, Vario150 - 22F/5TL/156/18G", het: "99.900", d24: "75.924", d27: "72.927", d29: "70.929" },
      { pn: "4920", desc: "Mega Pro, Verza, CB150R, All New CB150R, CBR150R, All New CBR150R 2016 - GN5", het: "101.898", d24: "77.442", d27: "74.386", d29: "72.348" },
      { pn: "5052", desc: "CRF150 - KTR", het: "174.936", d24: "132.951", d27: "127.703", d29: "124.205" },
      { pn: "5053", desc: "KLX150, Dirt Tracker - 91015-425-831", het: "201.909", d24: "153.451", d27: "147.394", d29: "143.355" },
      { pn: "5323", desc: "Tiger - 92116-1065", het: "99.900", d24: "75.924", d27: "72.927", d29: "70.929" },
      { pn: "5324", desc: "Satria Fu150 Carburetor - 51600-25G00-000", het: "129.981", d24: "98.786", d27: "94.886", d29: "92.287" },
      { pn: "5682", desc: "Ninja 150 R/RR - P1004-0004", het: "119.991", d24: "91.193", d27: "87.593", d29: "85.194" },
      { pn: "5683", desc: "Satria F150 / GSX150 - 51600-23K00-000", het: "119.991", d24: "91.193", d27: "87.593", d29: "85.194" },
      { pn: "6210", desc: "Xmax, R25, MT25", het: "179.931", d24: "136.748", d27: "131.350", d29: "127.751" }
    ]
  },
  {
    category: "Mangkok Kampas Ganda",
    subCategory: "7 Star Clutch Housing (Standar)",
    items: [
      { pn: "4838", desc: "B65, Aerox(’17-22), New N-Max(’20-22), Lexi(’18-20)", het: "296.925", d24: "225.663", d27: "216.755", d29: "210.817" },
      { pn: "4839", desc: "2DP, N-Max (Up to 2019)", het: "296.925", d24: "225.663", d27: "216.755", d29: "210.817" },
      { pn: "4841", desc: "K1N,KWN,KVB, PCX160(’21-22), PCX150(’17-21), Vario110(’06-14), Vario125(’12-22), Vario150(’15-22), Spacy Fi(’13-18)", het: "296.925", d24: "225.663", d27: "216.755", d29: "210.817" },
      { pn: "4978", desc: "K25,K16,K0J,K81, Beat Fi(‘12-14), BeatPOP/Sporty(’14-20), BeatStreet(’20-22), Scoopy Fi(’13-17), ScoopyESP(‘17-22), Genio(’19-22), Vario110ESP", het: "260.961", d24: "198.330", d27: "190.502", d29: "185.282" },
      { pn: "4840", desc: "2PH, Mio M3, Mio Z, Gear125, Fazzio, Freego, Fino Grande", het: "296.925", d24: "225.663", d27: "216.755", d29: "210.817" },
      { pn: "5018", desc: "K0J, New Beat, Genio", het: "260.961", d24: "198.330", d27: "190.502", d29: "185.282" },
      { pn: "5306", desc: "Mio J, Fino Fi, X-ride, Soul GT 115", het: "260.961", d24: "198.330", d27: "190.502", d29: "185.282" },
      { pn: "5307", desc: "Mio, Mio Soul, Mio Sporty", het: "260.961", d24: "198.330", d27: "190.502", d29: "185.282" },
      { pn: "5872", desc: "B74 - Yamaha XMAX250 QPQ Nitriding", het: "349.983", d24: "265.987", d27: "255.488", d29: "248.488" }
    ]
  },
  {
    category: "Mangkok Kampas Ganda",
    subCategory: "7 Star Torque Clutch Housing EVO Racing (Kartel / Knurling)",
    items: [
      { pn: "5254", desc: "B65, Aerox(’17-22), New N-Max(’20-22), Lexi(’18-20)", het: "363.525", d24: "276.279", d27: "265.373", d29: "258.103" },
      { pn: "5255", desc: "2DP, N-Max (Up to 2019)", het: "363.525", d24: "276.279", d27: "265.373", d29: "258.103" },
      { pn: "5256", desc: "2PH, Mio M3, Mio Z, Gear125, Fazzio, Freego, Fino Grande", het: "363.525", d24: "276.279", d27: "265.373", d29: "258.103" },
      { pn: "5257", desc: "K1N,KWN,KVB, PCX160(’21-22), PCX150(’17-21), Vario110(’06-14), Vario125(’12-22), Vario150(’15-22), Spacy Fi(’13-18)", het: "363.525", d24: "276.279", d27: "265.373", d29: "258.103" },
      { pn: "5258", desc: "K25,K16,K0J,K81, Beat Fi(‘12-14), BeatPOP/Sporty(’14-20), BeatStreet(’20-22), Scoopy Fi(’13-17), ScoopyESP(‘17-22), Genio(’19-22), Vario110ESP", het: "317.682", d24: "241.438", d27: "231.908", d29: "225.554" },
      { pn: "5259", desc: "K0J, New Beat, Genio", het: "317.682", d24: "241.438", d27: "231.908", d29: "225.554" },
      { pn: "5308", desc: "Mio J, Fino Fi, X-ride, Soul GT 115", het: "317.682", d24: "241.438", d27: "231.908", d29: "225.554" },
      { pn: "5309", desc: "Mio, Mio Soul, Mio Sporty", het: "317.682", d24: "241.438", d27: "231.908", d29: "225.554" },
      { pn: "5873", desc: "B74 - Yamaha XMAX250", het: "399.933", d24: "303.949", d27: "291.951", d29: "283.952" }
    ]
  },
  {
    category: "Bearing",
    subCategory: "Wheel Bearing (Bearing Roda)",
    items: [
      { pn: "4299", desc: "6201-2RS - SatFU150, Supra, Revo, Beat, Spacy, Vario, KLX150", het: "21.978", d24: "16.703", d27: "16.044", d29: "15.604" },
      { pn: "4300", desc: "6202-2RS - Ninja150R/RR, KLX150, Ninja250Carb, RXK, Scorpio, Thunder", het: "21.978", d24: "16.703", d27: "16.044", d29: "15.604" },
      { pn: "4301", desc: "6203-2RS - TigerRevo, Ninja250Carb, Thunder, SatFU150, Supra, Revo", het: "24.420", d24: "18.559", d27: "17.827", d29: "17.338" },
      { pn: "4302", desc: "6300-2RS - JupiterZ, Mio, MioSoul, Xeon, Vega, Smash, Shogun", het: "21.978", d24: "16.703", d27: "16.044", d29: "15.604" },
      { pn: "4303", desc: "6301-2RS - NewCB150, SatFU150, JupMX, MegaPro, Thunder, Tiger, Supra", het: "21.978", d24: "16.703", d27: "16.044", d29: "15.604" },
      { pn: "4304", desc: "6302-2RS - MegaPro, Thunder, CB150R, Verza", het: "24.420", d24: "18.559", d27: "17.827", d29: "17.338" },
      { pn: "5049", desc: "6004-2RS (bearing gir belakang) - F1zr, jup-z, jup-mx, vega, vixion, byson, r15", het: "21.978", d24: "16.703", d27: "16.044", d29: "15.604" },
      { pn: "5050", desc: "6303-2RS - Tiger, RX King, Ninja 250", het: "26.973", d24: "20.499", d27: "19.690", d29: "19.151" },
      { pn: "5325", desc: "60/22, 2RS, Dual-Lip Sealing", het: "40.404", d24: "30.707", d27: "29.495", d29: "28.687" }
    ]
  },

  // Page 10
  {
    category: "Bearing",
    subCategory: "Crankshaft Bearing (Kruk As)",
    items: [
      { pn: "5179", desc: "6304, Forged, C3 Hi-Speed Type", het: "36.852", d24: "28.008", d27: "26.902", d29: "26.165" },
      { pn: "5180", desc: "6305, Forged, C3 Hi-Speed Type", het: "52.614", d24: "39.987", d27: "38.408", d29: "37.356" },
      { pn: "5181", desc: "6205, Forged, C3 Hi-Speed Type", het: "36.852", d24: "28.008", d27: "26.902", d29: "26.165" },
      { pn: "5182", desc: "6007, Forged, C3 Hi-Speed Type", het: "52.614", d24: "39.987", d27: "38.408", d29: "37.356" },
      { pn: "5183", desc: "6207, Forged, C3 Hi-Speed Type", het: "73.593", d24: "55.931", d27: "53.723", d29: "52.251" },
      { pn: "5184", desc: "6306, Forged, C3 Hi-Speed Type", het: "115.773", d24: "87.987", d27: "84.514", d29: "82.199" },
      { pn: "5185", desc: "6204, Forged, C3 Hi-Speed Type", het: "33.633", d24: "25.561", d27: "24.552", d29: "23.879" },
      { pn: "5186", desc: "63/22, Forged, C3 Hi-Speed Type", het: "47.397", d24: "36.022", d27: "34.600", d29: "33.652" },
      { pn: "5355", desc: "25BC06S98 - Revo AT, Vario KZR 125/150(L)", het: "73.593", d24: "55.931", d27: "53.723", d29: "52.251" },
      { pn: "5356", desc: "22BC05S56 - New Beat 20UP, Genio 20UP, Scoopy 20UP", het: "61.050", d24: "46.398", d27: "44.567", d29: "43.346" },
      { pn: "5357", desc: "30BC05S47S235A - New Beat 20UP, Genio 20, Scoopy 20(L)", het: "63.159", d24: "48.001", d27: "46.106", d29: "44.843" },
      { pn: "5358", desc: "TMB205Z/56CS15-2 - Vario 110 carbu(L)", het: "63.159", d24: "48.001", d27: "46.106", d29: "44.843" },
      { pn: "5359", desc: "SC04C23 - Mio Sporty, Mio Soul(L), Fino(L)", het: "68.487", d24: "52.050", d27: "49.996", d29: "48.626" },
      { pn: "5360", desc: "35BC07S57 - Vario 110 carbu, 125, 150, PCX150/160 ADV", het: "98.901", d24: "75.165", d27: "72.198", d29: "70.220" },
      { pn: "6243", desc: "6205Z, Forged C3 Hi-Speed Single Cover - Vario, Beat, Scoopy", het: "34.965", d24: "26.573", d27: "25.524", d29: "24.825" }
    ]
  },
  {
    category: "Bearing",
    subCategory: "CVT Cover Bearing",
    items: [
      { pn: "5316", desc: "CVT Cover Bearing 6002UU-2RS -10mm, Steel Bush", het: "39.960", d24: "30.370", d27: "29.171", d29: "28.372" }
    ]
  },
  {
    category: "Pulley",
    subCategory: "Superstock Pulley",
    items: [
      { pn: "5022", desc: "K97 PCX, Vario, ADV", het: "209.901", d24: "159.525", d27: "153.228", d29: "149.030" },
      { pn: "5019", desc: "B65 Aerox 155, Lexi, Nmax", het: "209.901", d24: "159.525", d27: "153.228", d29: "149.030" },
      { pn: "5020", desc: "K44 Beat Fi, ESP", het: "178.932", d24: "135.988", d27: "130.620", d29: "127.042" },
      { pn: "5021", desc: "K0J All New Beat, Genio", het: "178.932", d24: "135.988", d27: "130.620", d29: "127.042" },
      { pn: "5394", desc: "KVY/GFM, Beat Fi(Starter Kasar), Beat Carbu '08-'12", het: "178.932", d24: "135.988", d27: "130.620", d29: "127.042" }
    ]
  },
  {
    category: "Pulley",
    subCategory: "Pulley Set - HI-Speed Pulley & Face Drive EVO (13.8 Degree)",
    items: [
      { pn: "5534", desc: "B65 Aerox 155, Lexi, Nmax", het: "299.922", d24: "227.941", d27: "218.943", d29: "212.945" },
      { pn: "5542", desc: "K97 PCX, Vario, ADV", het: "299.922", d24: "227.941", d27: "218.943", d29: "212.945" },
      { pn: "5543", desc: "K44 Beat Fi, ESP", het: "274.947", d24: "208.960", d27: "200.711", d29: "195.212" },
      { pn: "5544", desc: "K0J All New Beat, Genio", het: "274.947", d24: "208.960", d27: "200.711", d29: "195.212" },
      { pn: "4934", desc: "Hi Speed Pulley Kit (with Roller) - Nmax '15-21, Aerox '17-22, Lexi '18-20", het: "555.000", d24: "421.800", d27: "405.150", d29: "394.050" }
    ]
  },
  {
    category: "Per Kopling",
    subCategory: "Clutch Spring for Manual Clutch",
    items: [
      { pn: "4990", desc: "KCJ TIGER", het: "120.990", d24: "91.952", d27: "88.323", d29: "85.903" },
      { pn: "4991", desc: "K56, Sonic 2015up, New CBR150 '15-21, New CB150 '18-21, Supra150 GTR", het: "120.990", d24: "91.952", d27: "88.323", d29: "85.903" },
      { pn: "4992", desc: "KRM, CRF150L '18up, Verza '13-18, New Mega Pro FI '12-20", het: "120.990", d24: "91.952", d27: "88.323", d29: "85.903" },
      { pn: "4993", desc: "1S7, Jupiter MX '09-14, Vixion NVL '12-14", het: "120.990", d24: "91.952", d27: "88.323", d29: "85.903" },
      { pn: "4994", desc: "905, RX-King '02-08", het: "120.990", d24: "91.952", d27: "88.323", d29: "85.903" },
      { pn: "4995", desc: "2ND, Jupiter MX150 '15-21", het: "120.990", d24: "91.952", d27: "88.323", d29: "85.903" },
      { pn: "4996", desc: "BK6, VXN150/VXN155R '18-21, YZF155 R15 '17-21", het: "120.990", d24: "91.952", d27: "88.323", d29: "85.903" },
      { pn: "4997", desc: "094, Satria FU", het: "12.099", d24: "9.195", d27: "8.832", d29: "8.590" }
    ]
  },

  // Page 11
  {
    category: "Slider Pulley",
    subCategory: "Slide Piece",
    items: [
      { pn: "5014", desc: "GCC, K81, K83Beat, Scoopy, Beat Fi, Beat ESP, Vario 110", het: "33.300", d24: "25.308", d27: "24.309", d29: "23.643" },
      { pn: "5015", desc: "K0J, Beat/Genio('19-22)", het: "33.300", d24: "25.308", d27: "24.309", d29: "23.643" },
      { pn: "5016", desc: "KWN, K1N, PCX150/160, ADV, Vario125/150", het: "33.300", d24: "25.308", d27: "24.309", d29: "23.643" },
      { pn: "5017", desc: "B65, 2DP, 5TL, Mio J, M3, Gear, Nmax, Aerox, Lexi", het: "33.300", d24: "25.308", d27: "24.309", d29: "23.643" }
    ]
  },
  {
    category: "Selang Rem",
    subCategory: "Transparent",
    items: [
      { pn: "5286", desc: "95cm, Transparent", het: "170.163", d24: "129.324", d27: "124.219", d29: "120.816" },
      { pn: "5287", desc: "90cm, Transparent", het: "164.946", d24: "125.359", d27: "120.411", d29: "117.112" },
      { pn: "5288", desc: "75cm, Transparent", het: "159.729", d24: "121.394", d27: "116.602", d29: "113.408" },
      { pn: "5289", desc: "60cm, Transparent", het: "157.731", d24: "119.876", d27: "115.144", d29: "111.989" },
      { pn: "5290", desc: "45cm, Transparent", het: "154.623", d24: "117.513", d27: "112.875", d29: "109.782" },
      { pn: "5310", desc: "110cm, Transparent", het: "180.486", d24: "137.169", d27: "131.755", d29: "128.145" },
      { pn: "5311", desc: "130cm, Transparent", het: "185.592", d24: "141.050", d27: "135.482", d29: "131.770" },
      { pn: "5312", desc: "210cm, Transparent", het: "257.742", d24: "195.884", d27: "188.152", d29: "182.997" }
    ]
  },
  {
    category: "Selang Rem",
    subCategory: "Black Carbon",
    items: [
      { pn: "5558", desc: "95cm, Carbon Black", het: "170.163", d24: "129.324", d27: "124.219", d29: "120.816" },
      { pn: "5559", desc: "90cm, Carbon Black", het: "164.946", d24: "125.359", d27: "120.411", d29: "117.112" },
      { pn: "5560", desc: "75cm, Carbon Black", het: "159.729", d24: "121.394", d27: "116.602", d29: "113.408" },
      { pn: "5561", desc: "60cm, Carbon Black", het: "157.731", d24: "119.876", d27: "115.144", d29: "111.989" },
      { pn: "5562", desc: "45cm, Carbon Black", het: "154.623", d24: "117.513", d27: "112.875", d29: "109.782" },
      { pn: "5563", desc: "110cm, Carbon Black", het: "180.486", d24: "137.169", d27: "131.755", d29: "128.145" },
      { pn: "5564", desc: "130cm, Carbon Black", het: "185.592", d24: "141.050", d27: "135.482", d29: "131.770" },
      { pn: "5565", desc: "210cm, Carbon Black", het: "257.742", d24: "195.884", d27: "188.152", d29: "182.997" }
    ]
  },
  {
    category: "Selang Rem",
    subCategory: "Red",
    items: [
      { pn: "5597", desc: "95cm, Red", het: "170.163", d24: "129.324", d27: "124.219", d29: "120.816" },
      { pn: "5598", desc: "75cm, Red", het: "159.729", d24: "121.394", d27: "116.602", d29: "113.408" },
      { pn: "5599", desc: "45cm, Red", het: "154.623", d24: "117.513", d27: "112.875", d29: "109.782" },
      { pn: "5600", desc: "210cm, Red", het: "257.742", d24: "195.884", d27: "188.152", d29: "182.997" }
    ]
  },
  {
    category: "Selang Rem",
    subCategory: "Blue",
    items: [
      { pn: "5601", desc: "95cm, Blue", het: "170.163", d24: "129.324", d27: "124.219", d29: "120.816" },
      { pn: "5602", desc: "75cm, Blue", het: "159.729", d24: "121.394", d27: "116.602", d29: "113.408" },
      { pn: "5603", desc: "45cm, Blue", het: "154.623", d24: "117.513", d27: "112.875", d29: "109.782" },
      { pn: "5604", desc: "210cm, Blue", het: "257.742", d24: "195.884", d27: "188.152", d29: "182.997" }
    ]
  },
  {
    category: "Velg",
    subCategory: "Dash Wheel",
    items: [
      { pn: "5242", desc: "Beat/Scoopy, Vario 110, Beat Fi - Black", het: "2.099.898", d24: "1.595.922", d27: "1.532.926", d29: "1.490.928" },
      { pn: "5243", desc: "Beat/Scoopy, Vario 110, Beat Fi - Silver", het: "2.099.898", d24: "1.595.922", d27: "1.532.926", d29: "1.490.928" },
      { pn: "5244", desc: "Beat/Scoopy, Vario 110, Beat Fi - Gold", het: "2.099.898", d24: "1.595.922", d27: "1.532.926", d29: "1.490.928" },
      { pn: "5245", desc: "Vario CBS, Vario 125/150 - Black", het: "2.099.898", d24: "1.595.922", d27: "1.532.926", d29: "1.490.928" },
      { pn: "5246", desc: "Vario CBS, Vario 125/150 - Silver", het: "2.099.898", d24: "1.595.922", d27: "1.532.926", d29: "1.490.928" },
      { pn: "5247", desc: "Vario CBS, Vario 125/150 - Gold", het: "2.099.898", d24: "1.595.922", d27: "1.532.926", d29: "1.490.928" },
      { pn: "5659", desc: "Mio, Mio Sporty, Mio Soul - Black", het: "2.099.898", d24: "1.595.922", d27: "1.532.926", d29: "1.490.928" },
      // Page 12
      { pn: "5660", desc: "Mio, Mio Sporty, Mio Soul - Silver", het: "2.099.898", d24: "1.595.922", d27: "1.532.926", d29: "1.490.928" },
      { pn: "5661", desc: "Mio, Mio Sporty, Mio Soul - Gold", het: "2.099.898", d24: "1.595.922", d27: "1.532.926", d29: "1.490.928" }
    ]
  },
  {
    category: "Velg",
    subCategory: "Seven Star",
    items: [
      { pn: "5353", desc: "Vario 125/150 - Black", het: "2.099.898", d24: "1.595.922", d27: "1.532.926", d29: "1.490.928" },
      { pn: "5354", desc: "Beat/Scoopy, Vario 110, Beat Fi - Black", het: "2.099.898", d24: "1.595.922", d27: "1.532.926", d29: "1.490.928" },
      { pn: "5662", desc: "Vario 125/150 - Silver", het: "2.249.970", d24: "1.709.977", d27: "1.642.478", d29: "1.597.479" },
      { pn: "5663", desc: "Vario 125/150 - Orange", het: "2.249.970", d24: "1.709.977", d27: "1.642.478", d29: "1.597.479" },
      { pn: "5664", desc: "Vario 125/150 - Purple", het: "2.249.970", d24: "1.709.977", d27: "1.642.478", d29: "1.597.479" },
      { pn: "5665", desc: "Beat/Scoopy, Vario 110, Beat Fi - Silver", het: "2.249.970", d24: "1.709.977", d27: "1.642.478", d29: "1.597.479" },
      { pn: "5666", desc: "Beat/Scoopy, Vario 110, Beat Fi - Orange", het: "2.249.970", d24: "1.709.977", d27: "1.642.478", d29: "1.597.479" },
      { pn: "5667", desc: "Beat/Scoopy, Vario 110, Beat Fi - Purple", het: "2.249.970", d24: "1.709.977", d27: "1.642.478", d29: "1.597.479" }
    ]
  },
  {
    category: "Velg",
    subCategory: "GP Wheel",
    items: [
      { pn: "5582", desc: "MX King (race) - Black", het: "2.099.898", d24: "1.595.922", d27: "1.532.926", d29: "1.490.928" },
      { pn: "5583", desc: "MX King (race) - Gold", het: "2.099.898", d24: "1.595.922", d27: "1.532.926", d29: "1.490.928" },
      { pn: "5584", desc: "MX King (race) - Silver", het: "2.099.898", d24: "1.595.922", d27: "1.532.926", d29: "1.490.928" },
      { pn: "5436", desc: "Jupiter - Black", het: "2.099.898", d24: "1.595.922", d27: "1.532.926", d29: "1.490.928" },
      { pn: "5437", desc: "Jupiter - Gold", het: "2.099.898", d24: "1.595.922", d27: "1.532.926", d29: "1.490.928" },
      { pn: "6257", desc: "Jupiter - Silver", het: "1.999.998", d24: "1.519.998", d27: "1.459.999", d29: "1.419.999" }
    ]
  },
  {
    category: "Velg",
    subCategory: "3 Spoke",
    items: [
      { pn: "5885", desc: "Beat ESP, Scoopy - Black", het: "1.849.926", d24: "1.405.944", d27: "1.350.446", d29: "1.313.447" },
      { pn: "5886", desc: "Beat ESP, Scoopy - Silver", het: "1.849.926", d24: "1.405.944", d27: "1.350.446", d29: "1.313.447" },
      { pn: "5887", desc: "Beat ESP, Scoopy - Gold", het: "1.849.926", d24: "1.405.944", d27: "1.350.446", d29: "1.313.447" },
      { pn: "5888", desc: "Beat ESP, Scoopy - White", het: "1.849.926", d24: "1.405.944", d27: "1.350.446", d29: "1.313.447" },
      { pn: "5889", desc: "Vario 125/150 - Black", het: "1.849.926", d24: "1.405.944", d27: "1.350.446", d29: "1.313.447" },
      { pn: "5890", desc: "Vario 125/150 - Silver", het: "1.849.926", d24: "1.405.944", d27: "1.350.446", d29: "1.313.447" },
      { pn: "5891", desc: "Vario 125/150 - Gold", het: "1.849.926", d24: "1.405.944", d27: "1.350.446", d29: "1.313.447" },
      { pn: "5892", desc: "Vario 125/150 - White", het: "1.849.926", d24: "1.405.944", d27: "1.350.446", d29: "1.313.447" },
      { pn: "5893", desc: "Mio Sporty - Black", het: "1.749.915", d24: "1.329.935", d27: "1.277.438", d29: "1.242.440" },
      { pn: "5894", desc: "Mio Sporty - Silver", het: "1.749.915", d24: "1.329.935", d27: "1.277.438", d29: "1.242.440" },
      { pn: "5895", desc: "Mio Sporty - Gold", het: "1.749.915", d24: "1.329.935", d27: "1.277.438", d29: "1.242.440" },
      { pn: "5896", desc: "Mio Sporty - White", het: "1.749.915", d24: "1.329.935", d27: "1.277.438", d29: "1.242.440" }
    ]
  },
  {
    category: "Rantai",
    subCategory: "Ultra Heavy Duty Chain (Gold Plating)",
    items: [
      { pn: "5390", desc: "415-130L, Gold Plating", het: "234.987", d24: "178.590", d27: "171.541", d29: "166.841" },
      { pn: "5391", desc: "415-140L, Gold Plating", het: "249.972", d24: "189.979", d27: "182.480", d29: "177.480" },
      { pn: "5400", desc: "415-150L, Gold Plating", het: "249.972", d24: "189.979", d27: "182.480", d29: "177.480" },
      { pn: "5392", desc: "428-124L, Gold Plating", het: "229.992", d24: "174.794", d27: "167.894", d29: "163.294" },
      { pn: "5393", desc: "428-140L, Gold Plating", het: "249.972", d24: "189.979", d27: "182.480", d29: "177.480" },
      { pn: "5539", desc: "428-150L, Gold Plating", het: "279.942", d24: "212.756", d27: "204.358", d29: "198.759" }
    ]
  },
  {
    category: "Rantai",
    subCategory: "Heavy Duty Superstock Chain (Black Color)",
    items: [
      { pn: "5445", desc: "428-100, Black", het: "119.991", d24: "91.193", d27: "87.593", d29: "85.194" },
      { pn: "5446", desc: "428-110, Black", het: "129.981", d24: "98.786", d27: "94.886", d29: "92.287" },
      { pn: "5447", desc: "428-120, Black", het: "139.971", d24: "106.378", d27: "102.179", d29: "99.379" },
      { pn: "5448", desc: "428-130, Black", het: "149.961", d24: "113.970", d27: "109.472", d29: "106.472" },
      { pn: "5449", desc: "428-140, Black", het: "159.951", d24: "121.563", d27: "116.764", d29: "113.565" },
      { pn: "5633", desc: "415-120, Black", het: "144.966", d24: "110.174", d27: "105.825", d29: "102.926" },
      // Page 13
      { pn: "5634", desc: "415-130, Black", het: "159.951", d24: "121.563", d27: "116.764", d29: "113.565" }
    ]
  },
  {
    category: "Kaliper",
    subCategory: "CNC Caliper (Tanpa Bracket)",
    items: [
      { pn: "5668", desc: "CNC 2 Piston Caliper, Black, Size Piston 2x32mm", het: "449.994", d24: "341.995", d27: "328.496", d29: "319.496" },
      { pn: "6056", desc: "CNC 2 Piston Caliper, Orange, Size Piston 2x32mm", het: "449.994", d24: "341.995", d27: "328.496", d29: "319.496" },
      { pn: "5900", desc: "CNC 2 Piston Caliper, Red, Size Piston 2x32mm", het: "449.994", d24: "341.995", d27: "328.496", d29: "319.496" },
      { pn: "5669", desc: "CNC 2 Piston Caliper, Titan, Size Piston 2x32mm", het: "449.994", d24: "341.995", d27: "328.496", d29: "319.496" },
      { pn: "6237", desc: "CNC 4 Piston Caliper, Black Color Size Piston 4x30mm, Left (Honda Matic)", het: "649.905", d24: "493.928", d27: "474.431", d29: "461.433" },
      { pn: "5670", desc: "CNC 4 Piston Caliper, Black, Size Piston 2x30mm", het: "649.905", d24: "493.928", d27: "474.431", d29: "461.433" },
      { pn: "6240", desc: "CNC 4 Piston Caliper, Orange Color Size Piston 4x30mm, Left (Honda Matic)", het: "649.905", d24: "493.928", d27: "474.431", d29: "461.433" },
      { pn: "6058", desc: "CNC 4 Piston Caliper, Orange, Size Piston 4x30mm", het: "649.905", d24: "493.928", d27: "474.431", d29: "461.433" },
      { pn: "6239", desc: "CNC 4 Piston Caliper, Red Color Size Piston 4x30mm, Left (Honda Matic)", het: "649.905", d24: "493.928", d27: "474.431", d29: "461.433" },
      { pn: "6057", desc: "CNC 4 Piston Caliper, Red, Size Piston 4x30mm", het: "649.905", d24: "493.928", d27: "474.431", d29: "461.433" },
      { pn: "6238", desc: "CNC 4 Piston Caliper, Titan Color Size Piston 4x30mm, Left (Honda Matic)", het: "649.905", d24: "493.928", d27: "474.431", d29: "461.433" },
      { pn: "5671", desc: "CNC 4 Piston Caliper, Titan, Size Piston 4x30mm", het: "649.905", d24: "493.928", d27: "474.431", d29: "461.433" }
    ]
  },
  {
    category: "Kaliper",
    subCategory: "Air Vented Caliper",
    items: [
      { pn: "5901", desc: "27mm, Black - Honda PCX 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5902", desc: "27mm, Red - Honda PCX 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5903", desc: "27mm, Silver - Honda PCX 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5904", desc: "27mm, Orange - Honda PCX 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5905", desc: "27mm, Black - Honda PCX STD 220mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5906", desc: "27mm, Red - Honda PCX STD 220mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5907", desc: "27mm, Silver - Honda PCX STD 220mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5908", desc: "27mm, Orange - Honda PCX STD 220mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5909", desc: "27mm, Black - Honda Beat, Vario 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5910", desc: "27mm, Red - Honda Beat, Vario 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5911", desc: "27mm, Silver - Honda Beat, Vario 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5912", desc: "27mm, Orange - Honda Beat, Vario 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5913", desc: "27mm, Black - Honda Beat, Vario STD 190mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5914", desc: "27mm, Red - Honda Beat, Vario STD 190mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5915", desc: "27mm, Silver - Honda Beat, Vario STD 190mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5916", desc: "27mm, Orange - Honda Beat, Vario STD 190mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5917", desc: "27mm, Black - Yamaha NMAX 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5918", desc: "27mm, Red - Yamaha NMAX 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5919", desc: "27mm, Silver - Yamaha NMAX 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5920", desc: "27mm, Orange - Yamaha NMAX 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5921", desc: "27mm, Blue - Yamaha NMAX 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5922", desc: "27mm, Black - Yamaha NMAX STD 230mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5923", desc: "27mm, Red - Yamaha NMAX STD 230mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5924", desc: "27mm, Silver - Yamaha NMAX STD 230mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5925", desc: "27mm, Orange - Yamaha NMAX STD 230mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5926", desc: "27mm, Black - Yamaha Mio 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5927", desc: "27mm, Silver - Yamaha Mio 260mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5928", desc: "27mm, Black - Yamaha Jupiter Z 300mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5929", desc: "27mm, Red - Yamaha Jupiter Z 300mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5930", desc: "27mm, Silver - Yamaha Jupiter Z 300mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5931", desc: "27mm, Orange - Yamaha Jupiter Z 300mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5932", desc: "27mm, Black - Yamaha MX-king 300mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5933", desc: "27mm, Red - Yamaha MX-king 300mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5934", desc: "27mm, Orange - Yamaha MX-king 300mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" },
      { pn: "5935", desc: "27mm, Blue - Yamaha MX-king 300mm", het: "849.927", d24: "645.945", d27: "620.447", d29: "603.448" }
    ]
  },

  // Page 14
  {
    category: "Bracket Kaliper",
    subCategory: "Bracket Caliper 2P",
    items: [
      { pn: "6060", desc: "Bracket Caliper 2P for Beat 260mm", het: "124.986", d24: "94.989", d27: "91.240", d29: "88.740" },
      { pn: "6061", desc: "Bracket Caliper 2P for Jupiter Z 300mm", het: "249.972", d24: "189.979", d27: "182.480", d29: "177.480" },
      { pn: "6062", desc: "Bracket Caliper 2P for Mio Sporty 260mm", het: "124.986", d24: "94.989", d27: "91.240", d29: "88.740" },
      { pn: "6064", desc: "Bracket Caliper 2P for MX-King 300mm", het: "249.972", d24: "189.979", d27: "182.480", d29: "177.480" },
      { pn: "6065", desc: "Bracket Caliper 2P for Supra GTR 300mm", het: "249.972", d24: "189.979", d27: "182.480", d29: "177.480" }
    ]
  },
  {
    category: "Master Rem",
    subCategory: "FL Radial Brake Master Cylinder",
    items: [
      { pn: "5585", desc: "FL Radial Brake Master Cylinder Black, Right 15mm", het: "674.991", d24: "512.993", d27: "492.743", d29: "479.244" },
      { pn: "5586", desc: "FL Radial Brake Master Cylinder Black, Right 17mm", het: "649.905", d24: "493.928", d27: "474.431", d29: "461.433" },
      { pn: "5587", desc: "FL Radial Brake Master Cylinder Black, Left 15mm", het: "674.991", d24: "512.993", d27: "492.743", d29: "479.244" }
    ]
  },
  {
    category: "Master Rem",
    subCategory: "CNC Radial Brake Master Cylinder",
    items: [
      { pn: "5611", desc: "CNC Radial Brake Master Cylinder Right Size 14\", Black", het: "699.966", d24: "531.974", d27: "510.975", d29: "496.976" },
      { pn: "5612", desc: "CNC Radial Brake Master Cylinder Right Size 17\", Black", het: "699.966", d24: "531.974", d27: "510.975", d29: "496.976" },
      { pn: "5613", desc: "CNC Radial Brake Master Cylinder Left Size 16\", Black", het: "699.966", d24: "531.974", d27: "510.975", d29: "496.976" },
      { pn: "6162", desc: "CNC Radial Brake Master Cylinder Right Size 14\", Black/Red", het: "699.966", d24: "531.974", d27: "510.975", d29: "496.976" },
      { pn: "6163", desc: "CNC Radial Brake Master Cylinder Right Size 14\", Black/Silver", het: "699.966", d24: "531.974", d27: "510.975", d29: "496.976" },
      { pn: "6164", desc: "CNC Radial Brake Master Cylinder Right Size 17\", Black/Red", het: "699.966", d24: "531.974", d27: "510.975", d29: "496.976" },
      { pn: "6165", desc: "CNC Radial Brake Master Cylinder Right Size 17\", Black/Silver", het: "699.966", d24: "531.974", d27: "510.975", d29: "496.976" },
      { pn: "6166", desc: "CNC Radial Brake Master Cylinder Left Size 16\", Black/Red", het: "699.966", d24: "531.974", d27: "510.975", d29: "496.976" },
      { pn: "6167", desc: "CNC Radial Brake Master Cylinder Left Size 16\", Black/Silver", het: "699.966", d24: "531.974", d27: "510.975", d29: "496.976" }
    ]
  },
  {
    category: "Master Rem",
    subCategory: "Forged Rear Brake Pump (Master Rem Belakang)",
    items: [
      { pn: "5936", desc: "Forged Rear Brake Pump 14mm, Black Color Universal", het: "374.958", d24: "284.968", d27: "273.719", d29: "266.220" },
      { pn: "5937", desc: "Forged Rear Brake Pump 14mm, Red Color Universal", het: "374.958", d24: "284.968", d27: "273.719", d29: "266.220" },
      { pn: "5938", desc: "Forged Rear Brake Pump 14mm, Blue Color Universal", het: "374.958", d24: "284.968", d27: "273.719", d29: "266.220" },
      { pn: "5939", desc: "Forged Rear Brake Pump 14mm, Silver Color Universal", het: "374.958", d24: "284.968", d27: "273.719", d29: "266.220" },
      { pn: "5940", desc: "Forged Rear Brake Pump 14mm, Orange Color Universal", het: "374.958", d24: "284.968", d27: "273.719", d29: "266.220" }
    ]
  },
  {
    category: "Master Rem",
    subCategory: "CNC Clutch / Brake Lever Set (Handle Kopling/Rem)",
    items: [
      { pn: "6055", desc: "CNC Clutch/Brake Lever, For Wire Type, Black", het: "474.969", d24: "360.976", d27: "346.727", d29: "337.228" },
      { pn: "6316", desc: "CNC Clutch/Brake Lever, For Wire Type, Black/Red", het: "474.969", d24: "360.976", d27: "346.727", d29: "337.228" },
      { pn: "6317", desc: "CNC Clutch/Brake Lever, For Wire Type, Black/Silver", het: "474.969", d24: "360.976", d27: "346.727", d29: "337.228" }
    ]
  },
  {
    category: "Bushing Pulley",
    subCategory: "Racing Pulley Bushing",
    items: [
      { pn: "5675", desc: "Honda K0J - New Beat ESP 20up, Genio 20up", het: "119.991", d24: "91.193", d27: "87.593", d29: "85.194" },
      { pn: "5678", desc: "Honda K0R - PCX160, ADV160", het: "119.991", d24: "91.193", d27: "87.593", d29: "85.194" },
      { pn: "5679", desc: "Yamaha 2DP - NMAX, AEROX, LEXI", het: "119.991", d24: "91.193", d27: "87.593", d29: "85.194" },
      { pn: "5673", desc: "Honda KZL - Beat FI '12-'14, Vario 110 '14-'18", het: "119.991", d24: "91.193", d27: "87.593", d29: "85.194" },
      { pn: "5674", desc: "Honda K44 - Beat ESP '15-'19, Scoopy ESP '15-17", het: "119.991", d24: "91.193", d27: "87.593", d29: "85.194" },
      { pn: "5676", desc: "Honda KWN - Vario 125/150 LED", het: "119.991", d24: "91.193", d27: "87.593", d29: "85.194" },
      { pn: "5677", desc: "Honda K97 - PCX150, ADV150", het: "119.991", d24: "91.193", d27: "87.593", d29: "85.194" },
      { pn: "5680", desc: "Yamaha 54P - Mio J, X-Ride, Mio M3, Gear", het: "119.991", d24: "91.193", d27: "87.593", d29: "85.194" },
      { pn: "5681", desc: "Yamaha - Mio Sporty", het: "119.991", d24: "91.193", d27: "87.593", d29: "85.194" }
    ]
  },

  // Page 15
  {
    category: "Injector",
    subCategory: "Racing Injector Honda",
    items: [
      { pn: "6115", desc: "6H 130cc - Beat, Vario 125/150/160, PCX, ADV", het: "199.911", d24: "151.932", d27: "145.935", d29: "141.937" },
      { pn: "6116", desc: "8H 140cc - Beat, Vario 125/150/160, PCX, ADV", het: "199.911", d24: "151.932", d27: "145.935", d29: "141.937" },
      { pn: "6117", desc: "8H 150cc - Beat, Vario 125/150/160, PCX, ADV", het: "199.911", d24: "151.932", d27: "145.935", d29: "141.937" },
      { pn: "6118", desc: "8H 160cc - Beat, Vario 125/150/160, PCX, ADV", het: "209.901", d24: "159.525", d27: "153.228", d29: "149.030" },
      { pn: "6119", desc: "10H 180cc - Beat, Vario 125/150/160, PCX, ADV", het: "219.891", d24: "167.117", d27: "160.520", d29: "156.123" }
    ]
  },
  {
    category: "Injector",
    subCategory: "Racing Injector Yamaha",
    items: [
      { pn: "6120", desc: "6H 130cc - Mio M3, New NMAX 155, All Aerox, Gear", het: "219.891", d24: "167.117", d27: "160.520", d29: "156.123" },
      { pn: "6121", desc: "8H 140cc - Mio M3, New NMAX 155, All Aerox, Gear", het: "219.891", d24: "167.117", d27: "160.520", d29: "156.123" },
      { pn: "6122", desc: "8H 160cc - Mio M3, New NMAX 155, All Aerox, Gear", het: "219.891", d24: "167.117", d27: "160.520", d29: "156.123" },
      { pn: "6123", desc: "10H 180cc - Mio M3, New NMAX 155, All Aerox, Gear", het: "229.992", d24: "174.794", d27: "167.894", d29: "163.294" },
      { pn: "6124", desc: "6H 130cc - Mio J, Old NMAX 150, Vixion, MX-King", het: "219.891", d24: "167.117", d27: "160.520", d29: "156.123" },
      { pn: "6125", desc: "6H 140cc - Mio J, Old NMAX 150, Vixion, MX-King", het: "219.891", d24: "167.117", d27: "160.520", d29: "156.123" },
      { pn: "6126", desc: "8H 160cc - Mio J, Old NMAX 150, Vixion, MX-King", het: "219.891", d24: "167.117", d27: "160.520", d29: "156.123" },
      { pn: "6127", desc: "10H 180cc - Mio J, Old NMAX 150, Vixion, MX-King", het: "229.992", d24: "174.794", d27: "167.894", d29: "163.294" }
    ]
  },
  {
    category: "Klep",
    subCategory: "Payung Klep - Superstock Hi-Carbon Valve",
    items: [
      { pn: "6129", desc: "KVY - Beat '09-19, Scoopy '10-19, Vario 110 esp IN EX", het: "69.930", d24: "53.147", d27: "51.049", d29: "49.650" },
      { pn: "6130", desc: "K0J - New Beat 20up, New Scoopy 20up, Genio IN EX", het: "69.930", d24: "53.147", d27: "51.049", d29: "49.650" },
      { pn: "6131", desc: "KVB - Vario CBS Carbu, Vario 110 IN EX", het: "69.930", d24: "53.147", d27: "51.049", d29: "49.650" },
      { pn: "6132", desc: "KWN - Vario 125 CBS, ESP IN EX", het: "79.920", d24: "60.739", d27: "58.342", d29: "56.743" },
      { pn: "6133", desc: "KZY - Vario ESP 150, PCX 150, ADV 150 IN EX", het: "79.920", d24: "60.739", d27: "58.342", d29: "56.743" },
      { pn: "6134", desc: "KPH - Karisma, Supra X 125, Supra X 125 FI IN EX", het: "69.930", d24: "53.147", d27: "51.049", d29: "49.650" },
      { pn: "6135", desc: "K56 - Sonic 150, CBR150 '16up, CB150 '16UP Spr GTR IN EX", het: "79.920", d24: "60.739", d27: "58.342", d29: "56.743" },
      { pn: "6136", desc: "KFM - Win, Grand, Supra 100, Supra Fit, Revo 100 IN EX", het: "59.940", d24: "45.554", d27: "43.756", d29: "42.557" },
      { pn: "6137", desc: "KYE - Megapro, Verza 150, CRF150L IN EX", het: "79.920", d24: "60.739", d27: "58.342", d29: "56.743" },
      { pn: "6138", desc: "KPP - CBR150 K45A, CB150 '12-'15 IN EX", het: "79.920", d24: "60.739", d27: "58.342", d29: "56.743" },
      { pn: "6139", desc: "KCM - Honda GL Max, GL Pro, Tiger 2000, Tiger Revo IN EX", het: "59.940", d24: "45.554", d27: "43.756", d29: "42.557" },
      { pn: "6140", desc: "5MX - Mio Sporty, Fino Carbu, Mio Soul, Nouvo IN EX", het: "69.930", d24: "53.147", d27: "51.049", d29: "49.650" },
      { pn: "6141", desc: "2PH - Mio M3, Mio J, Mio Soul GT, Xeon RC, Gear IN EX", het: "79.920", d24: "60.739", d27: "58.342", d29: "56.743" },
      { pn: "6142", desc: "2DP - NMAX, Aerox, Lexi IN EX", het: "69.930", d24: "53.147", d27: "51.049", d29: "49.650" },
      { pn: "6143", desc: "5D9 - Jupiter Z 115, Vega ZR IN EX", het: "69.930", d24: "53.147", d27: "51.049", d29: "49.650" },
      { pn: "6144", desc: "5TP - Jupiter Z 110, Vega R old, Vega R new IN EX", het: "69.930", d24: "53.147", d27: "51.049", d29: "49.650" },
      { pn: "6145", desc: "1S7 - MX King, Vixion Old, NVL, NVA, R15 IN EX", het: "79.920", d24: "60.739", d27: "58.342", d29: "56.743" }
    ]
  },
  {
    category: "Lainnya",
    subCategory: "Alat Cuci Steam - Daystar",
    items: [
      { pn: "5233", desc: "Daystar High Pressure Cleaner 304-600, Alat cuci Steam Motor dan Mobil", het: "1.149.960", d24: "873.970", d27: "839.471", d29: "816.472" }
    ]
  }
];

// Flaten array items
export function getFlatNewPricelist() {
  const list = [];
  rawSections.forEach(sec => {
    sec.items.forEach(it => {
      list.push({
        pn: String(it.pn).trim(),
        description: it.desc.trim(),
        het: parsePrice(it.het),
        d24: parsePrice(it.d24),
        d27: parsePrice(it.d27),
        d29: parsePrice(it.d29),
        // Untuk kompatibilitas backward dengan order dan pencarian
        price: it.het, // format string display e.g. "18.204"
        category: sec.category,
        subCategory: sec.subCategory
      });
    });
  });
  return list;
}
