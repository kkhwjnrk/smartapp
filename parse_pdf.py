import fitz
import re
import json

pdf_path = r"c:\Users\Kukuh\Desktop\smartapp\pricelist-dyt.pdf"
out_json_path = r"c:\Users\Kukuh\Desktop\smartapp\src\data\pricelist.json"

try:
    doc = fitz.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text("text") + "\n"

    pattern = re.compile(r'(?m)^(\d{4})\n(.+?)(?=\n\d{4}\n|\Z)', re.DOTALL)
    # The OCR earlier had "3389 Ignimax...", meaning PN and Desc on same line.
    # PyMuPDF might split them into different lines if they are in a table.
    # Let's try matching both formats.
    
    # A generic regex to find a PN and the text following it until the next PN.
    # Assuming PN is strictly 4 digits.
    # Let's clean the text first: remove page headers/footers if possible.
    lines = full_text.split('\n')
    clean_lines = []
    for l in lines:
        if "CV. DAYTONA RACING" in l or "Phone :" in l or "Pricelist" in l or "Online" in l or "Qty/Ctn" in l or "Picture" in l or "Description" in l or l.strip() == "PN":
            continue
        if l.strip():
            clean_lines.append(l.strip())
            
    clean_text = "\n".join(clean_lines)
    
    # Try to find sequences: [PN] -> [Desc...] -> [Price] -> [Qty]
    # In table extraction, sometimes they come column by column!
    # Let's hope it's row by row.
    
    pattern = re.compile(r'(?m)^(\d{4})\n(.+?)(?=\n\d{4}\n|\Z)', re.DOTALL)
    matches = pattern.findall(clean_text)
    
    if not matches:
        # Try the other format: "3389 Desc..."
        pattern = re.compile(r'(?m)^(\d{4})\s+(.+?)(?=\n\d{4}\s+|\Z)', re.DOTALL)
        matches = pattern.findall(clean_text)

    products = []
    for pn, body in matches:
        body = body.strip().replace('\n', ' ')
        m = re.search(r'\s+([\d\.]+)\s+(\d+)$', body)
        if m:
            price = m.group(1)
            qty = m.group(2)
            desc = body[:m.start()].strip()
        else:
            m2 = re.search(r'\s+([\d\.]+)$', body)
            if m2:
                price = m2.group(1)
                qty = "1"
                desc = body[:m2.start()].strip()
            else:
                price = "0"
                qty = "1"
                desc = body

        products.append({
            "pn": pn,
            "description": desc,
            "price": price,
            "qty": qty
        })

    if products:
        with open(out_json_path, 'w', encoding='utf-8') as f:
            json.dump(products, f, indent=2)
        print(f"SUCCESS: Processed {len(products)} products.")
    else:
        print("FAILED: No products extracted.")
        print("--- RAW TEXT ---")
        print(clean_text[:1000])

except Exception as e:
    print(f"Error: {e}")
