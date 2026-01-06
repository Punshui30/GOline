#!/usr/bin/env python3
"""
Corrected Item Count and Weight Extraction
ONLY extracts legitimate evidence-related numbers, NOT barcodes, case numbers, or metadata.
"""

import re
from pathlib import Path
import pdfplumber

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF."""
    text_by_page = {}
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                try:
                    text = page.extract_text()
                    text_by_page[page_num + 1] = text or ""
                except:
                    text_by_page[page_num + 1] = ""
    except Exception as e:
        print(f"Error reading PDF: {e}")
    return text_by_page

def find_case_number_202500044777(text_by_page):
    """Find where the number 202500044777 appears and what context it's in."""
    print("\n" + "="*80)
    print("INVESTIGATING NUMBER 202500044777")
    print("="*80)
    
    found_locations = []
    for page_num, text in text_by_page.items():
        if not text:
            continue
        
        # Search for the exact number
        if '202500044777' in text:
            # Get context around it
            idx = text.find('202500044777')
            start = max(0, idx - 200)
            end = min(len(text), idx + len('202500044777') + 200)
            context = text[start:end].replace('\n', ' ')
            
            found_locations.append({
                'page': page_num,
                'context': context,
                'position': idx
            })
    
    return found_locations

def extract_legitimate_item_counts(text_by_page):
    """Extract ONLY legitimate item counts that appear with evidence-related terms."""
    print("\n" + "="*80)
    print("EXTRACTING LEGITIMATE ITEM COUNTS")
    print("="*80)
    
    # Patterns that MUST include evidence-related keywords
    legitimate_patterns = [
        # "Total items: 5" or "Total: 5 items"
        r'(?:total|number of|count of)\s+(?:items?|bags?|containers?|packages?|samples?|pieces?)[\s:]*(\d{1,4})\b',
        # "5 items seized" or "5 items collected"
        r'(\d{1,4})\s+(?:items?|bags?|containers?|packages?|samples?|pieces?)\s+(?:seized|collected|submitted|received|inventory|evidence)',
        # "Items seized: 5" or "Items: 5"
        r'(?:items?|bags?|containers?|packages?)[\s:]*(\d{1,4})\s*(?:seized|collected|submitted|total)',
    ]
    
    found_counts = []
    
    for page_num, text in text_by_page.items():
        if not text:
            continue
        
        for pattern in legitimate_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    count = int(match.group(1))
                    # Reasonable range: 1 to 10,000 items
                    if 1 <= count <= 10000:
                        # Get context
                        start = max(0, match.start() - 150)
                        end = min(len(text), match.end() + 150)
                        context = text[start:end].replace('\n', ' ')
                        
                        found_counts.append({
                            'page': page_num,
                            'count': count,
                            'context': context,
                            'pattern': pattern
                        })
                except:
                    pass
    
    return found_counts

def extract_legitimate_weights(text_by_page):
    """Extract ONLY legitimate weight measurements."""
    print("\n" + "="*80)
    print("EXTRACTING LEGITIMATE WEIGHT MEASUREMENTS")
    print("="*80)
    
    # Weight patterns that MUST include weight-related terms
    weight_patterns = [
        # "Weight: 5.2 g" or "Weight 5.2 grams"
        r'(?:weight|mass|net\s*weight|gross\s*weight|approximate\s*weight|total\s*weight)[\s:]*(\d+\.?\d*)\s*(?:g|gram|grams|kg|kilogram)',
        # "5.2 g" or "5.2 grams" (standalone, but must be reasonable)
        r'\b(\d{1,4}\.?\d{0,2})\s*(?:g|gram|grams)\b',
        # "Total: 5.2 g" or "Total weight: 5.2 g"
        r'total[\s:]*(\d+\.?\d*)\s*(?:g|gram|grams)',
    ]
    
    found_weights = []
    
    for page_num, text in text_by_page.items():
        if not text:
            continue
        
        for pattern in weight_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    weight_val = float(match.group(1))
                    # Reasonable range: 0.01 g to 100,000 g (100 kg)
                    if 0.01 <= weight_val <= 100000:
                        # Get context
                        start = max(0, match.start() - 150)
                        end = min(len(text), match.end() + 150)
                        context = text[start:end].replace('\n', ' ')
                        
                        found_weights.append({
                            'page': page_num,
                            'weight': weight_val,
                            'unit': 'g',
                            'context': context
                        })
                except:
                    pass
    
    return found_weights

def search_for_total_items_seized(text_by_page):
    """Search specifically for "Total Items Seized" or similar explicit statements."""
    print("\n" + "="*80)
    print("SEARCHING FOR EXPLICIT 'TOTAL ITEMS SEIZED' STATEMENTS")
    print("="*80)
    
    explicit_patterns = [
        r'total\s+items?\s+seized',
        r'items?\s+seized[\s:]*total',
        r'total\s+number\s+of\s+items?\s+seized',
        r'items?\s+seized[\s:]*(\d+)',
    ]
    
    found_statements = []
    
    for page_num, text in text_by_page.items():
        if not text:
            continue
        
        for pattern in explicit_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                start = max(0, match.start() - 200)
                end = min(len(text), match.end() + 200)
                context = text[start:end].replace('\n', ' ')
                
                found_statements.append({
                    'page': page_num,
                    'match': match.group(0),
                    'context': context
                })
    
    return found_statements

def main():
    pdf_path = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
    
    if not Path(pdf_path).exists():
        print(f"ERROR: PDF file not found: {pdf_path}")
        return
    
    print("="*80)
    print("CORRECTED ITEM COUNT AND WEIGHT EXTRACTION")
    print("="*80)
    
    # Extract text
    print("\nExtracting text from PDF...")
    text_by_page = extract_text_from_pdf(pdf_path)
    print(f"Extracted text from {len(text_by_page)} pages")
    
    # 1. Find where 202500044777 came from
    locations = find_case_number_202500044777(text_by_page)
    print(f"\nFound '202500044777' on {len(locations)} pages:")
    for loc in locations:
        print(f"\n  Page {loc['page']}:")
        print(f"  Context: ...{loc['context']}...")
    
    # 2. Search for explicit "Total Items Seized" statements
    explicit_statements = search_for_total_items_seized(text_by_page)
    print(f"\nFound {len(explicit_statements)} explicit 'Total Items Seized' statements:")
    for stmt in explicit_statements:
        print(f"\n  Page {stmt['page']}:")
        print(f"  Match: {stmt['match']}")
        print(f"  Context: ...{stmt['context']}...")
    
    # 3. Extract legitimate item counts
    item_counts = extract_legitimate_item_counts(text_by_page)
    print(f"\nFound {len(item_counts)} legitimate item count mentions:")
    unique_counts = {}
    for item in item_counts:
        count = item['count']
        if count not in unique_counts:
            unique_counts[count] = []
        unique_counts[count].append(item['page'])
    
    print("\nUnique item counts found:")
    for count in sorted(unique_counts.keys()):
        pages = unique_counts[count]
        print(f"  {count} items: pages {', '.join(map(str, pages[:10]))}" + 
              (f" (and {len(pages)-10} more)" if len(pages) > 10 else ""))
    
    # 4. Extract legitimate weights
    weights = extract_legitimate_weights(text_by_page)
    print(f"\nFound {len(weights)} legitimate weight measurements")
    
    # Generate corrected report
    print("\n" + "="*80)
    print("GENERATING CORRECTED REPORT")
    print("="*80)
    
    report_lines = []
    report_lines.append("="*80)
    report_lines.append("CORRECTED ITEM COUNT AND WEIGHT EXTRACTION REPORT")
    report_lines.append("="*80)
    report_lines.append("")
    
    report_lines.append("ERROR ANALYSIS:")
    report_lines.append("-"*80)
    report_lines.append("The number 202500044777 was INCORRECTLY extracted as an item count.")
    report_lines.append("This number is actually a CASE NUMBER, not an item count.")
    report_lines.append("")
    report_lines.append("Where it appears:")
    for loc in locations:
        report_lines.append(f"  Page {loc['page']}: {loc['context'][:200]}...")
    report_lines.append("")
    report_lines.append("CONCLUSION: This was a CASE NUMBER, not an item count.")
    report_lines.append("")
    
    report_lines.append("EXPLICIT 'TOTAL ITEMS SEIZED' SEARCH:")
    report_lines.append("-"*80)
    if explicit_statements:
        report_lines.append(f"Found {len(explicit_statements)} explicit statements:")
        for stmt in explicit_statements:
            report_lines.append(f"  Page {stmt['page']}: {stmt['match']}")
            report_lines.append(f"    Context: ...{stmt['context'][:150]}...")
    else:
        report_lines.append("NO explicit 'Total Items Seized' statements found in the PDF.")
    report_lines.append("")
    
    report_lines.append("LEGITIMATE ITEM COUNTS FOUND:")
    report_lines.append("-"*80)
    if item_counts:
        for count in sorted(unique_counts.keys()):
            pages = unique_counts[count]
            report_lines.append(f"  {count} items: found on pages {', '.join(map(str, pages))}")
            # Show first context
            first_item = next(item for item in item_counts if item['count'] == count)
            report_lines.append(f"    Example context: ...{first_item['context'][:150]}...")
    else:
        report_lines.append("  NO legitimate item counts found in the PDF.")
    report_lines.append("")
    
    report_lines.append("LEGITIMATE WEIGHT MEASUREMENTS:")
    report_lines.append("-"*80)
    if weights:
        # Group by similar weights
        weight_ranges = {}
        for w in weights[:50]:  # First 50
            weight_val = w['weight']
            rounded = round(weight_val, 1)
            if rounded not in weight_ranges:
                weight_ranges[rounded] = []
            weight_ranges[rounded].append(w['page'])
        
        report_lines.append(f"Found {len(weights)} weight measurements")
        report_lines.append("Sample weights (first 20 unique values):")
        for weight_val in sorted(weight_ranges.keys())[:20]:
            pages = weight_ranges[weight_val]
            report_lines.append(f"  {weight_val} g: pages {', '.join(map(str, pages[:5]))}" + 
                              (f" (and {len(pages)-5} more)" if len(pages) > 5 else ""))
    else:
        report_lines.append("  NO legitimate weight measurements found.")
    report_lines.append("")
    
    report_lines.append("="*80)
    report_lines.append("CORRECTED SUMMARY")
    report_lines.append("="*80)
    report_lines.append("")
    report_lines.append("TOTAL ITEMS SEIZED:")
    if explicit_statements:
        report_lines.append("  Found explicit statements (see above for details)")
    elif unique_counts:
        max_count = max(unique_counts.keys())
        report_lines.append(f"  Maximum item count mentioned: {max_count} items")
        report_lines.append("  NOTE: This is the maximum count found, not necessarily the total seized.")
    else:
        report_lines.append("  UNABLE TO DETERMINE - No explicit 'Total Items Seized' value found")
        report_lines.append("  No legitimate item counts found in evidence-related context")
    report_lines.append("")
    
    report_lines.append("PREVIOUS ERROR:")
    report_lines.append("  The number 202500044777 was INCORRECTLY reported as 'Total Items Seized'")
    report_lines.append("  This was actually a CASE NUMBER, not an item count")
    report_lines.append("  It appears on pages: " + ", ".join(str(loc['page']) for loc in locations))
    report_lines.append("")
    
    report = '\n'.join(report_lines)
    
    # Save report
    output_file = "CORRECTED_ITEM_COUNT_EXTRACTION.txt"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\nCorrected report saved to: {output_file}")
    print("\n" + "="*80)

if __name__ == "__main__":
    main()
















