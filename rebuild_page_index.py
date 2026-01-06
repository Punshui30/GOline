#!/usr/bin/env python3
"""
Rebuild page index using actual PDF page numbers from footers
"""

import sys
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from collections import defaultdict

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

PDF_PATH = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"

def extract_page_number_from_footer(text: str, internal_page_num: int) -> int:
    """Extract actual page number from PDF footer."""
    # Look for patterns like "427 of 840", "Page 427", "427", etc.
    footer_patterns = [
        r'(\d+)\s+of\s+\d+',  # "427 of 840"
        r'page\s+(\d+)',  # "Page 427"
        r'^(\d+)$',  # Just a number
        r'p\.?\s*(\d+)',  # "p. 427" or "p427"
    ]
    
    # Check last few lines (footer usually at bottom)
    lines = text.split('\n')
    footer_lines = lines[-10:] if len(lines) > 10 else lines
    
    for line in footer_lines:
        for pattern in footer_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                page_num = int(match.group(1))
                # Validate it's reasonable (within expected range)
                if 1 <= page_num <= 1000:
                    return page_num
    
    # Fallback: also check first few lines (some PDFs have page numbers at top)
    header_lines = lines[:10] if len(lines) > 10 else lines
    for line in header_lines:
        for pattern in footer_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                page_num = int(match.group(1))
                if 1 <= page_num <= 1000:
                    return page_num
    
    # If no footer found, use internal page number
    return internal_page_num

def extract_text_pdfplumber(pdf_path: str) -> Dict[int, Tuple[str, int]]:
    """Extract text and actual page numbers from PDF."""
    text_by_page = {}  # internal_page -> (text, actual_page_number)
    print("Extracting text and page numbers from PDF...")
    
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        for i, page in enumerate(pdf.pages, 1):
            if i % 100 == 0:
                print(f"  Processed {i}/{total} pages...")
            try:
                text = page.extract_text() or ""
                actual_page = extract_page_number_from_footer(text, i)
                text_by_page[i] = (text, actual_page)
            except Exception as e:
                text_by_page[i] = ("", i)
    
    return text_by_page

def search_for_items(text: str, actual_page: int) -> List[Dict]:
    """Search for all specified items in text."""
    items = []
    text_lower = text.lower()
    
    # Agency Item #
    agency_patterns = [
        r'(?:agency|agcy)\s*item\s*#[\s:]*([A-Z0-9\-]+)',
        r'(?:agency|agcy)\s*item[\s#:]*([A-Z0-9\-]+)',
    ]
    for pattern in agency_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            items.append({
                "page": actual_page,
                "category": "evidence_handling",
                "text": match.group(0),
                "notes": f"Agency Item #: {match.group(1)}"
            })
    
    # Lab Item #
    lab_item_patterns = [
        r'lab\s*item\s*#[\s:]*(\d+)',
        r'lab\s*item[\s#:]*(\d+)',
    ]
    for pattern in lab_item_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            items.append({
                "page": actual_page,
                "category": "evidence_handling",
                "text": match.group(0),
                "notes": f"Lab Item #: {match.group(1)}"
            })
    
    # FSD Exhibit #
    fsd_patterns = [
        r'fsd\s*exhibit\s*#[\s:]*([A-Z0-9\-]+)',
        r'fsd[\s#]*exhibit[\s#:]*([A-Z0-9\-]+)',
    ]
    for pattern in fsd_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            items.append({
                "page": actual_page,
                "category": "evidence_handling",
                "text": match.group(0),
                "notes": f"FSD Exhibit #: {match.group(1)}"
            })
    
    # Property #
    property_patterns = [
        r'property\s*#[\s:]*([A-Z0-9\-]+)',
        r'property\s*number[\s:]*([A-Z0-9\-]+)',
        r'pr-([A-Z0-9\-]+)',
    ]
    for pattern in property_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            items.append({
                "page": actual_page,
                "category": "evidence_handling",
                "text": match.group(0),
                "notes": f"Property #: {match.group(1)}"
            })
    
    # Weight values
    weight_patterns = [
        r'(\d+\.?\d*)\s*g(?:rams?)?\s*(?:net|gross|\(net\)|\(gross\))',
        r'(\d+\.?\d*)\s*oz(?:\.|ounces?)?',
        r'weight[:\s]*(\d+\.?\d*)\s*g',
        r'(\d+\.?\d*)\s*g\s*[+/]',
        r'net[:\s]*(\d+\.?\d*)\s*g',
        r'gross[:\s]*(\d+\.?\d*)\s*g',
    ]
    for pattern in weight_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            weight_val = match.group(1)
            # Get context
            start = max(0, match.start() - 50)
            end = min(len(text), match.end() + 50)
            context = text[start:end].strip()
            
            # Check if weight is missing
            if "weight" in context.lower() and not weight_val:
                items.append({
                    "page": actual_page,
                    "category": "evidence_handling",
                    "text": context,
                    "notes": "Weight missing or not specified"
                })
            else:
                items.append({
                    "page": actual_page,
                    "category": "evidence_handling",
                    "text": context,
                    "notes": f"Weight: {weight_val}g"
                })
    
    # THC %, THCA %, Total THC %
    thc_patterns = [
        r'(?:total\s+)?thc[:\s]*(\d+\.?\d*)\s*%',
        r'delta[- ]?9[- ]?thc[:\s]*(\d+\.?\d*)\s*%',
        r'thca[:\s]*(\d+\.?\d*)\s*%',
        r'thc-a[:\s]*(\d+\.?\d*)\s*%',
        r'(\d+\.?\d*)\s*%\s*(?:total\s+)?thc',
    ]
    for pattern in thc_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            start = max(0, match.start() - 100)
            end = min(len(text), match.end() + 100)
            context = text[start:end].strip()
            
            items.append({
                "page": actual_page,
                "category": "delta9_quantitation",
                "text": context,
                "notes": f"THC/THCA percentage: {match.group(0)}"
            })
    
    # Unable to quantitate / below reporting limit
    unquant_patterns = [
        r'unable\s+to\s+quantitate',
        r'unable\s+to\s+quantify',
        r'below\s+reporting\s+limit',
        r'below\s+the\s+reporting\s+limit',
        r'not\s+quantitated',
        r'no\s+result.*reported',
    ]
    for pattern in unquant_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            start = max(0, match.start() - 150)
            end = min(len(text), match.end() + 150)
            context = text[start:end].strip()
            
            items.append({
                "page": actual_page,
                "category": "delta9_quantitation",
                "text": context,
                "notes": "Unable to quantitate or below reporting limit"
            })
    
    # Non-statistical sampling
    if re.search(r'non[- ]?statistical\s+sampling', text_lower):
        matches = re.finditer(r'non[- ]?statistical\s+sampling[^.]{0,200}', text, re.IGNORECASE)
        for match in matches:
            items.append({
                "page": actual_page,
                "category": "evidence_handling",
                "text": match.group(0),
                "notes": "Non-statistical sampling language found"
            })
    
    # Chain of custody annotations (handwritten indicators)
    coc_indicators = [
        r'chain\s+of\s+custody',
        r'signature[,\s]+id\s*#',
        r'date\s+time\s+signature',
        r'received\s+by[:\s]+[A-Z]',
        r'transferred\s+to[:\s]+[A-Z]',
    ]
    for pattern in coc_indicators:
        if re.search(pattern, text_lower):
            # Find the section
            match = re.search(pattern, text_lower)
            if match:
                start = max(0, match.start() - 200)
                end = min(len(text), match.end() + 400)
                context = text[start:end].strip()
                
                # Check if it looks like handwritten annotations
                if any(char in context for char in ['/', '-', ':', '\\']) or re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', context):
                    items.append({
                        "page": actual_page,
                        "category": "chain_of_custody",
                        "text": context[:500],
                        "notes": "Chain of custody entry or annotation"
                    })
    
    return items

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
    
    # Extract text and page numbers
    text_by_page = extract_text_pdfplumber(PDF_PATH)
    print(f"\nExtracted {len(text_by_page)} pages\n")
    
    # Search all pages
    print("Searching for specified items...")
    all_items = []
    
    for internal_page, (text, actual_page) in text_by_page.items():
        if internal_page % 100 == 0:
            print(f"  Searched {internal_page}/{len(text_by_page)} pages...")
        
        items = search_for_items(text, actual_page)
        all_items.extend(items)
    
    print(f"\nFound {len(all_items)} items total\n")
    
    # Remove duplicates (same page, same text)
    seen = set()
    unique_items = []
    for item in all_items:
        key = (item['page'], item['text'][:100])  # First 100 chars as key
        if key not in seen:
            seen.add(key)
            unique_items.append(item)
    
    print(f"After deduplication: {len(unique_items)} unique items\n")
    
    # Sort by page number
    unique_items.sort(key=lambda x: x['page'])
    
    # Write JSON output
    json_path = Path("C:/Users/simmo/Desktop/audit/page_index_rebuild.json")
    
    # Create output structure
    output = {
        "total_items": len(unique_items),
        "pages_searched": len(text_by_page),
        "items": unique_items
    }
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"JSON index saved to: {json_path}")
    
    # Also write CSV for easier viewing
    csv_path = Path("C:/Users/simmo/Desktop/audit/page_index_rebuild.csv")
    import csv as csv_module
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv_module.DictWriter(f, fieldnames=['page', 'category', 'text', 'notes'])
        writer.writeheader()
        for item in unique_items:
            writer.writerow({
                'page': item['page'],
                'category': item['category'],
                'text': item['text'][:500],  # Truncate for CSV
                'notes': item['notes']
            })
    
    print(f"CSV index saved to: {csv_path}")
    
    # Summary by category
    by_category = defaultdict(int)
    for item in unique_items:
        by_category[item['category']] += 1
    
    print("\nSummary by category:")
    for cat, count in sorted(by_category.items()):
        print(f"  {cat}: {count} items")
    
    print("\nAnalysis complete!")

if __name__ == "__main__":
    main()

