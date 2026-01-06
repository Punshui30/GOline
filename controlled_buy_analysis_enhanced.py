#!/usr/bin/env python3
"""
Enhanced controlled buy analysis with detailed LightLab value extraction
"""

import sys
import re
import csv
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

PDF_PATH = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
PDF_FILENAME = "Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"

def extract_text_pdfplumber(pdf_path: str) -> Dict[int, str]:
    """Extract text from PDF using pdfplumber."""
    text_by_page = {}
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            try:
                text = page.extract_text()
                text_by_page[page_num] = text or ""
            except Exception as e:
                text_by_page[page_num] = ""
    return text_by_page

def extract_lightlab_values_detailed(text: str) -> Dict:
    """Extract detailed LightLab values from text."""
    values = {
        'total_thc': '',
        'delta9_thc': '',
        'thca': '',
        'total_cbd': '',
        'thc_cbd_ratio': '',
        'high_thc_label': False,
        'sample_id': '',
        'test_date': ''
    }
    
    text_lower = text.lower()
    
    # Extract Total THC - multiple patterns
    patterns = [
        r'total\s+thc[:\s]*(\d+\.?\d*)\s*%',
        r'thc[:\s]*(\d+\.?\d*)\s*%',
        r'(\d+\.?\d*)\s*%\s*total\s+thc',
        r'total\s+thc[:\s]*(\d+\.?\d*)'
    ]
    for pattern in patterns:
        match = re.search(pattern, text_lower)
        if match:
            val = match.group(1)
            if float(val) > 0:
                values['total_thc'] = val + "%"
                break
    
    # Extract Delta-9 THC
    delta9_patterns = [
        r'delta[- ]?9[- ]?thc[:\s]*(\d+\.?\d*)\s*%',
        r'delta[- ]?9[:\s]*(\d+\.?\d*)\s*%',
        r'd9[- ]?thc[:\s]*(\d+\.?\d*)\s*%'
    ]
    for pattern in delta9_patterns:
        match = re.search(pattern, text_lower)
        if match:
            values['delta9_thc'] = match.group(1) + "%"
            break
    
    # Extract THCA
    thca_patterns = [
        r'thca[:\s]*(\d+\.?\d*)\s*%',
        r'thc-a[:\s]*(\d+\.?\d*)\s*%',
        r'tetrahydrocannabinolic\s+acid[:\s]*(\d+\.?\d*)\s*%'
    ]
    for pattern in thca_patterns:
        match = re.search(pattern, text_lower)
        if match:
            values['thca'] = match.group(1) + "%"
            break
    
    # Extract Total CBD
    cbd_match = re.search(r'(?:total\s+)?cbd[:\s]*(\d+\.?\d*)\s*%', text_lower)
    if cbd_match:
        values['total_cbd'] = cbd_match.group(1) + "%"
    
    # Extract THC:CBD ratio
    ratio_patterns = [
        r'thc[:\s]*cbd\s+ratio[:\s]*(\d+[:\d]*)',
        r'ratio[:\s]*(\d+:\d+)',
        r'(\d+:\d+)\s*ratio'
    ]
    for pattern in ratio_patterns:
        match = re.search(pattern, text_lower)
        if match:
            values['thc_cbd_ratio'] = match.group(1)
            break
    
    # Check for High THC label
    if "high thc" in text_lower or "high thc sample" in text_lower:
        values['high_thc_label'] = True
    
    # Extract sample ID
    sample_patterns = [
        r'sample\s+id[:\s]*([A-Z0-9\-]+)',
        r'test\s+id[:\s]*([A-Z0-9\-]+)',
        r'id[:\s]*([A-Z0-9]{6,})'
    ]
    for pattern in sample_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            values['sample_id'] = match.group(1)
            break
    
    # Extract test date
    date_match = re.search(r'test\s+date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text_lower)
    if date_match:
        values['test_date'] = date_match.group(1)
    
    return values

def find_purchase_details(text: str, page_num: int) -> Dict:
    """Extract detailed purchase information."""
    purchase = {
        'page': page_num,
        'date': '',
        'location': '',
        'brand': '',
        'strain': '',
        'product_type': '',
        'weight': '',
        'quantity': '',
        'sku': '',
        'description': '',
        'officer': '',
        'buy_amount': ''
    }
    
    text_lower = text.lower()
    
    # Extract date - try multiple formats
    date_patterns = [
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        r'(March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}[a-z]{0,2},?\s+\d{4}',
        r'(\d{1,2}\s+(?:March|April|May|June|July|August),?\s+\d{4})'
    ]
    for pattern in date_patterns:
        matches = list(re.finditer(pattern, text, re.IGNORECASE))
        if matches:
            # Use the most recent date (later in text)
            purchase['date'] = matches[-1].group(0)
            break
    
    # Extract location
    stores = {
        "all in one": "All In One",
        "smoke star": "Smoke Star",
        "tobacco town": "Tobacco Town",
        "best choice": "Best Choice Grocery",
        "convenience city": "Convenience City",
        "smoke city": "Smoke City",
        "smoke & glass shop": "Smoke & Glass Shop"
    }
    for key, value in stores.items():
        if key in text_lower:
            purchase['location'] = value
            break
    
    # Extract product details - look for patterns like "3.5 grams Cannabis"
    weight_match = re.search(r'(\d+\.?\d*)\s*grams?\s+(?:of\s+)?(?:cannabis|flower|marijuana)', text_lower)
    if weight_match:
        purchase['weight'] = weight_match.group(1) + "g"
        purchase['product_type'] = "Flower"
    
    # Pre-rolls
    preroll_match = re.search(r'(\d+)\s*pre-?roll(?:ed)?', text_lower)
    if preroll_match:
        purchase['quantity'] = preroll_match.group(1)
        purchase['product_type'] = "Pre-roll"
    
    # Gummies
    gummy_match = re.search(r'(\d+)\s*gummies?', text_lower)
    if gummy_match:
        purchase['quantity'] = gummy_match.group(1)
        purchase['product_type'] = "Gummies"
    
    # Extract brand/strain from quoted text or labels
    # Look for quoted names
    quoted = re.findall(r'"([^"]{5,50})"', text)
    for q in quoted:
        q_lower = q.lower()
        if any(word in q_lower for word in ["thc", "thca", "cbd", "flower", "strain", "curevana", "gold", "cherry"]):
            if not purchase['brand']:
                purchase['brand'] = q
            elif not purchase['strain']:
                purchase['strain'] = q
    
    # Look for labeled products
    labeled_match = re.search(r'labeled\s+"([^"]+)"', text, re.IGNORECASE)
    if labeled_match:
        label = labeled_match.group(1)
        if not purchase['brand']:
            purchase['brand'] = label
        elif not purchase['strain']:
            purchase['strain'] = label
    
    # Extract buy amount
    amount_match = re.search(r'\$(\d+(?:\.\d{2})?)', text)
    if amount_match:
        purchase['buy_amount'] = "$" + amount_match.group(1)
    
    # Extract officer
    officer_match = re.search(r'(?:Detective|Det\.)\s+([A-Z][a-z]+)', text)
    if officer_match:
        purchase['officer'] = officer_match.group(0)
    
    # Get description - find line with purchase keywords
    lines = text.split('\n')
    for line in lines:
        line_lower = line.lower()
        if any(word in line_lower for word in ["purchased", "bought", "cannabis", "marijuana", "thc"]):
            purchase['description'] = line.strip()[:200]
            break
    
    return purchase

def main():
    global HAS_PDFPLUMBER
    
    pdf_path = PDF_PATH
    
    if not Path(pdf_path).exists():
        print(f"ERROR: PDF file not found: {pdf_path}")
        return
    
    print("Extracting text from PDF...")
    
    if not HAS_PDFPLUMBER:
        print("Installing pdfplumber...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
        import pdfplumber
        HAS_PDFPLUMBER = True
    
    text_by_page = extract_text_pdfplumber(pdf_path)
    print(f"Extracted text from {len(text_by_page)} pages\n")
    
    # Find all purchase-related pages
    purchase_keywords = [
        "controlled buy", "ci buy", "confidential informant", "confidential source",
        "undercover purchase", "uc buy", "purchase", "bought", "transaction",
        "product purchased", "item purchased", "buy money", "pre-recorded currency"
    ]
    
    print("Finding purchase pages...")
    purchase_pages = []
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if any(keyword in text_lower for keyword in purchase_keywords):
            purchase_pages.append((page_num, text))
    
    print(f"Found {len(purchase_pages)} pages with purchase references\n")
    
    # Extract purchase details
    print("Extracting purchase details...")
    purchases = []
    for page_num, text in purchase_pages:
        purchase = find_purchase_details(text, page_num)
        purchases.append(purchase)
    
    # Find LightLab result pages
    print("Finding LightLab result pages...")
    lightlab_results = []
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if "lightlab" in text_lower or "light lab" in text_lower:
            # Check if it has actual results
            if any(term in text_lower for term in ["total thc", "delta-9", "thca", "thc:", "cbd"]):
                values = extract_lightlab_values_detailed(text)
                values['page'] = page_num
                values['raw_text'] = text[:500]
                lightlab_results.append(values)
    
    print(f"Found {len(lightlab_results)} LightLab result pages\n")
    
    # Find evidence submissions
    print("Finding evidence submissions...")
    evidence_submissions = []
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if any(term in text_lower for term in ["evidence number", "item number", "submitted", "chain of custody", "msp form"]):
            # Try to extract evidence number
            ev_match = re.search(r'(?:evidence|ev)[\s#:]*([A-Z0-9\-]+)', text, re.IGNORECASE)
            ev_num = ev_match.group(1) if ev_match else ""
            evidence_submissions.append({
                'page': page_num,
                'evidence_number': ev_num,
                'has_cannabis': any(word in text_lower for word in ["cannabis", "marijuana", "thc"]),
                'submitted_to_lab': any(term in text_lower for term in ["submitted to lab", "sent to lab", "lab received"])
            })
    
    print(f"Found {len(evidence_submissions)} evidence submission pages\n")
    
    # Build comprehensive table
    print("Building analysis table...")
    table_rows = []
    
    for purchase in purchases:
        # Try to find matching LightLab result (within 20 pages)
        matching_lightlab = None
        for result in lightlab_results:
            if abs(result['page'] - purchase['page']) <= 20:
                matching_lightlab = result
                break
        
        # Try to find matching evidence submission
        matching_evidence = None
        for ev in evidence_submissions:
            if abs(ev['page'] - purchase['page']) <= 5 and ev['has_cannabis']:
                matching_evidence = ev
                break
        
        # Build row
        row = {
            'Purchase_Page': purchase['page'],
            'Purchase_Date': purchase['date'],
            'Location': purchase['location'],
            'Product_Brand_Strain_Form': f"{purchase['brand']} / {purchase['strain']} / {purchase['product_type']}".strip(" /"),
            'Weight_Quantity': f"{purchase['weight']} / {purchase['quantity']}".strip(" /"),
            'SKU_Description': purchase['description'][:100],
            'Evidence_Number': matching_evidence['evidence_number'] if matching_evidence else "NOT FOUND",
            'Evidence_Page': matching_evidence['page'] if matching_evidence else "",
            'LightLab_Page': matching_lightlab['page'] if matching_lightlab else "",
            'LightLab_Total_THC': matching_lightlab['total_thc'] if matching_lightlab else "",
            'LightLab_Delta9_THC': matching_lightlab['delta9_thc'] if matching_lightlab else "",
            'LightLab_THCA': matching_lightlab['thca'] if matching_lightlab else "",
            'LightLab_Total_CBD': matching_lightlab['total_cbd'] if matching_lightlab else "",
            'LightLab_THC_CBD_Ratio': matching_lightlab['thc_cbd_ratio'] if matching_lightlab else "",
            'High_THC_Label': "YES" if (matching_lightlab and matching_lightlab['high_thc_label']) else "",
            'Sample_ID': matching_lightlab['sample_id'] if matching_lightlab else "",
            'Missing_Data': ""
        }
        
        # Check for missing data
        missing = []
        if not row['Evidence_Number'] or row['Evidence_Number'] == "NOT FOUND":
            missing.append("Evidence number")
        if not row['LightLab_Page']:
            missing.append("LightLab result")
        
        row['Missing_Data'] = "; ".join(missing) if missing else "Complete"
        
        # Check for contradictions
        contradictions = []
        if matching_lightlab:
            if matching_lightlab['total_thc']:
                thc_val = float(matching_lightlab['total_thc'].replace("%", ""))
                if thc_val >= 100:
                    if not matching_lightlab['thca'] or matching_lightlab['thca'] == "0%":
                        contradictions.append("100% THC with zero THCA is chemically impossible")
        
        row['Contradictions'] = "; ".join(contradictions) if contradictions else ""
        
        table_rows.append(row)
    
    # Write CSV
    csv_path = Path("C:/Users/simmo/Desktop/controlled_buy_comprehensive_table.csv")
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        if table_rows:
            fieldnames = list(table_rows[0].keys())
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(table_rows)
    
    print(f"CSV table saved to: {csv_path}")
    
    # Write detailed narrative
    narrative_path = Path("C:/Users/simmo/Desktop/controlled_buy_comprehensive_narrative.txt")
    with open(narrative_path, 'w', encoding='utf-8') as f:
        f.write("CONTROLLED BUY COMPREHENSIVE ANALYSIS\n")
        f.write("=" * 100 + "\n\n")
        
        for i, row in enumerate(table_rows, 1):
            f.write(f"PURCHASE #{i}\n")
            f.write("-" * 100 + "\n")
            f.write(f"What Product Was Purchased:\n")
            f.write(f"  Location: {row['Location']}\n")
            f.write(f"  Date: {row['Purchase_Date']}\n")
            f.write(f"  Product: {row['Product_Brand_Strain_Form']}\n")
            f.write(f"  Weight/Quantity: {row['Weight_Quantity']}\n")
            f.write(f"  Description: {row['SKU_Description']}\n")
            f.write(f"  Page: {row['Purchase_Page']}\n\n")
            
            f.write("Which Item Was Actually Tested:\n")
            if row['Evidence_Number'] and row['Evidence_Number'] != "NOT FOUND":
                f.write(f"  Evidence Number: {row['Evidence_Number']} (Page {row['Evidence_Page']})\n")
            else:
                f.write("  Evidence Number: NOT DOCUMENTED\n")
            
            if row['LightLab_Page']:
                f.write(f"  LightLab Test Page: {row['LightLab_Page']}\n")
                f.write(f"  Sample ID: {row['Sample_ID']}\n")
                f.write(f"  Total THC: {row['LightLab_Total_THC']}\n")
                f.write(f"  Delta-9 THC: {row['LightLab_Delta9_THC']}\n")
                f.write(f"  THCA: {row['LightLab_THCA']}\n")
                f.write(f"  Total CBD: {row['LightLab_Total_CBD']}\n")
                f.write(f"  THC:CBD Ratio: {row['LightLab_THC_CBD_Ratio']}\n")
                if row['High_THC_Label']:
                    f.write(f"  High THC Sample Label: YES\n")
            else:
                f.write("  LightLab Test: NOT FOUND\n")
            
            f.write(f"\nWhether Tested Item Matched Purchased Item:\n")
            if row['Evidence_Number'] == "NOT FOUND" or not row['LightLab_Page']:
                f.write("  CANNOT VERIFY - Missing evidence number or LightLab result\n")
            else:
                f.write("  Requires manual verification by comparing descriptions\n")
            
            f.write(f"\nWhether LightLab Reading Was Scientifically Reliable:\n")
            if row['Contradictions']:
                f.write(f"  NO - {row['Contradictions']}\n")
            elif row['LightLab_Page']:
                f.write("  REQUIRES EXPERT REVIEW - Check for validation, error rates, methodology\n")
            else:
                f.write("  CANNOT ASSESS - No LightLab result found\n")
            
            f.write(f"\nWhether LightLab Reading Could Legally Support Probable Cause:\n")
            f.write("  LightLab is a field test device, not a validated forensic instrument.\n")
            f.write("  Field tests cannot legally establish probable cause for marijuana classification.\n")
            
            f.write(f"\nMissing Evidence:\n")
            if row['Missing_Data'] and row['Missing_Data'] != "Complete":
                f.write(f"  {row['Missing_Data']}\n")
            else:
                f.write("  All basic documentation present (but requires expert review)\n")
            
            f.write("\n" + "=" * 100 + "\n\n")
    
    print(f"Comprehensive narrative saved to: {narrative_path}")
    print("\nAnalysis complete!")

if __name__ == "__main__":
    main()















