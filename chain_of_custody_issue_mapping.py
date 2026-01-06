#!/usr/bin/env python3
"""
Map approximate page ranges for chain-of-custody and evidence-handling issues
"""

import sys
import re
from pathlib import Path
from typing import Dict, List, Tuple, Set
from collections import defaultdict

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

PDF_PATH = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"

def extract_text_pdfplumber(pdf_path: str) -> Dict[int, str]:
    """Extract text from PDF."""
    text_by_page = {}
    print("Extracting text from PDF...")
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

def assess_ocr_confidence(text: str) -> str:
    """Assess OCR confidence based on text quality."""
    if not text or len(text.strip()) < 50:
        return "Low"
    
    # Check for machine-readable patterns
    has_structured = bool(re.search(r'\d+\.\d+', text))  # Numbers with decimals
    has_tables = bool(re.search(r'\d+\s+\d+\s+\d+', text))  # Tabular data
    has_clean_words = len([w for w in text.split() if len(w) > 2 and w.isalnum()]) > 20
    
    # Check for OCR artifacts
    has_artifacts = bool(re.search(r'[^\w\s\.\,\:\;\!\?\-\(\)\/]{3,}', text))  # Strange characters
    has_gibberish = len([c for c in text if ord(c) > 127]) > len(text) * 0.1  # Non-ASCII
    
    if has_structured and has_tables and has_clean_words and not has_artifacts:
        return "High"
    elif has_clean_words and not has_gibberish:
        return "Medium"
    else:
        return "Low"

def identify_document_type(text: str) -> str:
    """Identify the type of document based on content."""
    text_lower = text.lower()
    
    if "evidence inventory" in text_lower or "property record" in text_lower:
        return "Evidence Inventory"
    elif "chain of custody" in text_lower or "chainofcustody" in text_lower:
        return "Chain of Custody"
    elif "lab" in text_lower and ("intake" in text_lower or "accession" in text_lower):
        return "Lab Intake/Accession"
    elif "submission" in text_lower or "transmittal" in text_lower:
        return "Submission/Transmittal Form"
    elif "property" in text_lower and "log" in text_lower:
        return "Property Log"
    elif "nms" in text_lower or "maryland state police" in text_lower:
        return "Laboratory Report"
    elif "search warrant" in text_lower:
        return "Search Warrant"
    else:
        return "Unknown Document Type"

def find_issue_a_multiple_numbering(text_by_page: Dict[int, str]) -> List[Dict]:
    """ISSUE A: Multiple evidence numbering systems."""
    findings = []
    current_range_start = None
    current_range_pages = []
    current_doc_type = None
    current_confidence = None
    
    for page_num in sorted(text_by_page.keys()):
        text = text_by_page[page_num]
        text_lower = text.lower()
        
        # Check for multiple numbering systems
        numbering_systems_found = []
        
        if re.search(r'(?:agency|agcy)\s*item\s*#', text_lower):
            numbering_systems_found.append("Agency Item")
        if re.search(r'lab\s*item\s*#', text_lower):
            numbering_systems_found.append("Lab Item")
        if re.search(r'property\s*#|pr-', text_lower):
            numbering_systems_found.append("Property Number")
        if re.search(r'fsd\s*exhibit|exhibit\s*#', text_lower):
            numbering_systems_found.append("FSD Exhibit")
        if re.search(r'barcode|bar\s*code', text_lower):
            numbering_systems_found.append("Barcode")
        
        # If multiple systems found, this is relevant
        if len(numbering_systems_found) >= 2:
            doc_type = identify_document_type(text)
            confidence = assess_ocr_confidence(text)
            
            # Check if we can continue a range
            if (current_range_start and 
                page_num == current_range_pages[-1] + 1 and
                doc_type == current_doc_type and
                confidence == current_confidence):
                current_range_pages.append(page_num)
            else:
                # Save previous range if exists
                if current_range_start:
                    findings.append({
                        'page_range': f"pp. {current_range_start}–{current_range_pages[-1]}",
                        'doc_type': current_doc_type,
                        'description': f"Multiple numbering systems: {', '.join(set(numbering_systems_found))}",
                        'confidence': current_confidence
                    })
                
                # Start new range
                current_range_start = page_num
                current_range_pages = [page_num]
                current_doc_type = doc_type
                current_confidence = confidence
    
    # Save final range
    if current_range_start:
        findings.append({
            'page_range': f"pp. {current_range_start}–{current_range_pages[-1]}" if len(current_range_pages) > 1 else f"p. {current_range_start}",
            'doc_type': current_doc_type,
            'description': "Multiple numbering systems present",
            'confidence': current_confidence
        })
    
    return findings

def find_issue_b_missing_weights(text_by_page: Dict[int, str]) -> List[Dict]:
    """ISSUE B: Missing or grouped weights."""
    findings = []
    ranges = []
    
    for page_num in sorted(text_by_page.keys()):
        text = text_by_page[page_num]
        text_lower = text.lower()
        
        # Check if this is an evidence inventory or property sheet
        is_inventory = any(term in text_lower for term in [
            "evidence inventory", "property record", "property log", 
            "evidence record", "inventory"
        ])
        
        if not is_inventory:
            continue
        
        # Check for cannabis/THC items
        has_cannabis = any(term in text_lower for term in [
            "cannabis", "marijuana", "thc", "jar", "package", "gummy"
        ])
        
        if not has_cannabis:
            continue
        
        # Check for missing weights
        has_weight_field = "weight" in text_lower
        has_weight_values = bool(re.search(r'\d+\.?\d*\s*g(?:rams?)?', text_lower))
        
        # Check for blank weight fields
        weight_blank = False
        if has_weight_field:
            # Look for patterns like "Weight: " or "Weight:" with nothing after
            if re.search(r'weight[:\s]+$|weight[:\s]+\s*$', text_lower, re.MULTILINE):
                weight_blank = True
            # Or weight field exists but no values for cannabis items
            if has_weight_field and not has_weight_values and has_cannabis:
                weight_blank = True
        
        # Check for grouped weights (single weight for multiple items)
        if has_weight_values:
            # Count items vs weights
            item_matches = len(re.findall(r'item\s*#|item\s*\d+', text_lower))
            weight_matches = len(re.findall(r'\d+\.?\d*\s*g', text_lower))
            if item_matches > weight_matches and item_matches > 1:
                weight_blank = True  # Grouped weights
        
        if weight_blank or (has_cannabis and not has_weight_values):
            doc_type = identify_document_type(text)
            confidence = assess_ocr_confidence(text)
            
            ranges.append({
                'page': page_num,
                'doc_type': doc_type,
                'confidence': confidence
            })
    
    # Group consecutive pages into ranges
    if ranges:
        current_start = ranges[0]['page']
        current_end = ranges[0]['page']
        current_doc = ranges[0]['doc_type']
        current_conf = ranges[0]['confidence']
        
        for i in range(1, len(ranges)):
            if (ranges[i]['page'] == current_end + 1 and 
                ranges[i]['doc_type'] == current_doc and
                ranges[i]['confidence'] == current_conf):
                current_end = ranges[i]['page']
            else:
                findings.append({
                    'page_range': f"pp. {current_start}–{current_end}" if current_start != current_end else f"p. {current_start}",
                    'doc_type': current_doc,
                    'description': "Missing or grouped weights on evidence inventory",
                    'confidence': current_conf
                })
                current_start = ranges[i]['page']
                current_end = ranges[i]['page']
                current_doc = ranges[i]['doc_type']
                current_conf = ranges[i]['confidence']
        
        # Add final range
        findings.append({
            'page_range': f"pp. {current_start}–{current_end}" if current_start != current_end else f"p. {current_start}",
            'doc_type': current_doc,
            'description': "Missing or grouped weights on evidence inventory",
            'confidence': current_conf
        })
    
    return findings

def find_issue_c_incomplete_transfers(text_by_page: Dict[int, str]) -> List[Dict]:
    """ISSUE C: Incomplete or inconsistent evidence transfers."""
    findings = []
    ranges = []
    
    for page_num in sorted(text_by_page.keys()):
        text = text_by_page[page_num]
        text_lower = text.lower()
        
        # Check if this is a chain of custody or transfer document
        is_coc = any(term in text_lower for term in [
            "chain of custody", "chainofcustody", "transfer", "released", "received"
        ])
        
        if not is_coc:
            continue
        
        # Check for issues
        has_released = "released" in text_lower or "released by" in text_lower
        has_received = "received" in text_lower or "received by" in text_lower
        has_signature = "signature" in text_lower
        has_timestamp = bool(re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', text))
        
        issues_found = []
        
        # Missing received by when released exists
        if has_released and not has_received:
            issues_found.append("released without received")
        
        # Missing signatures
        if is_coc and not has_signature:
            issues_found.append("missing signatures")
        
        # Missing timestamps
        if is_coc and not has_timestamp:
            issues_found.append("missing timestamps")
        
        # Check for duplicate timestamps (same time for multiple entries)
        timestamps = re.findall(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', text)
        if len(timestamps) > len(set(timestamps)):
            issues_found.append("duplicate timestamps")
        
        if issues_found:
            doc_type = identify_document_type(text)
            confidence = assess_ocr_confidence(text)
            
            ranges.append({
                'page': page_num,
                'doc_type': doc_type,
                'confidence': confidence,
                'issues': issues_found
            })
    
    # Group into ranges
    if ranges:
        current_start = ranges[0]['page']
        current_end = ranges[0]['page']
        current_doc = ranges[0]['doc_type']
        current_conf = ranges[0]['confidence']
        current_issues = set(ranges[0]['issues'])
        
        for i in range(1, len(ranges)):
            if (ranges[i]['page'] == current_end + 1 and 
                ranges[i]['doc_type'] == current_doc and
                ranges[i]['confidence'] == current_conf):
                current_end = ranges[i]['page']
                current_issues.update(ranges[i]['issues'])
            else:
                findings.append({
                    'page_range': f"pp. {current_start}–{current_end}" if current_start != current_end else f"p. {current_start}",
                    'doc_type': current_doc,
                    'description': f"Incomplete transfers: {', '.join(current_issues)}",
                    'confidence': current_conf
                })
                current_start = ranges[i]['page']
                current_end = ranges[i]['page']
                current_doc = ranges[i]['doc_type']
                current_conf = ranges[i]['confidence']
                current_issues = set(ranges[i]['issues'])
        
        findings.append({
            'page_range': f"pp. {current_start}–{current_end}" if current_start != current_end else f"p. {current_start}",
            'doc_type': current_doc,
            'description': f"Incomplete transfers: {', '.join(current_issues)}",
            'confidence': current_conf
        })
    
    return findings

def find_issue_d_nms_intake_defects(text_by_page: Dict[int, str]) -> List[Dict]:
    """ISSUE D: NMS laboratory intake and internal custody defects."""
    findings = []
    ranges = []
    
    for page_num in sorted(text_by_page.keys()):
        text = text_by_page[page_num]
        text_lower = text.lower()
        
        # Check if this is NMS or lab intake document
        is_nms = "nms" in text_lower
        is_lab_intake = any(term in text_lower for term in [
            "intake", "accession", "laboratory received", "lab received"
        ])
        
        if not (is_nms or is_lab_intake):
            continue
        
        # Check for defects
        issues_found = []
        
        # Missing timestamps
        has_timestamp = bool(re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', text))
        if not has_timestamp:
            issues_found.append("missing timestamps")
        
        # Missing handler names/initials
        has_handler = bool(re.search(r'(?:handler|received\s+by|processed\s+by)[:\s]+[A-Z]', text_lower))
        if not has_handler:
            issues_found.append("missing handler names")
        
        # Check for identifier changes (item numbers that change)
        item_numbers = re.findall(r'(?:item|exhibit|sample)[\s#:]*([A-Z0-9\-]+)', text_lower)
        if len(set(item_numbers)) < len(item_numbers):
            issues_found.append("duplicate or changing item identifiers")
        
        # Check for relabeling language
        if re.search(r'relabel|renumber|re[- ]?number', text_lower):
            issues_found.append("relabeling or renumbering")
        
        if issues_found:
            doc_type = identify_document_type(text)
            confidence = assess_ocr_confidence(text)
            
            ranges.append({
                'page': page_num,
                'doc_type': doc_type,
                'confidence': confidence,
                'issues': issues_found
            })
    
    # Group into ranges
    if ranges:
        current_start = ranges[0]['page']
        current_end = ranges[0]['page']
        current_doc = ranges[0]['doc_type']
        current_conf = ranges[0]['confidence']
        current_issues = set(ranges[0]['issues'])
        
        for i in range(1, len(ranges)):
            if (ranges[i]['page'] == current_end + 1 and 
                ranges[i]['doc_type'] == current_doc and
                ranges[i]['confidence'] == current_conf):
                current_end = ranges[i]['page']
                current_issues.update(ranges[i]['issues'])
            else:
                findings.append({
                    'page_range': f"pp. {current_start}–{current_end}" if current_start != current_end else f"p. {current_start}",
                    'doc_type': current_doc,
                    'description': f"Lab intake defects: {', '.join(current_issues)}",
                    'confidence': current_conf
                })
                current_start = ranges[i]['page']
                current_end = ranges[i]['page']
                current_doc = ranges[i]['doc_type']
                current_conf = ranges[i]['confidence']
                current_issues = set(ranges[i]['issues'])
        
        findings.append({
            'page_range': f"pp. {current_start}–{current_end}" if current_start != current_end else f"p. {current_start}",
            'doc_type': current_doc,
            'description': f"Lab intake defects: {', '.join(current_issues)}",
            'confidence': current_conf
        })
    
    return findings

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
    
    # Search for each issue
    print("Searching for ISSUE A: Multiple evidence numbering systems...")
    issue_a = find_issue_a_multiple_numbering(text_by_page)
    print(f"  Found {len(issue_a)} page range(s)\n")
    
    print("Searching for ISSUE B: Missing or grouped weights...")
    issue_b = find_issue_b_missing_weights(text_by_page)
    print(f"  Found {len(issue_b)} page range(s)\n")
    
    print("Searching for ISSUE C: Incomplete evidence transfers...")
    issue_c = find_issue_c_incomplete_transfers(text_by_page)
    print(f"  Found {len(issue_c)} page range(s)\n")
    
    print("Searching for ISSUE D: NMS lab intake defects...")
    issue_d = find_issue_d_nms_intake_defects(text_by_page)
    print(f"  Found {len(issue_d)} page range(s)\n")
    
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
    
    # Also create CSV
    csv_path = Path("C:/Users/simmo/Desktop/audit/chain_of_custody_issue_mapping.csv")
    import csv as csv_module
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv_module.DictWriter(f, fieldnames=['issue', 'page_range', 'doc_type', 'description', 'ocr_confidence'])
        writer.writeheader()
        
        for finding in issue_a:
            writer.writerow({**finding, 'issue': 'A'})
        for finding in issue_b:
            writer.writerow({**finding, 'issue': 'B'})
        for finding in issue_c:
            writer.writerow({**finding, 'issue': 'C'})
        for finding in issue_d:
            writer.writerow({**finding, 'issue': 'D'})
    
    print(f"CSV saved to: {csv_path}")
    print("\nAnalysis complete!")

if __name__ == "__main__":
    main()















