#!/usr/bin/env python3
"""
Audit Pass #3: Weights-Only Indexing (ISSUE B Recovery)
Focuses on visual evidence sheets, not just OCR text
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

def extract_text_and_tables_pdfplumber(pdf_path: str) -> tuple:
    """Extract both text and tables from PDF for visual analysis."""
    text_by_page = {}
    tables_by_page = {}
    print("Extracting text and tables from PDF...")
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        for i, page in enumerate(pdf.pages, 1):
            if i % 200 == 0:
                print(f"  Processed {i}/{total} pages...")
            try:
                text = page.extract_text()
                text_by_page[i] = text or ""
                tables = page.extract_tables()
                tables_by_page[i] = tables or []
            except:
                text_by_page[i] = ""
                tables_by_page[i] = []
    return text_by_page, tables_by_page

def assess_ocr_confidence(text: str, has_tables: bool) -> str:
    """Assess OCR confidence with consideration for table presence."""
    if not text or len(text.strip()) < 30:
        if has_tables:
            return "Low"  # Tables present but text unreadable
        return "Low"
    
    has_numbers = bool(re.search(r'\d+\.\d+', text))
    has_clean_words = len([w for w in text.split()[:50] if len(w) > 2]) > 10
    
    if has_numbers and has_clean_words:
        return "High"
    elif has_clean_words or has_tables:
        return "Medium"
    else:
        return "Low"

def identify_document_type(text: str) -> str:
    """Identify document type from text."""
    text_lower = text.lower()
    
    if "evidence inventory" in text_lower or "property record" in text_lower:
        return "Evidence Inventory"
    elif "lab submission" in text_lower or "submission form" in text_lower:
        return "Lab Submission Form"
    elif "property" in text_lower and "sheet" in text_lower:
        return "Property Sheet"
    elif "chain of custody" in text_lower or "chainofcustody" in text_lower:
        return "Chain of Custody"
    elif "nms" in text_lower:
        return "NMS Lab Document"
    elif any(term in text_lower for term in ["transmittal", "submission", "accession"]):
        return "Submission/Transmittal Form"
    else:
        return "Unknown Document Type"

def analyze_weight_patterns_in_text(text: str) -> Dict[str, bool]:
    """Analyze weight patterns in text to detect issues."""
    text_lower = text.lower()
    
    # Extract all weight values
    weight_pattern = r'(\d+\.?\d*)\s*(?:g|gram|grams|oz|ounce|ounces|lb|pound|pounds|kg|kilogram)'
    weight_matches = list(re.finditer(weight_pattern, text_lower))
    weight_values = [float(m.group(1)) for m in weight_matches if m.group(1)]
    
    patterns = {
        'has_weight_field': bool(re.search(r'\bweight\b|\bnet\s*weight\b|\bgross\s*weight\b', text_lower)),
        'has_weight_values': len(weight_values) > 0,
        'has_identical_weights': False,
        'has_grouped_weights': False,
        'has_blank_weight_references': False,
        'has_handwritten_indicators': bool(re.search(r'handwritten|h\.?w\.?|written|pen|pencil|ink|scribble|illegible', text_lower)),
    }
    
    # Check for identical weights (suspicious)
    if len(weight_values) > 1:
        unique_weights = len(set(weight_values))
        if unique_weights < len(weight_values) * 0.3:  # More than 70% identical
            patterns['has_identical_weights'] = True
    
    # Check for grouped weights (one weight for multiple items)
    if re.search(r'(?:total|combined|aggregate|sum)\s+(?:weight|wt)', text_lower):
        if len(weight_values) < 3:  # Few weight values but items present
            patterns['has_grouped_weights'] = True
    
    # Check for blank weight references
    blank_patterns = [
        r'weight[:\s]*[—–-]',  # Weight: -
        r'weight[:\s]*\?',      # Weight: ?
        r'weight[:\s]*n/?a',    # Weight: N/A
        r'weight[:\s]*blank',   # Weight: blank
        r'weight[:\s]*none',    # Weight: none
    ]
    for pattern in blank_patterns:
        if re.search(pattern, text_lower):
            patterns['has_blank_weight_references'] = True
            break
    
    return patterns

def analyze_weight_patterns_in_tables(tables: List) -> Dict[str, bool]:
    """Analyze weight patterns in extracted tables."""
    patterns = {
        'has_weight_column': False,
        'weight_column_mostly_empty': False,
        'identical_weights_in_rows': False,
        'has_table_structure': len(tables) > 0,
    }
    
    if not tables:
        return patterns
    
    for table in tables:
        if not table or len(table) < 2:
            continue
        
        # Find weight column index
        weight_col_idx = None
        header_row = table[0] if table else []
        for i, cell in enumerate(header_row):
            if cell and isinstance(cell, str):
                cell_lower = str(cell).lower()
                if any(term in cell_lower for term in ['weight', 'wt', 'mass', 'net', 'gross']):
                    weight_col_idx = i
                    patterns['has_weight_column'] = True
                    break
        
        if weight_col_idx is None:
            continue
        
        # Analyze weight column data
        weight_values = []
        empty_cells = 0
        for row in table[1:]:  # Skip header
            if weight_col_idx < len(row) and row[weight_col_idx]:
                cell_text = str(row[weight_col_idx]).strip()
                # Try to extract weight value
                weight_match = re.search(r'(\d+\.?\d*)', cell_text)
                if weight_match:
                    try:
                        weight_values.append(float(weight_match.group(1)))
                    except:
                        pass
                elif not cell_text or cell_text in ['-', '—', '?', 'N/A', 'blank', 'none']:
                    empty_cells += 1
        
        # Check if column is mostly empty
        total_rows = len(table) - 1
        if total_rows > 0 and empty_cells / total_rows > 0.5:
            patterns['weight_column_mostly_empty'] = True
        
        # Check for identical weights
        if len(weight_values) > 1:
            unique_weights = len(set(weight_values))
            if unique_weights < len(weight_values) * 0.3:
                patterns['identical_weights_in_rows'] = True
    
    return patterns

def determine_weight_status(text_patterns: Dict, table_patterns: Dict, ocr_conf: str) -> str:
    """Determine weight field status based on analysis."""
    # Priority: handwritten > grouped > unclear > missing
    
    if text_patterns.get('has_handwritten_indicators') or ocr_conf == "Low":
        if table_patterns.get('has_table_structure'):
            return "handwritten/unreadable"
        return "handwritten"
    
    if text_patterns.get('has_grouped_weights') or table_patterns.get('identical_weights_in_rows'):
        return "grouped (one weight for multiple items)"
    
    if (text_patterns.get('has_blank_weight_references') or 
        table_patterns.get('weight_column_mostly_empty')):
        return "unclear/ambiguous"
    
    if (text_patterns.get('has_weight_field') and 
        not text_patterns.get('has_weight_values') and
        not table_patterns.get('has_weight_column')):
        return "missing"
    
    if ocr_conf == "Low" and table_patterns.get('has_table_structure'):
        return "unclear (poor OCR)"
    
    return "unclear/ambiguous"

def create_factual_note(text_patterns: Dict, table_patterns: Dict, doc_type: str) -> str:
    """Create a short factual note (≤10 words)."""
    notes = []
    
    if text_patterns.get('has_handwritten_indicators'):
        notes.append("handwritten")
    if text_patterns.get('has_identical_weights'):
        notes.append("identical weights")
    if text_patterns.get('has_grouped_weights') or table_patterns.get('identical_weights_in_rows'):
        notes.append("grouped")
    if table_patterns.get('weight_column_mostly_empty'):
        notes.append("mostly blank")
    if text_patterns.get('has_blank_weight_references'):
        notes.append("blank fields")
    
    if not notes:
        if table_patterns.get('has_table_structure'):
            notes.append("table unreadable")
        else:
            notes.append("weight unclear")
    
    return ", ".join(notes[:2])  # Max 2 notes, ≤10 words

def find_weight_issue_pages(text_by_page: Dict[int, str], tables_by_page: Dict[int, List]) -> List[Dict]:
    """Find all pages with weight-related issues."""
    findings = []
    
    for page_num in text_by_page.keys():
        text = text_by_page.get(page_num, "")
        tables = tables_by_page.get(page_num, [])
        
        text_lower = text.lower()
        
        # Must be evidence inventory, property sheet, or lab submission
        is_relevant_doc = any(term in text_lower for term in [
            "evidence inventory", "property record", "property sheet",
            "lab submission", "submission form", "evidence record",
            "seized", "property/evidence"
        ])
        
        if not is_relevant_doc:
            continue
        
        # Analyze patterns
        text_patterns = analyze_weight_patterns_in_text(text)
        table_patterns = analyze_weight_patterns_in_tables(tables)
        
        # Only flag if there's an issue
        has_issue = (
            text_patterns.get('has_blank_weight_references') or
            text_patterns.get('has_grouped_weights') or
            text_patterns.get('has_identical_weights') or
            text_patterns.get('has_handwritten_indicators') or
            table_patterns.get('weight_column_mostly_empty') or
            table_patterns.get('identical_weights_in_rows') or
            (text_patterns.get('has_weight_field') and not text_patterns.get('has_weight_values') and
             not table_patterns.get('has_weight_column')) or
            (table_patterns.get('has_table_structure') and len(text.strip()) < 100)  # Table but little text
        )
        
        if has_issue:
            doc_type = identify_document_type(text)
            ocr_conf = assess_ocr_confidence(text, len(tables) > 0)
            weight_status = determine_weight_status(text_patterns, table_patterns, ocr_conf)
            note = create_factual_note(text_patterns, table_patterns, doc_type)
            
            findings.append({
                'page': page_num,
                'doc_type': doc_type,
                'weight_status': weight_status,
                'ocr_confidence': ocr_conf,
                'note': note
            })
    
    return findings

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
    
    # Extract text and tables
    text_by_page, tables_by_page = extract_text_and_tables_pdfplumber(PDF_PATH)
    print(f"\nExtracted {len(text_by_page)} pages\n")
    
    # Find weight issue pages
    print("Searching for weight-related issues...")
    findings = find_weight_issue_pages(text_by_page, tables_by_page)
    print(f"  Found {len(findings)} page(s) with weight issues\n")
    
    # Write output
    output_path = Path("C:/Users/simmo/Desktop/audit/audit_pass_3_weights_indexing.txt")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("AUDIT PASS #3: WEIGHTS-ONLY INDEXING (ISSUE B RECOVERY)\n")
        f.write("=" * 100 + "\n\n")
        f.write("Focus: Visual evidence sheets, property sheets, lab submission forms\n")
        f.write("Issue: Missing, handwritten, grouped, or unclear weights\n\n")
        
        for finding in findings:
            f.write(f"Page: {finding['page']}\n")
            f.write(f"Document Type: {finding['doc_type']}\n")
            f.write(f"Weight Status: {finding['weight_status']}\n")
            f.write(f"OCR Confidence: {finding['ocr_confidence']}\n")
            f.write(f"Note: {finding['note']}\n")
            f.write("-" * 100 + "\n\n")
    
    print(f"Output saved to: {output_path}")
    
    # CSV output
    csv_path = Path("C:/Users/simmo/Desktop/audit/audit_pass_3_weights_indexing.csv")
    import csv as csv_module
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv_module.DictWriter(f, fieldnames=[
            'page', 'issue_code', 'doc_type', 'description', 'ocr_confidence', 'source_audit'
        ])
        writer.writeheader()
        for finding in findings:
            writer.writerow({
                'page': finding['page'],
                'issue_code': 'B',
                'doc_type': finding['doc_type'],
                'description': f"{finding['weight_status']} - {finding['note']}",
                'ocr_confidence': finding['ocr_confidence'],
                'source_audit': 'Pass #3'
            })
    
    print(f"CSV saved to: {csv_path}")
    print("\nAudit Pass #3 complete!")

if __name__ == "__main__":
    main()















