#!/usr/bin/env python3
"""
Fast search for quantitative cannabinoid results - optimized version
"""

import sys
import re
import csv
from pathlib import Path

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

PDF_PATH = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"

def extract_text_pdfplumber(pdf_path: str) -> dict:
    """Extract text from PDF - optimized."""
    text_by_page = {}
    print("Extracting text (this may take a few minutes for 840 pages)...")
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        for i, page in enumerate(pdf.pages, 1):
            if i % 100 == 0:
                print(f"  Processed {i}/{total} pages...")
            try:
                text = page.extract_text()
                text_by_page[i] = text or ""
            except:
                text_by_page[i] = ""
    return text_by_page

def extract_cannabinoid_data(text: str, page_num: int) -> dict:
    """Extract cannabinoid data from a single page."""
    result = {
        'page': page_num,
        'has_quantitative': False,
        'delta9_thc': [],
        'thca': [],
        'total_thc': [],
        'evidence_number': '',
        'method': '',
        'excerpt': ''
    }
    
    text_lower = text.lower()
    
    # Quick check - skip if no cannabinoid terms
    if not any(term in text_lower for term in ['thc', 'cannabinoid', 'delta-9', 'hplc', 'gc-ms']):
        return None
    
    # Check if lab report
    is_lab = any(term in text_lower for term in ['laboratory', 'lab report', 'gc-ms', 'hplc', 'maryland state police', 'nms labs'])
    if not is_lab:
        return None
    
    # Extract percentages - look for patterns like "25.4%" or "1.00%"
    percent_pattern = r'(\d+\.\d+)\s*%'
    percentages = re.findall(percent_pattern, text)
    
    if percentages:
        result['has_quantitative'] = True
        
        # Extract Delta-9 THC
        delta9_matches = re.finditer(r'delta[- ]?9[:\s]*(\d+\.?\d*)\s*%', text_lower)
        for m in delta9_matches:
            result['delta9_thc'].append(m.group(1) + "%")
        
        # Extract THCA
        thca_matches = re.finditer(r'thca[:\s]*(\d+\.?\d*)\s*%', text_lower)
        for m in thca_matches:
            result['thca'].append(m.group(1) + "%")
        
        # Extract Total THC
        total_thc_matches = re.finditer(r'total\s+thc[:\s]*(\d+\.?\d*)\s*%', text_lower)
        for m in total_thc_matches:
            result['total_thc'].append(m.group(1) + "%")
    
    # Check for threshold-only (qualitative)
    if re.search(r'≥\s*1%|>\s*1\s*%|greater\s+than\s+1%|confirmed|positive', text_lower):
        result['has_quantitative'] = False
    
    # Extract evidence number
    ev_match = re.search(r'(?:evidence|ev|item)[\s#:]*([A-Z0-9\-]+)', text, re.I)
    if ev_match:
        result['evidence_number'] = ev_match.group(1)
    
    # Method
    if 'hplc' in text_lower:
        result['method'] = 'HPLC'
    elif 'gc-ms' in text_lower or 'gc/ms' in text_lower:
        result['method'] = 'GC-MS'
    
    # Get excerpt
    idx = text_lower.find('thc')
    if idx > -1:
        start = max(0, idx - 200)
        end = min(len(text), idx + 400)
        result['excerpt'] = text[start:end].strip()[:500]
    
    return result if result['has_quantitative'] or result['delta9_thc'] or result['thca'] or result['total_thc'] else None

def main():
    global HAS_PDFPLUMBER
    
    if not Path(PDF_PATH).exists():
        print(f"ERROR: PDF not found")
        return
    
    if not HAS_PDFPLUMBER:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
        import pdfplumber
        HAS_PDFPLUMBER = True
    
    # Extract text
    text_by_page = extract_text_pdfplumber(PDF_PATH)
    print(f"\nExtracted {len(text_by_page)} pages\n")
    
    # Search for results
    print("Searching for cannabinoid results...")
    results = []
    
    for page_num, text in text_by_page.items():
        result = extract_cannabinoid_data(text, page_num)
        if result:
            results.append(result)
    
    print(f"Found {len(results)} pages with cannabinoid data\n")
    
    # Write CSV
    csv_path = Path("C:/Users/simmo/Desktop/quantitative_cannabinoid_results_table.csv")
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['page', 'evidence_number', 'is_quantitative', 
                                              'delta9_thc', 'thca', 'total_thc', 'method', 'excerpt'])
        writer.writeheader()
        for r in results:
            writer.writerow({
                'page': r['page'],
                'evidence_number': r['evidence_number'],
                'is_quantitative': 'YES' if r['has_quantitative'] else 'NO',
                'delta9_thc': '; '.join(r['delta9_thc'][:3]),
                'thca': '; '.join(r['thca'][:3]),
                'total_thc': '; '.join(r['total_thc'][:3]),
                'method': r['method'],
                'excerpt': r['excerpt']
            })
    
    print(f"CSV saved to: {csv_path}")
    
    # Write summary
    summary_path = Path("C:/Users/simmo/Desktop/quantitative_cannabinoid_results_summary.txt")
    with open(summary_path, 'w', encoding='utf-8') as f:
        f.write("QUANTITATIVE CANNABINOID RESULTS ANALYSIS\n")
        f.write("=" * 80 + "\n\n")
        
        quantitative = sum(1 for r in results if r['has_quantitative'])
        
        f.write(f"Total pages with cannabinoid results: {len(results)}\n")
        f.write(f"Quantitative results (specific %): {quantitative}\n")
        f.write(f"Qualitative results (threshold-only): {len(results) - quantitative}\n\n")
        
        if quantitative == 0:
            f.write("NO QUANTIFIED THC PERCENTAGES WERE FOUND.\n")
            f.write("All State reports were qualitative or threshold-only (≥1%).\n")
        else:
            f.write("QUANTITATIVE RESULTS FOUND:\n\n")
            for r in results:
                if r['has_quantitative']:
                    f.write(f"Page {r['page']} (Evidence: {r['evidence_number']})\n")
                    if r['delta9_thc']:
                        f.write(f"  Delta-9 THC: {', '.join(r['delta9_thc'][:3])}\n")
                    if r['thca']:
                        f.write(f"  THCA: {', '.join(r['thca'][:3])}\n")
                    if r['total_thc']:
                        f.write(f"  Total THC: {', '.join(r['total_thc'][:3])}\n")
                    f.write(f"  Method: {r['method']}\n")
                    f.write(f"\n")
    
    print(f"Summary saved to: {summary_path}")
    print(f"\nFound {quantitative} quantitative result(s) out of {len(results)} total")

if __name__ == "__main__":
    main()















