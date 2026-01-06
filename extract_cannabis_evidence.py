#!/usr/bin/env python3
"""
Extract and analyze cannabis/THC-related evidence items from discovery PDFs.
Identifies ONLY entries that represent cannabis or suspected THC-containing products.
"""

import re
import csv
from pathlib import Path
from typing import List, Dict, Optional
import pdfplumber

# Cannabis/THC-related keywords
CANNABIS_KEYWORDS = {
    'flower': ['cannabis', 'marijuana', 'marihuana', 'flower', 'bud', 'buds', 'plant material', 
               'thca', 'thc-a', 'hemp flower', 'cannabis flower'],
    'concentrate': ['concentrate', 'concentrated', 'dabs', 'wax', 'shatter', 'rosin', 'distillate',
                    'oil', 'hash', 'kief', 'keef', 'resin', 'extract', 'bho', 'co2'],
    'cartridge': ['cart', 'cartridge', 'vape', 'vape cart', 'vape cartridge', 'thc cart', 
                  'cannabis cart', '510', 'disposable vape'],
    'edible': ['edible', 'gummy', 'gummies', 'infused', 'chocolate', 'cookie', 'brownie',
               'candy', 'tincture', 'capsule', 'pill', 'lozenge', 'beverage', 'drink'],
    'preroll': ['preroll', 'pre-roll', 'pre roll', 'joint', 'cigarette', 'blunt', 'roll'],
    'unknown': ['suspected', 'unknown', 'substance', 'material', 'sample']
}

# Exclusion keywords - items that are NOT cannabis samples
EXCLUSION_KEYWORDS = [
    'cash', 'currency', 'coin', 'money', 'dollar', 'receipt', 'ledger', 'notebook',
    'phone', 'cell phone', 'mobile', 'dvr', 'register', 'hard drive', 'computer',
    'surveillance', 'camera', 'scale', 'paraphernalia', 'pipe', 'bong', 'grinder',
    'mail', 'document', 'letter', 'envelope', 'empty bag', 'empty jar', 'empty container',
    'packaging material', 'ziploc', 'baggie', 'wrapper', 'label', 'sticker'
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
                    print(f"Warning: Could not extract text from page {page_num + 1}: {e}")
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
                except Exception as e:
                    print(f"Warning: Could not extract tables from page {page_num + 1}: {e}")
    except Exception as e:
        print(f"Error extracting tables from PDF: {e}")
    return tables_by_page

def is_excluded(text: str) -> bool:
    """Check if entry should be excluded (not cannabis)."""
    text_lower = text.lower()
    for exclusion in EXCLUSION_KEYWORDS:
        if exclusion in text_lower:
            return True
    return False

def categorize_cannabis_item(description: str) -> str:
    """Categorize cannabis item: Flower, Concentrate, Cartridge, Edible, Preroll, Unknown."""
    desc_lower = description.lower()
    
    # Check each category
    for category, keywords in CANNABIS_KEYWORDS.items():
        if category == 'unknown':
            continue
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
        return 'Ambiguous'
    
    return 'Unknown'

def extract_evidence_number(text: str) -> Optional[str]:
    """Extract evidence entry number from text."""
    # Common patterns: E-123, E123, Evidence #123, Item #123, Exhibit #123
    patterns = [
        r'(?:Evidence|Item|Exhibit|Entry)[\s#:]*([A-Z0-9\-]{1,20})',
        r'\b([E][- ]?\d{2,6})\b',
        r'\b([A-Z]{1,3}[- ]?\d{2,6})\b',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    
    return None

def extract_weight(text: str) -> Optional[float]:
    """Extract weight in grams from text."""
    # Patterns: "5.2 g", "5.2 grams", "Weight: 5.2 g"
    patterns = [
        r'(?:weight|wt|mass)[\s:]*(\d+\.?\d*)\s*(?:g|gram|grams)',
        r'\b(\d{1,4}\.?\d{0,2})\s*(?:g|gram|grams)\b',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                weight = float(match.group(1))
                if 0.01 <= weight <= 100000:  # Reasonable range
                    return weight
            except:
                pass
    
    return None

def extract_location(text: str) -> Optional[str]:
    """Extract location (Store 1, Store 2, Vehicle, etc.) from text."""
    location_patterns = [
        r'(?:Store|Location|Site|Seized\s+from)[\s#:]*([A-Z0-9\-\s]{1,30})',
        r'\b(Store\s*\d+|Vehicle|Car|Truck|Residence|Home|Apartment|Warehouse)\b',
    ]
    
    for pattern in location_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    
    return None

def is_cannabis_related(description: str) -> bool:
    """Determine if an entry is cannabis/THC-related."""
    desc_lower = description.lower()
    
    # Check exclusion first
    if is_excluded(description):
        return False
    
    # Check for cannabis keywords
    all_cannabis_keywords = []
    for keywords in CANNABIS_KEYWORDS.values():
        all_cannabis_keywords.extend(keywords)
    
    for keyword in all_cannabis_keywords:
        if keyword in desc_lower:
            return True
    
    # Check for THC mentions
    if re.search(r'\bthc\b', desc_lower):
        return True
    
    # Check for plant material in containers
    if 'plant material' in desc_lower and any(kw in desc_lower for kw in ['jar', 'bag', 'container', 'package']):
        return True
    
    return False

def extract_evidence_entries_from_text(text_by_page: Dict[int, str]) -> List[Dict]:
    """Extract evidence entries from text content."""
    entries = []
    
    # Look for evidence lists, property lists, inventory sections
    evidence_section_patterns = [
        r'(?:Evidence|Property|Items?|Inventory)[\s\w]*[:]?\s*\n',
        r'(?:Item|Entry|Evidence|Exhibit)[\s#:]*\d+',
    ]
    
    for page_num, text in text_by_page.items():
        if not text:
            continue
        
        # Split text into potential entries (lines or sections)
        lines = text.split('\n')
        
        current_entry = None
        entry_buffer = []
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            
            # Check if this line starts a new evidence entry
            if re.search(r'(?:Item|Entry|Evidence|Exhibit)[\s#:]*\d+', line, re.IGNORECASE):
                # Save previous entry if exists
                if current_entry and entry_buffer:
                    entry_text = ' '.join(entry_buffer)
                    if is_cannabis_related(entry_text):
                        entries.append({
                            'page': page_num,
                            'entry_number': extract_evidence_number(entry_text) or f"Entry-{page_num}-{len(entries)}",
                            'description': entry_text[:200],  # Limit description length
                            'full_text': entry_text,
                            'category': categorize_cannabis_item(entry_text),
                            'weight': extract_weight(entry_text),
                            'location': extract_location(entry_text)
                        })
                
                # Start new entry
                current_entry = line
                entry_buffer = [line]
            elif current_entry:
                # Continue current entry
                entry_buffer.append(line)
            elif is_cannabis_related(line):
                # Standalone cannabis-related line
                entries.append({
                    'page': page_num,
                    'entry_number': extract_evidence_number(line) or f"Entry-{page_num}-{len(entries)}",
                    'description': line[:200],
                    'full_text': line,
                    'category': categorize_cannabis_item(line),
                    'weight': extract_weight(line),
                    'location': extract_location(line)
                })
    
    return entries

def extract_evidence_entries_from_tables(tables_by_page: Dict[int, List]) -> List[Dict]:
    """Extract evidence entries from tables."""
    entries = []
    
    for page_num, tables in tables_by_page.items():
        for table in tables:
            if not table:
                continue
            
            # Try to identify header row
            header_row = None
            for i, row in enumerate(table):
                if not row:
                    continue
                row_text = ' '.join(str(cell) for cell in row if cell).lower()
                if any(kw in row_text for kw in ['item', 'evidence', 'description', 'weight', 'entry']):
                    header_row = i
                    break
            
            # Process table rows
            for i, row in enumerate(table):
                if not row or i == header_row:
                    continue
                
                # Combine all cells into description
                row_text = ' '.join(str(cell) for cell in row if cell).strip()
                
                if not row_text or len(row_text) < 5:
                    continue
                
                if is_cannabis_related(row_text):
                    entries.append({
                        'page': page_num,
                        'entry_number': extract_evidence_number(row_text) or f"Table-{page_num}-Row{i}",
                        'description': row_text[:200],
                        'full_text': row_text,
                        'category': categorize_cannabis_item(row_text),
                        'weight': extract_weight(row_text),
                        'location': extract_location(row_text)
                    })
    
    return entries

def main():
    # PDF path
    pdf_path = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
    
    if not Path(pdf_path).exists():
        print(f"ERROR: PDF file not found: {pdf_path}")
        print("Please ensure the PDF is in the Downloads folder.")
        return
    
    print("="*80)
    print("CANNABIS EVIDENCE INVENTORY EXTRACTION")
    print("="*80)
    print(f"\nProcessing PDF: {Path(pdf_path).name}")
    
    # Extract text and tables
    print("\nStep 1: Extracting text from PDF...")
    text_by_page = extract_text_from_pdf(pdf_path)
    print(f"  Extracted text from {len(text_by_page)} pages")
    
    print("\nStep 2: Extracting tables from PDF...")
    tables_by_page = extract_tables_from_pdf(pdf_path)
    print(f"  Found tables on {len(tables_by_page)} pages")
    
    # Extract evidence entries
    print("\nStep 3: Identifying cannabis-related evidence entries...")
    entries_from_text = extract_evidence_entries_from_text(text_by_page)
    print(f"  Found {len(entries_from_text)} entries from text")
    
    entries_from_tables = extract_evidence_entries_from_tables(tables_by_page)
    print(f"  Found {len(entries_from_tables)} entries from tables")
    
    # Combine and deduplicate
    all_entries = entries_from_text + entries_from_tables
    
    # Remove duplicates based on entry number and description
    seen = set()
    unique_entries = []
    for entry in all_entries:
        key = (entry['entry_number'], entry['description'][:50])
        if key not in seen:
            seen.add(key)
            unique_entries.append(entry)
    
    print(f"\n  Total unique cannabis-related entries: {len(unique_entries)}")
    
    # Categorize
    categories = {}
    for entry in unique_entries:
        cat = entry['category']
        categories[cat] = categories.get(cat, 0) + 1
    
    print("\nStep 4: Categorizing entries...")
    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count} entries")
    
    # Output to CSV
    output_csv = "CANNABIS_EVIDENCE_INVENTORY.csv"
    print(f"\nStep 5: Writing results to {output_csv}...")
    
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
    output_txt = "CANNABIS_EVIDENCE_SUMMARY.txt"
    print(f"\nStep 6: Creating summary report: {output_txt}...")
    
    with open(output_txt, 'w', encoding='utf-8') as f:
        f.write("="*80 + "\n")
        f.write("CANNABIS EVIDENCE INVENTORY - SUMMARY REPORT\n")
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
        
        # Ambiguous entries section
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
    print(f"\nTotal cannabis-related evidence entries identified: {len(unique_entries)}")
    print(f"\nOutput files:")
    print(f"  - {output_csv} (machine-readable table)")
    print(f"  - {output_txt} (detailed summary report)")
    
    if any(e['category'] == 'Ambiguous' for e in unique_entries):
        ambiguous_count = sum(1 for e in unique_entries if e['category'] == 'Ambiguous')
        print(f"\nWARNING: {ambiguous_count} ambiguous entries require human review")

if __name__ == "__main__":
    main()
















