#!/usr/bin/env python3
"""
Merge Audit Pass #2 and Audit Pass #3 into Master Index
"""

import csv
import re
from pathlib import Path
from typing import List, Dict

PASS2_CSV = r"C:\Users\simmo\Desktop\audit\audit_pass_2_chain_of_custody_issue_mapping.csv"
PASS3_CSV = r"C:\Users\simmo\Desktop\audit\audit_pass_3_weights_indexing.csv"
MASTER_OUTPUT = r"C:\Users\simmo\Desktop\audit\master_discovery_index.csv"
MASTER_TXT = r"C:\Users\simmo\Desktop\audit\master_discovery_index.txt"

def parse_page_range(page_range_str: str) -> List[int]:
    """Parse page range string into list of page numbers.
    
    Examples:
        "p. 309" -> [309]
        "pp. 435–438" -> [435, 436, 437, 438]
        "pp. 641-642" -> [641, 642]
    """
    pages = []
    
    # Single page: "p. 309"
    single_match = re.match(r'p\.\s*(\d+)', page_range_str, re.IGNORECASE)
    if single_match:
        pages.append(int(single_match.group(1)))
        return pages
    
    # Page range: "pp. 435–438" or "pp. 435-438"
    range_match = re.match(r'pp?\.\s*(\d+)[–-]\s*(\d+)', page_range_str, re.IGNORECASE)
    if range_match:
        start = int(range_match.group(1))
        end = int(range_match.group(2))
        pages.extend(range(start, end + 1))
        return pages
    
    # Try to extract just numbers if format is unexpected
    numbers = re.findall(r'\d+', page_range_str)
    if numbers:
        if len(numbers) == 1:
            pages.append(int(numbers[0]))
        elif len(numbers) == 2:
            start, end = int(numbers[0]), int(numbers[1])
            pages.extend(range(start, end + 1))
    
    return pages

def load_pass2_data() -> List[Dict]:
    """Load and expand Pass #2 data (page ranges -> individual pages)."""
    entries = []
    
    with open(PASS2_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            issue_code = row['issue']
            page_range = row['page_range']
            doc_type = row['doc_type']
            description = row['description']
            ocr_confidence = row['ocr_confidence']
            
            # Expand page range
            pages = parse_page_range(page_range)
            
            for page_num in pages:
                entries.append({
                    'page': page_num,
                    'issue_code': issue_code,
                    'doc_type': doc_type,
                    'description': description,
                    'ocr_confidence': ocr_confidence,
                    'source_audit': 'Pass #2'
                })
    
    return entries

def load_pass3_data() -> List[Dict]:
    """Load Pass #3 data (already individual pages)."""
    entries = []
    
    with open(PASS3_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            entries.append({
                'page': int(row['page']),
                'issue_code': row['issue_code'],
                'doc_type': row['doc_type'],
                'description': row['description'],
                'ocr_confidence': row['ocr_confidence'],
                'source_audit': row['source_audit']
            })
    
    return entries

def merge_and_deduplicate(pass2_entries: List[Dict], pass3_entries: List[Dict]) -> List[Dict]:
    """Merge entries and deduplicate by page + issue_code."""
    # Use (page, issue_code) as key to allow same page with different issues
    seen = set()
    merged = []
    
    # Add Pass #2 entries
    for entry in pass2_entries:
        key = (entry['page'], entry['issue_code'])
        if key not in seen:
            seen.add(key)
            merged.append(entry)
    
    # Add Pass #3 entries (may override Pass #2 for same page+issue if more specific)
    for entry in pass3_entries:
        key = (entry['page'], entry['issue_code'])
        if key not in seen:
            seen.add(key)
            merged.append(entry)
        # If already exists, prefer Pass #3 for Issue B (more detailed)
        elif entry['issue_code'] == 'B':
            # Replace the Pass #2 entry with Pass #3 entry
            for i, existing in enumerate(merged):
                if existing['page'] == entry['page'] and existing['issue_code'] == 'B':
                    merged[i] = entry
                    break
    
    # Sort by page number, then by issue code
    merged.sort(key=lambda x: (x['page'], x['issue_code']))
    
    return merged

def write_master_csv(entries: List[Dict]):
    """Write master index CSV."""
    with open(MASTER_OUTPUT, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['page', 'issue_code', 'doc_type', 'description', 'ocr_confidence', 'source_audit']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(entries)

def write_master_txt(entries: List[Dict]):
    """Write master index text file."""
    with open(MASTER_TXT, 'w', encoding='utf-8') as f:
        f.write("MASTER DISCOVERY INDEX\n")
        f.write("=" * 100 + "\n\n")
        f.write("Combined from Audit Pass #2 (Issues A, C, D) and Audit Pass #3 (Issue B)\n\n")
        
        # Group by issue code
        issues = {'A': [], 'B': [], 'C': [], 'D': []}
        for entry in entries:
            issue = entry['issue_code']
            if issue in issues:
                issues[issue].append(entry)
        
        issue_names = {
            'A': 'MULTIPLE EVIDENCE NUMBERING SYSTEMS',
            'B': 'MISSING OR GROUPED WEIGHTS',
            'C': 'INCOMPLETE OR INCONSISTENT EVIDENCE TRANSFERS',
            'D': 'NMS LABORATORY INTAKE AND INTERNAL CUSTODY DEFECTS'
        }
        
        for issue_code in ['A', 'B', 'C', 'D']:
            f.write(f"\nISSUE {issue_code}: {issue_names[issue_code]}\n")
            f.write("-" * 100 + "\n")
            
            if not issues[issue_code]:
                f.write("No instances found.\n\n")
                continue
            
            for entry in issues[issue_code]:
                f.write(f"Page: {entry['page']}\n")
                f.write(f"  Issue Code: {issue_code}\n")
                f.write(f"  Document Type: {entry['doc_type']}\n")
                f.write(f"  Description: {entry['description']}\n")
                f.write(f"  OCR Confidence: {entry['ocr_confidence']}\n")
                f.write(f"  Source Audit: {entry['source_audit']}\n")
                f.write("\n")
        
        # Summary statistics
        f.write("\n" + "=" * 100 + "\n")
        f.write("SUMMARY STATISTICS\n")
        f.write("-" * 100 + "\n")
        f.write(f"Total pages indexed: {len(set(e['page'] for e in entries))}\n")
        f.write(f"Total entries: {len(entries)}\n")
        f.write(f"\nBy Issue Code:\n")
        for issue_code in ['A', 'B', 'C', 'D']:
            count = len(issues[issue_code])
            unique_pages = len(set(e['page'] for e in issues[issue_code]))
            f.write(f"  Issue {issue_code}: {count} entries across {unique_pages} pages\n")
        f.write(f"\nBy Source Audit:\n")
        pass2_count = len([e for e in entries if e['source_audit'] == 'Pass #2'])
        pass3_count = len([e for e in entries if e['source_audit'] == 'Pass #3'])
        f.write(f"  Pass #2: {pass2_count} entries\n")
        f.write(f"  Pass #3: {pass3_count} entries\n")

def main():
    print("Loading Audit Pass #2 data...")
    pass2_entries = load_pass2_data()
    print(f"  Loaded {len(pass2_entries)} entries from Pass #2")
    
    print("\nLoading Audit Pass #3 data...")
    pass3_entries = load_pass3_data()
    print(f"  Loaded {len(pass3_entries)} entries from Pass #3")
    
    print("\nMerging and deduplicating...")
    merged_entries = merge_and_deduplicate(pass2_entries, pass3_entries)
    print(f"  Total merged entries: {len(merged_entries)}")
    
    print("\nWriting master index...")
    write_master_csv(merged_entries)
    print(f"  CSV saved to: {MASTER_OUTPUT}")
    
    write_master_txt(merged_entries)
    print(f"  Text saved to: {MASTER_TXT}")
    
    print("\nMaster index creation complete!")

if __name__ == "__main__":
    main()















