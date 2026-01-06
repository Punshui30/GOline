#!/usr/bin/env python3
"""
Analyze LAB_PACKET.pdf for concrete lab findings
Extracts analytes, methods, limitations, identifiers
"""

import re
from pathlib import Path
from collections import defaultdict

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

LAB_PACKET_PDF = Path(r"C:\Users\simmo\Desktop\audit\lab_extraction\LAB_PACKET.pdf")
LAB_PACKET_INDEX_CSV = Path(r"C:\Users\simmo\Desktop\audit\lab_extraction\lab_packet_index.csv")
OUTPUT_DIR = Path(r"C:\Users\simmo\Desktop\audit\lab_extraction")

LAB_FINDINGS_CSV = OUTPUT_DIR / "lab_findings_table.csv"
CLICKABLE_INDEX_HTML = OUTPUT_DIR / "clickable_lab_blocks_index.html"

PDF_BASE_PATH = "file:///C:/Users/simmo/Downloads/Copy%20of%20Discovery%20attachments%20Babars%20combined%20840%20pages_RedactedB%20(1)%20(1).pdf#page="

# Analyte patterns
ANALYTE_PATTERNS = {
    'THC': [r'\bthc\b', r'delta[- ]?9', r'd9', r'Δ9'],
    'THCA': [r'thca', r'thc[- ]?a', r'THC-A'],
    'CBD': [r'\bcbd\b', r'cannabidiol'],
    'CBG': [r'\bcbg\b'],
    'CBN': [r'\bcbn\b'],
    'Psilocybin': [r'psilocybin', r'psilocin'],
}

# Method/Instrument patterns
METHOD_PATTERNS = {
    'GC-MS': [r'gc[- ]?ms', r'gas\s+chromatography\s+mass\s+spectrometry'],
    'GC-FID': [r'gc[- ]?fid', r'gas\s+chromatography\s+flame\s+ionization'],
    'HPLC': [r'\bhplc\b', r'high\s+performance\s+liquid\s+chromatography'],
    'LC-MS': [r'lc[- ]?ms', r'liquid\s+chromatography\s+mass\s+spectrometry'],
    'LC-MS/MS': [r'lc[- ]?ms/ms', r'lc[- ]?ms[- ]?ms'],
}

# Limitation patterns
LIMITATION_PATTERNS = [
    r'not\s+calculated',
    r'could\s+not\s+be\s+calculated',
    r'not\s+quantitated',
    r'unable\s+to\s+be\s+quantitated',
    r'below\s+reporting\s+limit',
    r'below\s+the\s+reporting\s+limit',
    r'outside\s+calibration\s+range',
    r'not\s+within\s+calibration\s+range',
    r'qualitative\s+only',
    r'screening\s+only',
]

# Identifier patterns
IDENTIFIER_PATTERNS = [
    r'case\s+number[:\s]+([A-Z0-9\-]+)',
    r'case\s*#[:\s]+([A-Z0-9\-]+)',
    r'accession[:\s]+([A-Z0-9\-]+)',
    r'accession\s*#[:\s]+([A-Z0-9\-]+)',
    r'item\s+number[:\s]+([A-Z0-9\-]+)',
    r'item\s*#[:\s]+([A-Z0-9\-]+)',
    r'lab\s+item[:\s]+([A-Z0-9\-]+)',
    r'sample\s+id[:\s]+([A-Z0-9\-]+)',
]

def detect_analytes(text: str) -> list:
    """Detect analytes tested."""
    text_lower = text.lower()
    analytes = []
    
    for analyte_name, patterns in ANALYTE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                if analyte_name not in analytes:
                    analytes.append(analyte_name)
                break
    
    return analytes

def detect_numeric_results(text: str) -> bool:
    """Check if numeric concentration/percent is reported."""
    # Look for percentage patterns with numbers
    percentage_patterns = [
        r'\d+\.?\d*\s*%',  # 12.5%
        r'\d+\.?\d*\s*percent',  # 12.5 percent
    ]
    
    for pattern in percentage_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    
    # Look for concentration patterns (mg/g, ug/mg, etc.)
    concentration_patterns = [
        r'\d+\.?\d*\s*mg/g',
        r'\d+\.?\d*\s*ug/mg',
        r'\d+\.?\d*\s*mg/ml',
    ]
    
    for pattern in concentration_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    
    return False

def extract_limitation_quote(text: str) -> str:
    """Extract explicit limitation language (verbatim, <= 250 chars)."""
    text_lower = text.lower()
    
    for pattern in LIMITATION_PATTERNS:
        matches = list(re.finditer(pattern, text, re.IGNORECASE))
        for match in matches:
            # Get context around match (200 chars)
            start = max(0, match.start() - 100)
            end = min(len(text), match.end() + 100)
            quote = text[start:end].strip()
            
            # Clean up
            quote = re.sub(r'\s+', ' ', quote)
            if len(quote) > 250:
                quote = quote[:250] + "..."
            
            return quote
    
    return ""

def detect_method_terms(text: str) -> list:
    """Detect method/instrument terms."""
    text_lower = text.lower()
    methods = []
    
    for method_name, patterns in METHOD_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                if method_name not in methods:
                    methods.append(method_name)
                break
    
    return methods

def extract_identifiers(text: str) -> list:
    """Extract lab item identifiers."""
    identifiers = []
    
    for pattern in IDENTIFIER_PATTERNS:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            if len(match.groups()) > 0:
                identifier = match.group(1).strip()
                if identifier and identifier not in identifiers:
                    identifiers.append(identifier)
    
    return identifiers

def analyze_lab_findings():
    """Analyze lab packet for concrete findings."""
    global HAS_PDFPLUMBER
    
    if not LAB_PACKET_PDF.exists():
        print(f"ERROR: {LAB_PACKET_PDF} not found!")
        return
    
    if not LAB_PACKET_INDEX_CSV.exists():
        print(f"ERROR: {LAB_PACKET_INDEX_CSV} not found!")
        return
    
    if not HAS_PDFPLUMBER:
        import subprocess
        import sys
        print("Installing pdfplumber...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
        import pdfplumber as pdfplumber_module
        globals()['pdfplumber'] = pdfplumber_module
        HAS_PDFPLUMBER = True
    
    # Read index to get block information
    blocks_info = defaultdict(dict)
    with open(LAB_PACKET_INDEX_CSV, 'r', encoding='utf-8') as f:
        import csv
        reader = csv.DictReader(f)
        for row in reader:
            block_id = row['block_id']
            if block_id not in blocks_info:
                blocks_info[block_id] = {
                    'original_range': row['block_page_range_original'],
                    'lab_name': row['detected_lab_name'],
                    'pages': []
                }
            blocks_info[block_id]['pages'].append(row['original_page'])
    
    print(f"Analyzing {len(blocks_info)} blocks...")
    
    # Analyze each block
    findings = []
    
    pdf_module = pdfplumber if HAS_PDFPLUMBER else None
    
    with pdf_module.open(LAB_PACKET_PDF) as pdf:
        for block_id, block_data in sorted(blocks_info.items()):
            # Get text from all pages in block
            block_text = ""
            for page_num in block_data['pages']:
                # Find corresponding page in lab packet (1-indexed within packet)
                # We need to map from original page to packet page
                # For now, collect text from the block
                pass
            
            # Actually, we need to read from the original PDF using original page numbers
            # Let's use the original PDF
            original_pdf_path = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
            with pdf_module.open(original_pdf_path) as original_pdf:
                block_text = ""
                original_pages = block_data['pages']
                for page_str in original_pages:
                    try:
                        page_num = int(page_str)
                        if 1 <= page_num <= len(original_pdf.pages):
                            page = original_pdf.pages[page_num - 1]
                            text = page.extract_text() or ""
                            block_text += text + "\n\n"
                    except:
                        continue
            
            if not block_text:
                continue
            
            # Analyze block
            analytes = detect_analytes(block_text)
            has_numeric = detect_numeric_results(block_text)
            limitation = extract_limitation_quote(block_text)
            methods = detect_method_terms(block_text)
            identifiers = extract_identifiers(block_text)
            
            findings.append({
                'block_id': block_id,
                'original_page_range': block_data['original_range'],
                'analytes_detected': ', '.join(analytes) if analytes else 'None detected',
                'numeric_results_present': 'YES' if has_numeric else 'NO',
                'limitation_quote': limitation,
                'method_terms': ', '.join(methods) if methods else 'None detected',
                'lab_item_identifier_terms': ', '.join(identifiers[:5]) if identifiers else 'None detected',  # Limit to 5
                'lab_name': block_data['lab_name']
            })
    
    # Write CSV
    import csv
    with open(LAB_FINDINGS_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'block_id', 'original_page_range', 'analytes_detected', 'numeric_results_present',
            'limitation_quote', 'method_terms', 'lab_item_identifier_terms', 'lab_name'
        ])
        writer.writeheader()
        writer.writerows(findings)
    
    print(f"Saved findings to {LAB_FINDINGS_CSV}")
    
    # Write HTML index
    html_parts = [
        '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lab Blocks Index</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #3498db;
            color: white;
            font-weight: 600;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        a {
            color: #2980b9;
            text-decoration: none;
            font-weight: 600;
        }
        a:hover {
            color: #1abc9c;
            text-decoration: underline;
        }
        .page-link {
            font-family: 'Courier New', monospace;
            background-color: #ecf0f1;
            padding: 4px 8px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <h1>Lab Blocks Index</h1>
    <p><em>Click page ranges to view in original discovery PDF</em></p>
    <table>
        <thead>
            <tr>
                <th>Block ID</th>
                <th>Original Pages</th>
                <th>Lab Name</th>
                <th>Analytes</th>
                <th>Numeric Results</th>
                <th>Methods</th>
            </tr>
        </thead>
        <tbody>
'''
    ]
    
    for finding in findings:
        block_id = finding['block_id']
        page_range = finding['original_page_range']
        start_page = page_range.split('-')[0]
        page_link = PDF_BASE_PATH + start_page
        
        html_parts.append(f'            <tr>\n')
        html_parts.append(f'                <td>{block_id}</td>\n')
        html_parts.append(f'                <td><a href="{page_link}" class="page-link">{page_range}</a></td>\n')
        html_parts.append(f'                <td>{finding["lab_name"]}</td>\n')
        html_parts.append(f'                <td>{finding["analytes_detected"]}</td>\n')
        html_parts.append(f'                <td>{finding["numeric_results_present"]}</td>\n')
        html_parts.append(f'                <td>{finding["method_terms"]}</td>\n')
        html_parts.append(f'            </tr>\n')
    
    html_parts.append('        </tbody>\n    </table>\n</body>\n</html>')
    
    with open(CLICKABLE_INDEX_HTML, 'w', encoding='utf-8') as f:
        f.write(''.join(html_parts))
    
    print(f"Saved HTML index to {CLICKABLE_INDEX_HTML}")
    print("\nAnalysis complete!")

if __name__ == "__main__":
    analyze_lab_findings()















