#!/usr/bin/env python3
"""
Refined extraction of cannabis/THC-related evidence items from discovery PDFs.
Focuses ONLY on actual evidence inventory entries, excluding legal text and charges.
"""

import re
import csv
from pathlib import Path
from typing import List, Dict, Optional, Set
import pdfplumber

# Cannabis/THC-related keywords for actual products
CANNABIS_PRODUCT_KEYWORDS = {
    'flower': ['cannabis flower', 'marijuana flower', 'hemp flower', 'thca flower', 
               'cannabis bud', 'marijuana bud', 'plant material', 'cannabis plant'],
    'concentrate': ['concentrate', 'dabs', 'wax', 'shatter', 'rosin', 'distillate',
                    'hash oil', 'hash', 'kief', 'resin', 'extract', 'bho', 'co2'],
    'cartridge': ['cart', 'cartridge', 'vape cart', 'vape cartridge', 'thc cart', 
                  'cannabis cart', '510', 'disposable vape'],
    'edible': ['edible', 'gummy', 'gummies', 'infused', 'chocolate', 'cookie', 'brownie',
               'candy', 'tincture', 'capsule', 'pill', 'lozenge', 'beverage'],
    'preroll': ['preroll', 'pre-roll', 'pre roll', 'joint', 'cigarette', 'blunt'],
}

# Exclusion patterns - legal text, charges, etc.
LEGAL_TEXT_PATTERNS = [
    r'against the peace',
    r'government and dignity',
    r'schedule [il]',
    r'unlawfully did',
    r'controlled dangerous substance',
    r'intent to distribute',
    r'common nuisance',
    r'building for.*illegal',
    r'count\d+',
    r'cr\.\d+',
    r'criminal',
    r'charge',
    r'indictment',
    r'complaint',
]

# Evidence inventory section markers
EVIDENCE_SECTION_MARKERS = [
    r'property\s+list',
    r'evidence\s+list',
    r'inventory',
    r'items?\s+seized',
    r'seized\s+items?',
    r'evidence\s+submission',
    r'chain\s+of\s+custody',
    r'photo\s+log',
    r'evidence\s+log',
    r'property\s+inventory',
]

def extract_text_from_pdf(pdf_path: str) -> Dict[int, str]:
    """Extract text from PDF by page."""
    text_by_page = {}
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                try:
                    text = page.extract_text()
                    text_by_page[page_num + 1] = text or ""
                except Exception as e:
                    text_by_page[page_num + 1] = ""
    except Exception as e:
        print(f"Error reading PDF: {e}")
    return text_by_page

def extract_tables_from_pdf(pdf_path: str) -> Dict[int, List]:
    """Extract tables from PDF by page."""
    tables_by_page = {}
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                try:
                    tables = page.extract_tables()
                    if tables:
                        tables_by_page[page_num + 1] = tables
                except:
                    pass
    except Exception as e:
        print(f"Error extracting tables: {e}")
    return tables_by_page

def is_legal_text(text: str) -> bool:
    """Check if text is legal language/charges, not evidence description."""
    text_lower = text.lower()
    for pattern in LEGAL_TEXT_PATTERNS:
        if re.search(pattern, text_lower):
            return True
    return False

def is_evidence_section(text: str) -> bool:
    """Check if page contains evidence inventory section."""
    text_lower = text.lower()
    for marker in EVIDENCE_SECTION_MARKERS:
        if re.search(marker, text_lower):
            return True
    return False

def is_excluded(text: str) -> bool:
    """Check if entry should be excluded (not cannabis)."""
    exclusion_keywords = [
        'cash', 'currency', 'coin', 'money', 'dollar', 'receipt', 'ledger', 'notebook',
        'phone', 'cell phone', 'mobile', 'dvr', 'register', 'hard drive', 'computer',
        'surveillance', 'camera', 'scale', 'paraphernalia', 'pipe', 'bong', 'grinder',
        'mail', 'document', 'letter', 'envelope', 'empty bag', 'empty jar', 'empty container',
        'packaging material', 'ziploc', 'baggie', 'wrapper', 'label', 'sticker'
    ]
    
    text_lower = text.lower()
    for exclusion in exclusion_keywords:
        if exclusion in text_lower:
            return True
    return False

def categorize_cannabis_item(description: str) -> str:
    """Categorize cannabis item."""
    desc_lower = description.lower()
    
    for category, keywords in CANNABIS_PRODUCT_KEYWORDS.items():
        for keyword in keywords:
            if keyword in desc_lower:
                if category == 'preroll':
                    return 'Preroll'
                elif category == 'flower':
                    return 'Flower'
                elif category == 'concentrate':
                    return 'Concentrate'
                elif category == 'cartridge':
                    return 'Cartridge'
                elif category == 'edible':
                    return 'Edible'
    
    # Check for ambiguous cases
    if any(kw in desc_lower for kw in ['suspected', 'unknown', 'substance', 'material']):
        if 'thc' in desc_lower or 'cannabis' in desc_lower or 'marijuana' in desc_lower:
            return 'Ambiguous'
    
    return 'Unknown'

def extract_evidence_number(text: str) -> Optional[str]:
    """Extract evidence entry number."""
    patterns = [
        r'(?:Evidence|Item|Exhibit|Entry)[\s#:]*([A-Z0-9\-]{1,20})',
        r'\b([E][- ]?\d{2,6})\b',
        r'\b([A-Z]{1,3}[- ]?\d{2,6})\b',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            num = match.group(1).strip()
            # Filter out common false positives
            if not re.match(r'^(count|page|schedule|cr\.)', num, re.IGNORECASE):
                return num
    
    return None

def extract_weight(text: str) -> Optional[float]:
    """Extract weight in grams."""
    patterns = [
        r'(?:weight|wt|mass)[\s:]*(\d+\.?\d*)\s*(?:g|gram|grams)',
        r'\b(\d{1,4}\.?\d{0,2})\s*(?:g|gram|grams)\b',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                weight = float(match.group(1))
                if 0.01 <= weight <= 100000:
                    return weight
            except:
                pass
    
    return None

def extract_location(text: str) -> Optional[str]:
    """Extract location."""
    location_patterns = [
        r'(?:Store|Location|Site|Seized\s+from)[\s#:]*([A-Z0-9\-\s]{1,30})',
        r'\b(Store\s*\d+|Vehicle|Car|Truck|Residence|Home|Apartment|Warehouse)\b',
    ]
    
    for pattern in location_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    
    return None

def is_cannabis_product(description: str) -> bool:
    """Determine if entry describes actual cannabis product."""
    desc_lower = description.lower()
    
    # Exclude legal text
    if is_legal_text(description):
        return False
    
    # Exclude non-cannabis items
    if is_excluded(description):
        return False
    
    # Must contain cannabis-related keywords AND product indicators
    has_cannabis_keyword = any(kw in desc_lower for kw in ['cannabis', 'marijuana', 'thc', 'thca', 'hemp'])
    
    if not has_cannabis_keyword:
        return False
    
    # Must have product indicators (not just legal references)
    product_indicators = [
        'flower', 'bud', 'cart', 'cartridge', 'vape', 'gummy', 'edible', 
        'concentrate', 'wax', 'shatter', 'rosin', 'distillate', 'preroll',
        'joint', 'cigarette', 'bag', 'jar', 'container', 'package', 'gram',
        'g', 'weight', 'wt'
    ]
    
    has_product_indicator = any(ind in desc_lower for ind in product_indicators)
    
    return has_product_indicator

def extract_entries_from_evidence_sections(text_by_page: Dict[int, str]) -> List[Dict]:
    """Extract entries only from pages with evidence inventory sections."""
    entries = []
    evidence_pages = set()
    
    # First pass: identify pages with evidence sections
    for page_num, text in text_by_page.items():
        if is_evidence_section(text):
            evidence_pages.add(page_num)
            # Also check nearby pages (evidence lists often span multiple pages)
            if page_num > 1:
                evidence_pages.add(page_num - 1)
            if page_num < max(text_by_page.keys()):
                evidence_pages.add(page_num + 1)
    
    print(f"  Found evidence inventory sections on {len(evidence_pages)} pages")
    
    # Second pass: extract entries from evidence pages
    for page_num in sorted(evidence_pages):
        text = text_by_page.get(page_num, "")
        if not text:
            continue
        
        lines = text.split('\n')
        current_entry = []
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 5:
                continue
            
            # Skip if it's clearly legal text
            if is_legal_text(line):
                continue
            
            # Check if line contains evidence number or starts new entry
            has_evidence_num = extract_evidence_number(line) is not None
            
            # Check if line contains cannabis product
            if is_cannabis_product(line):
                # Try to get full entry (current line + next few lines if they continue)
                entry_text = line
                entry_num = extract_evidence_number(line)
                
                # Look ahead for continuation
                line_idx = lines.index(line) if line in lines else -1
                if line_idx >= 0:
                    for next_line_idx in range(line_idx + 1, min(line_idx + 5, len(lines))):
                        next_line = lines[next_line_idx].strip()
                        if not next_line:
                            break
                        # Stop if next line starts new entry
                        if extract_evidence_number(next_line) and next_line != line:
                            break
                        # Stop if legal text
                        if is_legal_text(next_line):
                            break
                        entry_text += " " + next_line
                
                if entry_text and is_cannabis_product(entry_text):
                    entries.append({
                        'page': page_num,
                        'entry_number': entry_num or f"Entry-{page_num}-{len(entries)}",
                        'description': entry_text[:300],
                        'full_text': entry_text,
                        'category': categorize_cannabis_item(entry_text),
                        'weight': extract_weight(entry_text),
                        'location': extract_location(entry_text)
                    })
    
    return entries

def extract_entries_from_tables(tables_by_page: Dict[int, List]) -> List[Dict]:
    """Extract entries from evidence tables."""
    entries = []
    
    for page_num, tables in tables_by_page.items():
        for table in tables:
            if not table:
                continue
            
            # Find header row
            header_row = None
            header_cols = {}
            for i, row in enumerate(table):
                if not row:
                    continue
                row_text = ' '.join(str(cell) for cell in row if cell).lower()
                if any(kw in row_text for kw in ['item', 'evidence', 'description', 'weight', 'entry', 'exhibit']):
                    header_row = i
                    # Map column indices
                    for j, cell in enumerate(row):
                        cell_lower = str(cell).lower()
                        if 'item' in cell_lower or 'evidence' in cell_lower or 'exhibit' in cell_lower:
                            header_cols['entry'] = j
                        elif 'description' in cell_lower:
                            header_cols['description'] = j
                        elif 'weight' in cell_lower:
                            header_cols['weight'] = j
                    break
            
            # Process data rows
            for i, row in enumerate(table):
                if not row or i == header_row:
                    continue
                
                # Extract description
                desc_col = header_cols.get('description', 0)
                if desc_col < len(row):
                    description = str(row[desc_col]).strip()
                else:
                    # Fallback: combine all cells
                    description = ' '.join(str(cell) for cell in row if cell).strip()
                
                if not description or len(description) < 5:
                    continue
                
                # Skip legal text
                if is_legal_text(description):
                    continue
                
                if is_cannabis_product(description):
                    # Extract entry number
                    entry_col = header_cols.get('entry', None)
                    entry_num = None
                    if entry_col is not None and entry_col < len(row):
                        entry_num = str(row[entry_col]).strip()
                    
                    if not entry_num:
                        entry_num = extract_evidence_number(description)
                    
                    # Extract weight
                    weight_col = header_cols.get('weight', None)
                    weight = None
                    if weight_col is not None and weight_col < len(row):
                        weight_str = str(row[weight_col]).strip()
                        weight = extract_weight(weight_str)
                    
                    if not weight:
                        weight = extract_weight(description)
                    
                    entries.append({
                        'page': page_num,
                        'entry_number': entry_num or f"Table-{page_num}-Row{i}",
                        'description': description[:300],
                        'full_text': description,
                        'category': categorize_cannabis_item(description),
                        'weight': weight,
                        'location': extract_location(description)
                    })
    
    return entries

def main():
    pdf_path = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
    
    if not Path(pdf_path).exists():
        print(f"ERROR: PDF file not found: {pdf_path}")
        return
    
    print("="*80)
    print("REFINED CANNABIS EVIDENCE INVENTORY EXTRACTION")
    print("="*80)
    print(f"\nProcessing PDF: {Path(pdf_path).name}")
    
    # Extract text and tables
    print("\nStep 1: Extracting text from PDF...")
    text_by_page = extract_text_from_pdf(pdf_path)
    print(f"  Extracted text from {len(text_by_page)} pages")
    
    print("\nStep 2: Extracting tables from PDF...")
    tables_by_page = extract_tables_from_pdf(pdf_path)
    print(f"  Found tables on {len(tables_by_page)} pages")
    
    # Extract entries
    print("\nStep 3: Extracting cannabis evidence from inventory sections...")
    entries_from_sections = extract_entries_from_evidence_sections(text_by_page)
    print(f"  Found {len(entries_from_sections)} entries from evidence sections")
    
    print("\nStep 4: Extracting cannabis evidence from tables...")
    entries_from_tables = extract_entries_from_tables(tables_by_page)
    print(f"  Found {len(entries_from_tables)} entries from tables")
    
    # Combine and deduplicate
    all_entries = entries_from_sections + entries_from_tables
    
    # Remove duplicates
    seen = set()
    unique_entries = []
    for entry in all_entries:
        key = (entry['entry_number'], entry['description'][:50])
        if key not in seen:
            seen.add(key)
            unique_entries.append(entry)
    
    print(f"\n  Total unique cannabis evidence entries: {len(unique_entries)}")
    
    # Categorize
    categories = {}
    for entry in unique_entries:
        cat = entry['category']
        categories[cat] = categories.get(cat, 0) + 1
    
    print("\nStep 5: Categorizing entries...")
    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count} entries")
    
    # Output to CSV
    output_csv = "CANNABIS_EVIDENCE_INVENTORY_REFINED.csv"
    print(f"\nStep 6: Writing results to {output_csv}...")
    
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'Entry_Number', 'Description', 'Category', 'Weight_g', 'Location', 'Page'
        ])
        writer.writeheader()
        
        for entry in sorted(unique_entries, key=lambda x: (x['page'], x['entry_number'])):
            writer.writerow({
                'Entry_Number': entry['entry_number'],
                'Description': entry['description'],
                'Category': entry['category'],
                'Weight_g': entry['weight'] if entry['weight'] else '',
                'Location': entry['location'] if entry['location'] else '',
                'Page': entry['page']
            })
    
    print(f"  Saved {len(unique_entries)} entries to {output_csv}")
    
    # Create summary report
    output_txt = "CANNABIS_EVIDENCE_SUMMARY_REFINED.txt"
    print(f"\nStep 7: Creating summary report: {output_txt}...")
    
    with open(output_txt, 'w', encoding='utf-8') as f:
        f.write("="*80 + "\n")
        f.write("CANNABIS EVIDENCE INVENTORY - REFINED EXTRACTION REPORT\n")
        f.write("="*80 + "\n\n")
        
        f.write(f"Total Cannabis-Related Evidence Entries: {len(unique_entries)}\n\n")
        
        f.write("CATEGORY BREAKDOWN:\n")
        f.write("-"*80 + "\n")
        for cat, count in sorted(categories.items()):
            f.write(f"  {cat}: {count} entries\n")
        f.write("\n")
        
        f.write("DETAILED ENTRIES:\n")
        f.write("-"*80 + "\n\n")
        
        for entry in sorted(unique_entries, key=lambda x: (x['page'], x['entry_number'])):
            f.write(f"Entry Number: {entry['entry_number']}\n")
            f.write(f"Page: {entry['page']}\n")
            f.write(f"Category: {entry['category']}\n")
            f.write(f"Description: {entry['description']}\n")
            if entry['weight']:
                f.write(f"Weight: {entry['weight']} g\n")
            if entry['location']:
                f.write(f"Location: {entry['location']}\n")
            f.write("\n" + "-"*80 + "\n\n")
        
        # Ambiguous entries
        ambiguous = [e for e in unique_entries if e['category'] == 'Ambiguous']
        if ambiguous:
            f.write("\n" + "="*80 + "\n")
            f.write("AMBIGUOUS ENTRIES - REQUIRES HUMAN REVIEW\n")
            f.write("="*80 + "\n\n")
            for entry in ambiguous:
                f.write(f"Entry Number: {entry['entry_number']}\n")
                f.write(f"Page: {entry['page']}\n")
                f.write(f"Description: {entry['description']}\n")
                f.write("\n")
    
    print(f"  Summary report saved to {output_txt}")
    
    print("\n" + "="*80)
    print("EXTRACTION COMPLETE")
    print("="*80)
    print(f"\nTotal cannabis-related evidence entries: {len(unique_entries)}")
    print(f"\nOutput files:")
    print(f"  - {output_csv} (machine-readable table)")
    print(f"  - {output_txt} (detailed summary report)")
    
    if any(e['category'] == 'Ambiguous' for e in unique_entries):
        ambiguous_count = sum(1 for e in unique_entries if e['category'] == 'Ambiguous')
        print(f"\nNOTE: {ambiguous_count} ambiguous entries require human review")

if __name__ == "__main__":
    main()
















