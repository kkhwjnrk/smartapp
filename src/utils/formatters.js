// Helper kalkulasi diskon grosir dari string harga Indonesia (e.g. "18.204")
export const calculateDiscount = (priceStr, percentage) => {
  if (!priceStr || priceStr === "0") return "-";
  const numericPrice = parseFloat(priceStr.replace(/\./g, '').replace(/,/g, ''));
  if (isNaN(numericPrice)) return "-";
  
  const discounted = numericPrice * (1 - (percentage / 100));
  return Math.round(discounted).toLocaleString('id-ID').replace(/,/g, '.');
};
