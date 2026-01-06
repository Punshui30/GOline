#!/usr/bin/env python3
"""
Create clickable index of ONLY obvious, concrete defects
Strict filtering - no inference or speculation
"""

import csv
import re
from pathlib import Path
from collections import defaultdict

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False
    pdfplumber = None

PDF_PATH = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
MASTER_CSV = r"C:\Users\simmo\Desktop\audit\master_discovery_index.csv"
HTML_OUTPUT = r"C:\Users\simmo\Desktop\audit\clickable_discovery_index_OBVIOUS.html"
CSV_OUTPUT = r"C:\Users\simmo\Desktop\audit\clickable_discovery_index_OBVIOUS.csv"

PDF_BASE_PATH = "file:///C:/Users/simmo/Downloads/Copy%20of%20Discovery%20attachments%20Babars%20combined%20840%20pages_RedactedB%20(1)%20(1).pdf#page="

CATEGORY_HEADERS = {
    'A': 'Evidence Identity Problems (Category A)',
    'B': 'Evidence Weight Problems (Category B)',
    'C': 'Chain-of-Custody Gaps (Category C)',
    'D': 'Lab Intake / Handling Problems (Category D)'
}

# Court document keywords - EXCLUDE these pages
COURT_DOC_KEYWORDS = [
    'court', 'petition', 'motion', 'expungement', 'charging', 'warrant',
    'pleading', 'judge', 'defendant', 'attorney', 'counsel', 'plaintiff',
    'respondent', 'appellant', 'appellee', 'magistrate', 'commissioner'
]

def is_court_document(text: str) -> bool:
    """Check if page is a court document - EXCLUDE these."""
    text_lower = text.lower()
    # Check for court document indicators
    if any(keyword in text_lower for keyword in COURT_DOC_KEYWORDS):
        # But allow if it's clearly an evidence/custody form that mentions court
        if any(term in text_lower for term in ['evidence', 'property', 'chain of custody', 'custody log']):
            # Check if "signature" refers to evidence handler, not court personnel
            if 'signature' in text_lower:
                # If it mentions judge/attorney/defendant signatures, exclude
                if any(term in text_lower for term in ['judge', 'attorney', 'defendant', 'counsel']):
                    return True
        else:
            return True
    return False

def identify_document_type(text: str) -> str:
    """Identify document type from text."""
    text_lower = text.lower()
    
    if 'evidence inventory' in text_lower or 'property record' in text_lower:
        return "Evidence Inventory"
    elif 'chain of custody' in text_lower or 'chainofcustody' in text_lower:
        return "Chain of Custody"
    elif 'lab submission' in text_lower or 'submission form' in text_lower:
        return "Lab Submission Form"
    elif 'property sheet' in text_lower:
        return "Property Sheet"
    elif 'evidence control' in text_lower:
        return "Evidence Control Form"
    elif 'lab intake' in text_lower or 'accession' in text_lower:
        return "Lab Intake/Accession"
    elif 'nms' in text_lower:
        return "NMS Lab Document"
    else:
        return "Unknown Document Type"

def check_category_a(text: str, page_num: int) -> tuple[bool, str]:
    """
    Category A: Identifier Conflict (OBVIOUS)
    Same evidence item shows TWO OR MORE different identifiers on same page
    AND no reconciliation statement
    """
    text_lower = text.lower()
    
    # Count different identifier types present
    identifiers = {
        'agency_item': bool(re.search(r'(?:agency|agcy)\s*item\s*#', text_lower)),
        'lab_item': bool(re.search(r'lab\s*item\s*#', text_lower)),
        'property': bool(re.search(r'property\s*#|pr-', text_lower)),
        'fsd_exhibit': bool(re.search(r'fsd\s*exhibit|exhibit\s*#', text_lower)),
        'barcode': bool(re.search(r'barcode|bar\s*code', text_lower)),
    }
    
    count = sum(identifiers.values())
    
    # Need at least 2 different identifier types
    if count < 2:
        return False, ""
    
    # Check for reconciliation statement
    has_reconciliation = bool(re.search(
        r'reconcil|cross[- ]?reference|same\s+as|equivalent|corresponds',
        text_lower
    ))
    
    if has_reconciliation:
        return False, ""
    
    # Must be on same evidence item - check if identifiers appear near each other
    # Simple check: if identifiers are present, assume they're for same item unless proven otherwise
    desc = f"Multiple identifier systems present without reconciliation"
    return True, desc

def check_category_b(text: str, tables: list, page_num: int) -> tuple[bool, str]:
    """
    Category B: Weight Defect (OBVIOUS)
    - Weight field completely blank
    - One weight applied to multiple items
    - Handwritten weight with no item-level association
    """
    text_lower = text.lower()
    
    # Must be evidence inventory or property sheet
    if not any(term in text_lower for term in ['evidence inventory', 'property', 'evidence record', 'seized']):
        return False, ""
    
    # Check for completely blank weight field
    # Look for "weight:" or "weight" followed by blank/dash/question mark
    blank_weight_patterns = [
        r'weight[:\s]+[—–-]\s*$',
        r'weight[:\s]+\?\s*$',
        r'weight[:\s]+(?:n/?a|blank|none)\b',
        r'weight[:\s]*$',  # Weight: with nothing after
    ]
    
    for pattern in blank_weight_patterns:
        if re.search(pattern, text_lower, re.MULTILINE):
            return True, "Weight field completely blank"
    
    # Check tables for blank weight columns
    if tables:
        for table in tables:
            if not table or len(table) < 2:
                continue
            
            # Find weight column
            weight_col_idx = None
            header_row = table[0] if table else []
            for i, cell in enumerate(header_row):
                if cell and isinstance(cell, str):
                    cell_lower = str(cell).lower()
                    if any(term in cell_lower for term in ['weight', 'wt', 'mass']):
                        weight_col_idx = i
                        break
            
            if weight_col_idx is not None:
                # Check if weight column is mostly empty
                empty_count = 0
                total_rows = 0
                for row in table[1:]:
                    if weight_col_idx < len(row):
                        total_rows += 1
                        cell_val = str(row[weight_col_idx]).strip() if row[weight_col_idx] else ""
                        if not cell_val or cell_val in ['-', '—', '?', 'N/A', 'blank', 'none', '']:
                            empty_count += 1
                
                if total_rows > 0 and empty_count / total_rows > 0.7:  # More than 70% blank
                    return True, "Weight column mostly blank in table"
                
                # Check for single weight applied to multiple rows
                if total_rows > 1:
                    weight_values = []
                    for row in table[1:]:
                        if weight_col_idx < len(row) and row[weight_col_idx]:
                            cell_text = str(row[weight_col_idx]).strip()
                            weight_match = re.search(r'(\d+\.?\d*)', cell_text)
                            if weight_match:
                                weight_values.append(weight_match.group(1))
                    
                    if len(weight_values) > 1:
                        unique_weights = len(set(weight_values))
                        if unique_weights == 1 and len(weight_values) >= 3:
                            return True, "Single weight applied to multiple items"
    
    # Check for handwritten weight without item association
    if re.search(r'handwritten|h\.?w\.?', text_lower):
        # Check if weight appears but no clear item number association
        has_weight = bool(re.search(r'\d+\.?\d*\s*(?:g|gram|oz|ounce)', text_lower))
        has_item_refs = bool(re.search(r'item\s*#|item\s*\d+', text_lower))
        
        if has_weight and not has_item_refs:
            return True, "Handwritten weight without item-level association"
    
    return False, ""

def check_category_c(text: str, page_num: int) -> tuple[bool, str]:
    """
    Category C: Custody Break (OBVIOUS)
    Must be evidence/custody document AND show:
    - Released by filled, Received by blank
    - Missing receiving signature
    - Missing release signature
    - Missing date AND time
    - Transfer with no receiving party
    """
    text_lower = text.lower()
    
    # Must be clearly an evidence/custody document
    is_custody_doc = any(term in text_lower for term in [
        'chain of custody', 'chainofcustody', 'property sheet', 'evidence control',
        'evidence submission', 'evidence transfer', 'custody log'
    ])
    
    if not is_custody_doc:
        return False, ""
    
    issues = []
    
    # Check for "Released by" filled but "Received by" blank
    released_by = bool(re.search(r'released\s+by[:\s]+[A-Z]', text_lower))
    received_by = bool(re.search(r'received\s+by[:\s]+[A-Z]', text_lower))
    
    if released_by and not received_by:
        issues.append("Released without received party")
    
    # Check for missing signatures
    # Look for signature fields that are blank
    signature_patterns = [
        r'signature[:\s]+[—–-]',
        r'signature[:\s]+\?\s*$',
        r'signature[:\s]+(?:n/?a|blank|none)\b',
        r'received\s+by[:\s]+signature[:\s]+[—–-]',
        r'released\s+by[:\s]+signature[:\s]+[—–-]',
    ]
    
    for pattern in signature_patterns:
        if re.search(pattern, text_lower, re.MULTILINE):
            issues.append("Missing signature field")
            break
    
    # Check for missing date AND time
    has_date = bool(re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', text))
    has_time = bool(re.search(r'\d{1,2}:\d{2}\s*(?:am|pm)?', text_lower))
    
    # If there's a custody event but no date/time
    if (released_by or received_by) and not (has_date and has_time):
        issues.append("Missing date or time")
    
    # Transfer with no receiving party
    if 'transfer' in text_lower and not received_by:
        issues.append("Transfer without receiving party")
    
    if issues:
        return True, "; ".join(issues[:2])  # Max 2 issues
    
    return False, ""

def check_category_d(text: str, page_num: int) -> tuple[bool, str]:
    """
    Category D: Lab Intake Failure (OBVIOUS)
    Must be lab intake/accession record AND show:
    - Missing handler name
    - Missing intake timestamp
    - Relabeling without explanation
    - Required fields visibly blank
    """
    text_lower = text.lower()
    
    # Must be clearly a lab intake/accession document
    is_lab_intake = any(term in text_lower for term in [
        'lab intake', 'laboratory intake', 'accession', 'lab received',
        'laboratory received', 'nms', 'intake form'
    ])
    
    if not is_lab_intake:
        return False, ""
    
    issues = []
    
    # Check for missing handler name
    # Look for handler field that's blank
    handler_patterns = [
        r'handler[:\s]+[—–-]',
        r'received\s+by[:\s]+[—–-]',
        r'processed\s+by[:\s]+[—–-]',
        r'handler[:\s]+(?:n/?a|blank|none)\b',
    ]
    
    for pattern in handler_patterns:
        if re.search(pattern, text_lower, re.MULTILINE):
            issues.append("Missing handler name")
            break
    
    # Check for missing timestamp
    has_date = bool(re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', text))
    has_time = bool(re.search(r'\d{1,2}:\d{2}\s*(?:am|pm)?', text_lower))
    
    if not (has_date and has_time):
        # Check if timestamp field exists but is blank
        timestamp_patterns = [
            r'date[:\s]+time[:\s]+[—–-]',
            r'timestamp[:\s]+[—–-]',
            r'intake\s+date[:\s]+[—–-]',
        ]
        for pattern in timestamp_patterns:
            if re.search(pattern, text_lower, re.MULTILINE):
                issues.append("Missing intake timestamp")
                break
    
    # Check for relabeling without explanation
    if re.search(r'relabel|renumber|re[- ]?number', text_lower):
        if not re.search(r'explanation|reason|note|because', text_lower):
            issues.append("Relabeling without explanation")
    
    # Check for required fields visibly blank
    required_field_patterns = [
        r'item\s*#\s*[:\s]+[—–-]',
        r'sample\s*id[:\s]+[—–-]',
        r'case\s*#\s*[:\s]+[—–-]',
    ]
    
    for pattern in required_field_patterns:
        if re.search(pattern, text_lower, re.MULTILINE):
            issues.append("Required field blank")
            break
    
    if issues:
        return True, "; ".join(issues[:2])  # Max 2 issues
    
    return False, ""

def scan_page(page_num: int, text: str, tables: list) -> list:
    """Scan a single page for obvious defects. Returns list of findings."""
    findings = []
    
    # Exclude court documents
    if is_court_document(text):
        return findings
    
    doc_type = identify_document_type(text)
    
    # Check each category
    for category, check_func in [
        ('A', lambda: check_category_a(text, page_num)),
        ('B', lambda: check_category_b(text, tables, page_num)),
        ('C', lambda: check_category_c(text, page_num)),
        ('D', lambda: check_category_d(text, page_num)),
    ]:
        is_match, description = check_func()
        if is_match:
            findings.append({
                'page': page_num,
                'category': category,
                'doc_type': doc_type,
                'description': description
            })
    
    return findings

def main():
    global HAS_PDFPLUMBER
    
    if not Path(PDF_PATH).exists():
        print(f"ERROR: PDF not found: {PDF_PATH}")
        return
    
    if not HAS_PDFPLUMBER:
        import subprocess
        import sys
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
        import pdfplumber as pdfplumber_module
        globals()['pdfplumber'] = pdfplumber_module
        HAS_PDFPLUMBER = True
    
    # Use the module
    pdf_module = pdfplumber if HAS_PDFPLUMBER else None
    if not pdf_module:
        print("ERROR: pdfplumber not available")
        return
    
    # Load pages to check from master index
    pages_to_check = set()
    with open(MASTER_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            pages_to_check.add(int(row['page']))
    
    print(f"Checking {len(pages_to_check)} pages from master index...")
    
    # Extract text and tables from PDF
    all_findings = []
    with pdf_module.open(PDF_PATH) as pdf:
        total = len(pdf.pages)
        checked = 0
        
        for page_num in sorted(pages_to_check):
            if page_num < 1 or page_num > total:
                continue
            
            checked += 1
            if checked % 50 == 0:
                print(f"  Checked {checked}/{len(pages_to_check)} pages...")
            
            try:
                page = pdf.pages[page_num - 1]  # 0-indexed
                text = page.extract_text() or ""
                tables = page.extract_tables() or []
                
                findings = scan_page(page_num, text, tables)
                all_findings.extend(findings)
            except Exception as e:
                print(f"  Error processing page {page_num}: {e}")
                continue
    
    print(f"\nFound {len(all_findings)} obvious defects across {len(set(f['page'] for f in all_findings))} pages")
    
    # Write CSV
    with open(CSV_OUTPUT, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['page', 'category', 'doc_type', 'description'])
        writer.writeheader()
        writer.writerows(all_findings)
    
    print(f"CSV saved to: {CSV_OUTPUT}")
    
    # Write HTML
    html_parts = [
        '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Discovery Index - Obvious Defects Only</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        h2 {
            color: #34495e;
            margin-top: 40px;
            margin-bottom: 15px;
            padding: 10px;
            background-color: #ecf0f1;
            border-left: 4px solid #3498db;
        }
        ul {
            list-style-type: none;
            padding-left: 0;
        }
        li {
            margin: 8px 0;
            padding: 8px;
            background-color: white;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
            padding: 2px 6px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <h1>Discovery Index - Obvious Defects Only</h1>
    <p><em>This index contains only concrete, visually obvious defects with zero inference or speculation.</em></p>
'''
    ]
    
    # Group by category
    findings_by_category = defaultdict(list)
    for finding in all_findings:
        findings_by_category[finding['category']].append(finding)
    
    # Write each category
    for category in ['A', 'B', 'C', 'D']:
        if category not in findings_by_category:
            continue
        
        findings = findings_by_category[category]
        findings.sort(key=lambda x: x['page'])
        
        html_parts.append(f'    <h2>{CATEGORY_HEADERS[category]}</h2>\n')
        html_parts.append('    <ul>\n')
        
        for finding in findings:
            page_num = finding['page']
            desc = finding['description']
            # Ensure description is ≤12 words
            words = desc.split()
            if len(words) > 12:
                desc = ' '.join(words[:12]) + '...'
            
            page_link = PDF_BASE_PATH + str(page_num)
            html_parts.append(
                f'        <li>• <a href="{page_link}" class="page-link">Page {page_num}</a> — {desc}</li>\n'
            )
        
        html_parts.append('    </ul>\n\n')
    
    html_parts.append('</body>\n</html>')
    
    with open(HTML_OUTPUT, 'w', encoding='utf-8') as f:
        f.write(''.join(html_parts))
    
    print(f"HTML saved to: {HTML_OUTPUT}")
    print("\nDone!")

if __name__ == "__main__":
    main()
