#!/usr/bin/env python3
"""
Optimized chain-of-custody issue mapping - processes pages more efficiently
"""

import sys
import re
from pathlib import Path
from typing import Dict, List

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

PDF_PATH = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"

def extract_text_pdfplumber(pdf_path: str) -> Dict[int, str]:
    """Extract text from PDF - optimized."""
    text_by_page = {}
    print("Extracting text from PDF...")
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        for i, page in enumerate(pdf.pages, 1):
            if i % 200 == 0:
                print(f"  Processed {i}/{total} pages...")
            try:
                text = page.extract_text()
                text_by_page[i] = text or ""
            except:
                text_by_page[i] = ""
    return text_by_page

def assess_ocr_confidence(text: str) -> str:
    """Quick OCR confidence assessment."""
    if not text or len(text.strip()) < 30:
        return "Low"
    
    has_numbers = bool(re.search(r'\d+\.\d+', text))
    has_clean_words = len([w for w in text.split()[:50] if len(w) > 2]) > 10
    
    if has_numbers and has_clean_words:
        return "High"
    elif has_clean_words:
        return "Medium"
    else:
        return "Low"

def identify_document_type(text: str) -> str:
    """Quick document type identification."""
    text_lower = text.lower()
    
    if "evidence inventory" in text_lower or "property record" in text_lower:
        return "Evidence Inventory"
    elif "chain of custody" in text_lower or "chainofcustody" in text_lower:
        return "Chain of Custody"
    elif "lab" in text_lower and ("intake" in text_lower or "accession" in text_lower):
        return "Lab Intake/Accession"
    elif "nms" in text_lower:
        return "NMS Lab Document"
    elif "submission" in text_lower or "transmittal" in text_lower:
        return "Submission/Transmittal Form"
    else:
        return "Unknown Document Type"

def find_issue_a_ranges(text_by_page: Dict[int, str]) -> List[Dict]:
    """ISSUE A: Multiple evidence numbering systems."""
    relevant_pages = []
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Count different numbering systems
        systems = 0
        if re.search(r'(?:agency|agcy)\s*item\s*#', text_lower):
            systems += 1
        if re.search(r'lab\s*item\s*#', text_lower):
            systems += 1
        if re.search(r'property\s*#|pr-', text_lower):
            systems += 1
        if re.search(r'fsd\s*exhibit|exhibit\s*#', text_lower):
            systems += 1
        if re.search(r'barcode|bar\s*code', text_lower):
            systems += 1
        
        if systems >= 2:
            relevant_pages.append({
                'page': page_num,
                'doc_type': identify_document_type(text),
                'confidence': assess_ocr_confidence(text)
            })
    
    # Group into ranges
    ranges = []
    if relevant_pages:
        current_start = relevant_pages[0]['page']
        current_end = relevant_pages[0]['page']
        current_doc = relevant_pages[0]['doc_type']
        current_conf = relevant_pages[0]['confidence']
        
        for i in range(1, len(relevant_pages)):
            p = relevant_pages[i]
            if (p['page'] == current_end + 1 and 
                p['doc_type'] == current_doc and
                p['confidence'] == current_conf):
                current_end = p['page']
            else:
                ranges.append({
                    'page_range': f"pp. {current_start}–{current_end}" if current_start != current_end else f"p. {current_start}",
                    'doc_type': current_doc,
                    'description': "Multiple evidence numbering systems (Agency Item, Lab Item, Property #, FSD Exhibit, Barcodes)",
                    'confidence': current_conf
                })
                current_start = p['page']
                current_end = p['page']
                current_doc = p['doc_type']
                current_conf = p['confidence']
        
        ranges.append({
            'page_range': f"pp. {current_start}–{current_end}" if current_start != current_end else f"p. {current_start}",
            'doc_type': current_doc,
            'description': "Multiple evidence numbering systems (Agency Item, Lab Item, Property #, FSD Exhibit, Barcodes)",
            'confidence': current_conf
        })
    
    return ranges

def find_issue_b_ranges(text_by_page: Dict[int, str]) -> List[Dict]:
    """ISSUE B: Missing or grouped weights."""
    relevant_pages = []
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Must be inventory/property sheet with cannabis
        if not (("evidence inventory" in text_lower or "property record" in text_lower) and
                any(term in text_lower for term in ["cannabis", "marijuana", "thc", "jar", "package"])):
            continue
        
        # Check for weight issues
        has_weight_field = "weight" in text_lower
        has_weight_values = bool(re.search(r'\d+\.?\d*\s*g(?:rams?)?', text_lower))
        
        # Missing weights or blank fields
        if has_weight_field and not has_weight_values:
            relevant_pages.append({
                'page': page_num,
                'doc_type': identify_document_type(text),
                'confidence': assess_ocr_confidence(text)
            })
        elif not has_weight_field:
            # Check if items listed but no weight section
            item_count = len(re.findall(r'item\s*#|item\s*\d+', text_lower))
            if item_count > 0:
                relevant_pages.append({
                    'page': page_num,
                    'doc_type': identify_document_type(text),
                    'confidence': assess_ocr_confidence(text)
                })
    
    # Group into ranges
    ranges = []
    if relevant_pages:
        current_start = relevant_pages[0]['page']
        current_end = relevant_pages[0]['page']
        current_doc = relevant_pages[0]['doc_type']
        current_conf = relevant_pages[0]['confidence']
        
        for i in range(1, len(relevant_pages)):
            p = relevant_pages[i]
            if (p['page'] == current_end + 1 and 
                p['doc_type'] == current_doc and
                p['confidence'] == current_conf):
                current_end = p['page']
            else:
                ranges.append({
                    'page_range': f"pp. {current_start}–{current_end}" if current_start != current_end else f"p. {current_start}",
                    'doc_type': current_doc,
                    'description': "Missing or grouped weights on evidence inventory",
                    'confidence': current_conf
                })
                current_start = p['page']
                current_end = p['page']
                current_doc = p['doc_type']
                current_conf = p['confidence']
        
        ranges.append({
            'page_range': f"pp. {current_start}–{current_end}" if current_start != current_end else f"p. {current_start}",
            'doc_type': current_doc,
            'description': "Missing or grouped weights on evidence inventory",
            'confidence': current_conf
        })
    
    return ranges

def find_issue_c_ranges(text_by_page: Dict[int, str]) -> List[Dict]:
    """ISSUE C: Incomplete evidence transfers."""
    relevant_pages = []
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Must be chain of custody or transfer document
        if not any(term in text_lower for term in ["chain of custody", "chainofcustody", "transfer", "released", "received"]):
            continue
        
        # Check for issues
        has_released = "released" in text_lower
        has_received = "received" in text_lower or "received by" in text_lower
        has_signature = "signature" in text_lower
        has_timestamp = bool(re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', text))
        
        issue_found = False
        issues = []
        
        if has_released and not has_received:
            issue_found = True
            issues.append("released without received")
        if not has_signature:
            issue_found = True
            issues.append("missing signatures")
        if not has_timestamp:
            issue_found = True
            issues.append("missing timestamps")
        
        if issue_found:
            relevant_pages.append({
                'page': page_num,
                'doc_type': identify_document_type(text),
                'confidence': assess_ocr_confidence(text),
                'issues': issues
            })
    
    # Group into ranges
    ranges = []
    if relevant_pages:
        current_start = relevant_pages[0]['page']
        current_end = relevant_pages[0]['page']
        current_doc = relevant_pages[0]['doc_type']
        current_conf = relevant_pages[0]['confidence']
        current_issues = set(relevant_pages[0].get('issues', []))
        
        for i in range(1, len(relevant_pages)):
            p = relevant_pages[i]
            if (p['page'] == current_end + 1 and 
                p['doc_type'] == current_doc and
                p['confidence'] == current_conf):
                current_end = p['page']
                current_issues.update(p.get('issues', []))
            else:
                ranges.append({
                    'page_range': f"pp. {current_start}–{current_end}" if current_start != current_end else f"p. {current_start}",
                    'doc_type': current_doc,
                    'description': f"Incomplete transfers: {', '.join(current_issues)}",
                    'confidence': current_conf
                })
                current_start = p['page']
                current_end = p['page']
                current_doc = p['doc_type']
                current_conf = p['confidence']
                current_issues = set(p.get('issues', []))
        
        ranges.append({
            'page_range': f"pp. {current_start}–{current_end}" if current_start != current_end else f"p. {current_start}",
            'doc_type': current_doc,
            'description': f"Incomplete transfers: {', '.join(current_issues)}",
            'confidence': current_conf
        })
    
    return ranges

def find_issue_d_ranges(text_by_page: Dict[int, str]) -> List[Dict]:
    """ISSUE D: NMS lab intake defects."""
    relevant_pages = []
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Must be NMS or lab intake
        if not (("nms" in text_lower) or 
                any(term in text_lower for term in ["intake", "accession", "laboratory received", "lab received"])):
            continue
        
        # Check for defects
        issues = []
        has_timestamp = bool(re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', text))
        has_handler = bool(re.search(r'(?:handler|received\s+by|processed\s+by)[:\s]+[A-Z]', text_lower))
        
        if not has_timestamp:
            issues.append("missing timestamps")
        if not has_handler:
            issues.append("missing handler names")
        
        # Check for relabeling
        if re.search(r'relabel|renumber|re[- ]?number', text_lower):
            issues.append("relabeling or renumbering")
        
        if issues:
            relevant_pages.append({
                'page': page_num,
                'doc_type': identify_document_type(text),
                'confidence': assess_ocr_confidence(text),
                'issues': issues
            })
    
    # Group into ranges
    ranges = []
    if relevant_pages:
        current_start = relevant_pages[0]['page']
        current_end = relevant_pages[0]['page']
        current_doc = relevant_pages[0]['doc_type']
        current_conf = relevant_pages[0]['confidence']
        current_issues = set(relevant_pages[0].get('issues', []))
        
        for i in range(1, len(relevant_pages)):
            p = relevant_pages[i]
            if (p['page'] == current_end + 1 and 
                p['doc_type'] == current_doc and
                p['confidence'] == current_conf):
                current_end = p['page']
                current_issues.update(p.get('issues', []))
            else:
                ranges.append({
                    'page_range': f"pp. {current_start}–{current_end}" if current_start != current_end else f"p. {current_start}",
                    'doc_type': current_doc,
                    'description': f"Lab intake defects: {', '.join(current_issues)}",
                    'confidence': current_conf
                })
                current_start = p['page']
                current_end = p['page']
                current_doc = p['doc_type']
                current_conf = p['confidence']
                current_issues = set(p.get('issues', []))
        
        ranges.append({
            'page_range': f"pp. {current_start}–{current_end}" if current_start != current_end else f"p. {current_start}",
            'doc_type': current_doc,
            'description': f"Lab intake defects: {', '.join(current_issues)}",
            'confidence': current_conf
        })
    
    return ranges

def main():
    global HAS_PDFPLUMBER
    
    if not Path(PDF_PATH).exists():
        print(f"ERROR: PDF not found: {PDF_PATH}")
        return
    
    if not HAS_PDFPLUMBER:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
        import pdfplumber
        HAS_PDFPLUMBER = True
    
    # Extract text
    text_by_page = extract_text_pdfplumber(PDF_PATH)
    print(f"\nExtracted {len(text_by_page)} pages\n")
    
    # Search for each issue
    print("Searching for ISSUE A...")
    issue_a = find_issue_a_ranges(text_by_page)
    print(f"  Found {len(issue_a)} range(s)\n")
    
    print("Searching for ISSUE B...")
    issue_b = find_issue_b_ranges(text_by_page)
    print(f"  Found {len(issue_b)} range(s)\n")
    
    print("Searching for ISSUE C...")
    issue_c = find_issue_c_ranges(text_by_page)
    print(f"  Found {len(issue_c)} range(s)\n")
    
    print("Searching for ISSUE D...")
    issue_d = find_issue_d_ranges(text_by_page)
    print(f"  Found {len(issue_d)} range(s)\n")
    
    # Write output
    output_path = Path("C:/Users/simmo/Desktop/audit/chain_of_custody_issue_mapping.txt")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("CHAIN-OF-CUSTODY AND EVIDENCE-HANDLING ISSUE MAPPING\n")
        f.write("=" * 100 + "\n\n")
        
        # Issue A
        f.write("ISSUE A: MULTIPLE EVIDENCE NUMBERING SYSTEMS\n")
        f.write("-" * 100 + "\n")
        if issue_a:
            for finding in issue_a:
                f.write(f"1) Issue: A\n")
                f.write(f"2) Page Range: {finding['page_range']}\n")
                f.write(f"3) Document Type: {finding['doc_type']}\n")
                f.write(f"4) Description: {finding['description']}\n")
                f.write(f"5) OCR Confidence: {finding['confidence']}\n\n")
        else:
            f.write("No instances found.\n\n")
        
        # Issue B
        f.write("\nISSUE B: MISSING OR GROUPED WEIGHTS\n")
        f.write("-" * 100 + "\n")
        if issue_b:
            for finding in issue_b:
                f.write(f"1) Issue: B\n")
                f.write(f"2) Page Range: {finding['page_range']}\n")
                f.write(f"3) Document Type: {finding['doc_type']}\n")
                f.write(f"4) Description: {finding['description']}\n")
                f.write(f"5) OCR Confidence: {finding['confidence']}\n\n")
        else:
            f.write("No instances found.\n\n")
        
        # Issue C
        f.write("\nISSUE C: INCOMPLETE OR INCONSISTENT EVIDENCE TRANSFERS\n")
        f.write("-" * 100 + "\n")
        if issue_c:
            for finding in issue_c:
                f.write(f"1) Issue: C\n")
                f.write(f"2) Page Range: {finding['page_range']}\n")
                f.write(f"3) Document Type: {finding['doc_type']}\n")
                f.write(f"4) Description: {finding['description']}\n")
                f.write(f"5) OCR Confidence: {finding['confidence']}\n\n")
        else:
            f.write("No instances found.\n\n")
        
        # Issue D
        f.write("\nISSUE D: NMS LABORATORY INTAKE AND INTERNAL CUSTODY DEFECTS\n")
        f.write("-" * 100 + "\n")
        if issue_d:
            for finding in issue_d:
                f.write(f"1) Issue: D\n")
                f.write(f"2) Page Range: {finding['page_range']}\n")
                f.write(f"3) Document Type: {finding['doc_type']}\n")
                f.write(f"4) Description: {finding['description']}\n")
                f.write(f"5) OCR Confidence: {finding['confidence']}\n\n")
        else:
            f.write("No instances found.\n\n")
    
    print(f"Output saved to: {output_path}")
    
    # CSV output
    csv_path = Path("C:/Users/simmo/Desktop/audit/chain_of_custody_issue_mapping.csv")
    import csv as csv_module
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv_module.DictWriter(f, fieldnames=['issue', 'page_range', 'doc_type', 'description', 'ocr_confidence'])
        writer.writeheader()
        for finding in issue_a:
            row = {k: v for k, v in finding.items() if k != 'issues'}
            row['issue'] = 'A'
            row['ocr_confidence'] = row.pop('confidence', 'Unknown')
            writer.writerow(row)
        for finding in issue_b:
            row = {k: v for k, v in finding.items() if k != 'issues'}
            row['issue'] = 'B'
            row['ocr_confidence'] = row.pop('confidence', 'Unknown')
            writer.writerow(row)
        for finding in issue_c:
            row = {k: v for k, v in finding.items() if k != 'issues'}
            row['issue'] = 'C'
            row['ocr_confidence'] = row.pop('confidence', 'Unknown')
            writer.writerow(row)
        for finding in issue_d:
            row = {k: v for k, v in finding.items() if k != 'issues'}
            row['issue'] = 'D'
            row['ocr_confidence'] = row.pop('confidence', 'Unknown')
            writer.writerow(row)
    
    print(f"CSV saved to: {csv_path}")
    print("\nAnalysis complete!")

if __name__ == "__main__":
    main()

