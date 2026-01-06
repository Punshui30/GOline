#!/usr/bin/env python3
"""
Search for quantitative cannabinoid laboratory results in discovery PDF
"""

import sys
import re
import csv
from pathlib import Path
from typing import Dict, List, Tuple, Optional
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

def is_quantitative(text: str) -> bool:
    """Determine if result is quantitative (has specific % values) vs qualitative (threshold only)."""
    text_lower = text.lower()
    
    # Check for threshold-only language (qualitative)
    qualitative_indicators = [
        r'≥\s*1%',
        r'greater\s+than\s+1%',
        r'more\s+than\s+1%',
        r'over\s+1%',
        r'confirmed',
        r'positive',
        r'cannabis\s*\(>1%',
        r'>\s*1\s*%',
        r'threshold',
        r'presence'
    ]
    
    for pattern in qualitative_indicators:
        if re.search(pattern, text_lower):
            return False
    
    # Check for specific percentage values (quantitative)
    quantitative_patterns = [
        r'\d+\.\d+\s*%',  # Decimal percentages like 25.4%
        r'\d+\s*\.\s*\d+\s*%',  # Decimal percentages with spaces
        r'(\d+\.?\d*)\s*%\s*(?:by\s+weight|thc|delta)',  # Percentage by weight
        r'(\d+\.?\d*)\s*percent',
        r'mg/g',  # Milligrams per gram
        r'ug/mg',  # Micrograms per milligram
        r'concentration[:\s]*(\d+\.?\d*)',
    ]
    
    for pattern in quantitative_patterns:
        if re.search(pattern, text_lower):
            return True
    
    return False

def extract_cannabinoid_values(text: str) -> Dict:
    """Extract cannabinoid values from text."""
    values = {
        'delta9_thc': [],
        'thca': [],
        'total_thc': [],
        'total_cbd': [],
        'cbd': [],
        'other_cannabinoids': [],
        'has_percentages': False,
        'has_mg_g': False,
        'method': ''
    }
    
    text_lower = text.lower()
    
    # Extract Delta-9 THC values
    delta9_patterns = [
        r'delta[- ]?9[- ]?thc[:\s]*(\d+\.?\d*)\s*%',
        r'delta[- ]?9[:\s]*(\d+\.?\d*)\s*%',
        r'd9[- ]?thc[:\s]*(\d+\.?\d*)\s*%',
        r'Δ9[- ]?thc[:\s]*(\d+\.?\d*)\s*%',
        r'delta[- ]?9[- ]?tetrahydrocannabinol[:\s]*(\d+\.?\d*)\s*%',
    ]
    for pattern in delta9_patterns:
        matches = re.finditer(pattern, text_lower)
        for match in matches:
            val = match.group(1)
            if float(val) > 0:
                values['delta9_thc'].append(val + "%")
    
    # Extract THCA values
    thca_patterns = [
        r'thca[:\s]*(\d+\.?\d*)\s*%',
        r'thc-a[:\s]*(\d+\.?\d*)\s*%',
        r'tetrahydrocannabinolic\s+acid[:\s]*(\d+\.?\d*)\s*%',
    ]
    for pattern in thca_patterns:
        matches = re.finditer(pattern, text_lower)
        for match in matches:
            val = match.group(1)
            if float(val) > 0:
                values['thca'].append(val + "%")
    
    # Extract Total THC values
    total_thc_patterns = [
        r'total\s+thc[:\s]*(\d+\.?\d*)\s*%',
        r'total\s+delta[- ]?9[- ]?thc[:\s]*(\d+\.?\d*)\s*%',
    ]
    for pattern in total_thc_patterns:
        matches = re.finditer(pattern, text_lower)
        for match in matches:
            val = match.group(1)
            if float(val) > 0:
                values['total_thc'].append(val + "%")
    
    # Extract CBD values
    cbd_patterns = [
        r'total\s+cbd[:\s]*(\d+\.?\d*)\s*%',
        r'cbd[:\s]*(\d+\.?\d*)\s*%',
    ]
    for pattern in cbd_patterns:
        matches = re.finditer(pattern, text_lower)
        for match in matches:
            val = match.group(1)
            if float(val) > 0:
                values['total_cbd'].append(val + "%")
    
    # Check for percentage format
    if re.search(r'\d+\.\d+\s*%', text):
        values['has_percentages'] = True
    
    # Check for mg/g format
    if re.search(r'\d+\.?\d*\s*mg/g', text_lower):
        values['has_mg_g'] = True
        mg_g_matches = re.finditer(r'(\d+\.?\d*)\s*mg/g', text_lower)
        for match in mg_g_matches:
            values['other_cannabinoids'].append(match.group(1) + " mg/g")
    
    # Identify method
    if 'hplc' in text_lower:
        values['method'] = 'HPLC'
    elif 'gc-ms' in text_lower or 'gc/ms' in text_lower:
        values['method'] = 'GC-MS'
    elif 'gas chromatography' in text_lower:
        values['method'] = 'GC'
    elif 'chromatography' in text_lower:
        values['method'] = 'Chromatography'
    
    return values

def extract_evidence_item_number(text: str) -> str:
    """Extract evidence item number from text."""
    patterns = [
        r'evidence\s*(?:number|#)[:\s]*([A-Z0-9\-]+)',
        r'ev[:\s#]*([A-Z0-9\-]+)',
        r'item\s*(?:number|#)[:\s]*(\d+)',
        r'lab\s*item\s*#[\s]*(\d+)',
        r'exhibit\s*#[\s]*(\d+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    
    return ""

def extract_table_or_result(text: str, search_term: str) -> str:
    """Extract table or numeric result section containing the search term."""
    text_lower = text.lower()
    term_lower = search_term.lower()
    
    if term_lower not in text_lower:
        return ""
    
    # Find the term and extract surrounding context (larger window for tables)
    idx = text_lower.find(term_lower)
    start = max(0, idx - 500)
    end = min(len(text), idx + len(search_term) + 1000)
    
    context = text[start:end]
    
    # Try to extract structured data (look for lines with numbers)
    lines = context.split('\n')
    result_lines = []
    
    for line in lines:
        # Include lines with numbers and cannabinoid terms
        if re.search(r'\d+\.?\d*\s*%', line) or re.search(r'\d+\.?\d*', line):
            if any(term in line.lower() for term in ['thc', 'thca', 'cbd', 'delta', 'cannabinoid', '%', 'mg/g']):
                result_lines.append(line.strip())
    
    if result_lines:
        return "\n".join(result_lines[:20])  # Limit to 20 lines
    else:
        return context[:800]  # Fallback to context

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
    
    # Search terms
    search_terms = [
        "Δ9-THC", "Delta-9", "THC (%)", "THCA (%)", "THC-A", "THCA",
        "Total THC", "% by weight", "Cannabinoid analysis", "HPLC",
        "GC-MS quantitation", "Chromatography", "Cannabinoid quantification",
        "mg/g", "ug/mg", "percent", "concentration"
    ]
    
    print("Searching for quantitative cannabinoid results...")
    
    results = []
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Check if page contains any search terms
        matched_terms = []
        for term in search_terms:
            term_lower = term.lower()
            # Handle special characters
            if term == "Δ9-THC":
                if "delta-9" in text_lower or "d9" in text_lower or "delta 9" in text_lower:
                    matched_terms.append("Delta-9")  # Use standard form
            elif term_lower in text_lower:
                matched_terms.append(term)
        
        # Also check for delta-9 patterns directly
        if "delta-9" in text_lower and "Delta-9" not in matched_terms:
            matched_terms.append("Delta-9")
        
        if not matched_terms:
            continue
        
        # Check if this looks like a lab report (not just a mention)
        is_lab_report = any(term in text_lower for term in [
            "laboratory", "lab report", "analysis report", "test result",
            "gc-ms", "hplc", "chromatography", "maryland state police",
            "nms labs", "forensic", "method of analysis"
        ])
        
        if not is_lab_report:
            continue
        
        # Extract cannabinoid values
        cannabinoid_values = extract_cannabinoid_values(text)
        
        # Determine if quantitative
        quantitative = is_quantitative(text)
        
        # If no specific values found, might still be quantitative if it has percentage patterns
        if not quantitative and cannabinoid_values['has_percentages']:
            quantitative = True
        
        # Extract evidence item number
        evidence_number = extract_evidence_item_number(text)
        
        # Extract table/result section (use first matched term, or "delta-9" as default)
        search_term_for_extract = matched_terms[0] if matched_terms else "delta-9"
        table_result = extract_table_or_result(text, search_term_for_extract)
        
        # Only include if it has actual numeric values or is clearly a lab result
        if cannabinoid_values['has_percentages'] or cannabinoid_values['has_mg_g'] or \
           cannabinoid_values['delta9_thc'] or cannabinoid_values['thca'] or \
           cannabinoid_values['total_thc'] or quantitative:
            
            result_entry = {
                'page': page_num,
                'matched_terms': ", ".join(matched_terms[:5]),
                'evidence_item_number': evidence_number,
                'is_quantitative': 'YES' if quantitative else 'NO',
                'delta9_thc': "; ".join(cannabinoid_values['delta9_thc'][:5]),
                'thca': "; ".join(cannabinoid_values['thca'][:5]),
                'total_thc': "; ".join(cannabinoid_values['total_thc'][:5]),
                'total_cbd': "; ".join(cannabinoid_values['total_cbd'][:5]),
                'method': cannabinoid_values['method'],
                'table_result': table_result[:500]  # Limit for CSV
            }
            
            results.append(result_entry)
    
    print(f"Found {len(results)} pages with cannabinoid results\n")
    
    # Write CSV table
    csv_path = Path("C:/Users/simmo/Desktop/quantitative_cannabinoid_results_table.csv")
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        if results:
            fieldnames = ['page', 'matched_terms', 'evidence_item_number', 'is_quantitative',
                         'delta9_thc', 'thca', 'total_thc', 'total_cbd', 'method', 'table_result']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)
    
    print(f"CSV table saved to: {csv_path}")
    
    # Write detailed summary
    summary_path = Path("C:/Users/simmo/Desktop/quantitative_cannabinoid_results_summary.txt")
    with open(summary_path, 'w', encoding='utf-8') as f:
        f.write("QUANTITATIVE CANNABINOID LABORATORY RESULTS ANALYSIS\n")
        f.write("=" * 100 + "\n\n")
        
        # Count quantitative vs qualitative
        quantitative_count = sum(1 for r in results if r['is_quantitative'] == 'YES')
        qualitative_count = len(results) - quantitative_count
        
        f.write(f"TOTAL PAGES WITH CANNABINOID RESULTS: {len(results)}\n")
        f.write(f"  - Quantitative Results (specific % values): {quantitative_count}\n")
        f.write(f"  - Qualitative Results (threshold-only): {qualitative_count}\n\n")
        
        # Check if any quantitative results exist
        has_quantitative = quantitative_count > 0
        
        if has_quantitative:
            f.write("QUANTITATIVE THC PERCENTAGES FOUND:\n")
            f.write("-" * 100 + "\n\n")
            
            for result in results:
                if result['is_quantitative'] == 'YES':
                    f.write(f"Page {result['page']}\n")
                    f.write(f"  Evidence Item: {result['evidence_item_number'] or 'Not specified'}\n")
                    f.write(f"  Matched Terms: {result['matched_terms']}\n")
                    f.write(f"  Method: {result['method'] or 'Not specified'}\n")
                    if result['delta9_thc']:
                        f.write(f"  Delta-9 THC: {result['delta9_thc']}\n")
                    if result['thca']:
                        f.write(f"  THCA: {result['thca']}\n")
                    if result['total_thc']:
                        f.write(f"  Total THC: {result['total_thc']}\n")
                    if result['total_cbd']:
                        f.write(f"  Total CBD: {result['total_cbd']}\n")
                    f.write(f"\n  Table/Result:\n")
                    f.write(f"  {result['table_result'][:600]}\n")
                    f.write("\n" + "-" * 100 + "\n\n")
        else:
            f.write("NO QUANTIFIED THC PERCENTAGES WERE FOUND.\n")
            f.write("All State reports were qualitative or threshold-only (≥1%).\n\n")
        
        # Summary of qualitative results
        if qualitative_count > 0:
            f.write("\nQUALITATIVE RESULTS (Threshold-Only):\n")
            f.write("-" * 100 + "\n")
            for result in results:
                if result['is_quantitative'] == 'NO':
                    f.write(f"Page {result['page']}: Qualitative (threshold-only) - {result['matched_terms']}\n")
        
        # Overall conclusion
        f.write("\n" + "=" * 100 + "\n")
        f.write("CONCLUSION:\n")
        f.write("=" * 100 + "\n")
        
        if has_quantitative:
            f.write(f"The State reported {quantitative_count} quantitative cannabinoid result(s) with specific\n")
            f.write("percentage values. However, these require expert review to determine:\n")
            f.write("  1. Whether the testing methodology was validated\n")
            f.write("  2. Whether the results are scientifically reliable\n")
            f.write("  3. Whether the results can legally support marijuana classification\n\n")
        else:
            f.write("NO QUANTIFIED THC PERCENTAGES WERE FOUND IN THE DISCOVERY.\n")
            f.write("All State laboratory reports were qualitative (threshold-only, ≥1%) or\n")
            f.write("lacked specific quantitative cannabinoid percentages.\n\n")
        
        f.write("This finding is significant because:\n")
        f.write("  - Quantitative cannabinoid analysis is required to differentiate hemp from marijuana\n")
        f.write("  - Threshold-only results (≥1%) cannot establish actual THC content\n")
        f.write("  - Without specific percentages, the State cannot prove the material exceeded\n")
        f.write("    the 0.3% delta-9-THC limit for hemp classification\n")
    
    print(f"Summary saved to: {summary_path}")
    
    # Print summary to console
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total pages with cannabinoid results: {len(results)}")
    print(f"Quantitative results (specific %): {quantitative_count}")
    print(f"Qualitative results (threshold-only): {qualitative_count}")
    
    if has_quantitative:
        print("\n✓ Quantitative THC percentages were found in the discovery.")
    else:
        print("\n✗ No quantified THC percentages were found.")
        print("  All State reports were qualitative or threshold-only (≥1%).")
    
    print("\nAnalysis complete!")

if __name__ == "__main__":
    main()

