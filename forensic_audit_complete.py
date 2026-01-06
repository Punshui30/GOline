#!/usr/bin/env python3
"""
Complete Forensic Laboratory Testing Audit
Performs comprehensive audit across all phases as specified.
"""

import sys
import re
import os
from pathlib import Path
from collections import defaultdict
from datetime import datetime

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    print("ERROR: pdfplumber not installed. Install with: pip install pdfplumber")
    sys.exit(1)

try:
    from PIL import Image
    import pytesseract
    HAS_OCR = True
except ImportError:
    print("WARNING: OCR libraries not available. Install with: pip install Pillow pytesseract")
    print("Continuing without OCR capabilities...")
    HAS_OCR = False

try:
    from pdf2image import convert_from_path
    HAS_PDF2IMAGE = True
except ImportError:
    HAS_PDF2IMAGE = False
    if HAS_OCR:
        print("WARNING: pdf2image not available. OCR on PDFs will be limited.")

# SWGDRUG and ASTM guideline patterns
SWGDRUG_KEYWORDS = [
    'SWGDRUG', 'Scientific Working Group', 'sampling plan', 'random sampling',
    'representative sample', 'statistical sampling', 'sampling protocol'
]

ASTM_KEYWORDS = [
    'ASTM E2329', 'ASTM E2548', 'ASTM E2917', 'ASTM standard', 'ASTM method'
]

def check_pdf_searchable(pdf_path):
    """Check if PDF is already text-searchable."""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            # Check first few pages for text content
            text_length = 0
            for i, page in enumerate(pdf.pages[:5]):
                text = page.extract_text()
                if text:
                    text_length += len(text.strip())
            return text_length > 100  # If we have substantial text, likely searchable
    except:
        return False

def ocr_pdf_page(page_image):
    """Perform OCR on a single page image."""
    if not HAS_OCR:
        return ""
    try:
        text = pytesseract.image_to_string(page_image, lang='eng')
        return text
    except Exception as e:
        print(f"  OCR error: {e}")
        return ""

def ocr_pdf_file(pdf_path, output_dir=None):
    """OCR a PDF file if not already searchable."""
    print(f"\nChecking PDF: {Path(pdf_path).name}")
    
    if check_pdf_searchable(pdf_path):
        print(f"  [OK] PDF is already text-searchable")
        return True
    
    if not HAS_OCR:
        print(f"  [WARN] OCR not available - skipping OCR for this file")
        return False
    
    if not HAS_PDF2IMAGE:
        print(f"  [WARN] pdf2image not available - cannot OCR PDF pages")
        return False
    
    print(f"  [->] PDF appears to be scanned images - running OCR...")
    try:
        # Convert PDF to images
        images = convert_from_path(pdf_path, dpi=300)
        print(f"  [->] Converted {len(images)} pages to images")
        
        # OCR each page
        ocr_text_by_page = {}
        for i, image in enumerate(images):
            print(f"  [->] OCRing page {i+1}/{len(images)}...", end='\r')
            text = ocr_pdf_page(image)
            ocr_text_by_page[i + 1] = text
        print(f"  [OK] OCR complete for {len(images)} pages")
        
        return ocr_text_by_page
    except Exception as e:
        print(f"  [ERROR] OCR failed: {e}")
        return False

def extract_text_from_pdf(pdf_path):
    """Extract text and tables from PDF."""
    text_by_page = {}
    tables_by_page = {}
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            
            for page_num, page in enumerate(pdf.pages):
                try:
                    text = page.extract_text()
                    text_by_page[page_num + 1] = text or ""
                    
                    tables = page.extract_tables()
                    if tables:
                        tables_by_page[page_num + 1] = tables
                except Exception as e:
                    print(f"    Error on page {page_num + 1}: {e}")
                    text_by_page[page_num + 1] = ""
                    tables_by_page[page_num + 1] = []
    except Exception as e:
        print(f"Error reading PDF: {e}")
    
    return text_by_page, tables_by_page

def find_coa_documents(text_by_page):
    """Find all COA and lab report documents."""
    coa_patterns = [
        r'\b(?:COA|Certificate of Analysis|certificate of analysis|C\.O\.A\.|C of A)\b',
        r'\b(?:laboratory report|lab report|forensic lab|forensic laboratory|lab analysis|laboratory analysis)\b',
        r'\b(?:Forensic Chemistry Report|forensic chemistry report)\b',
        r'\b(?:chemistry report|chemical analysis|chemical testing)\b',
        r'\b(?:test report|testing report|analytical report)\b',
        r'\b(?:lab certificate|laboratory certificate)\b',
    ]
    
    coa_pages = []
    coa_details = []
    
    for page_num, text in text_by_page.items():
        if not text or len(text.strip()) < 50:
            continue
        
        for pattern in coa_patterns:
            matches = list(re.finditer(pattern, text, re.IGNORECASE))
            if matches:
                coa_pages.append(page_num)
                # Get context around first match
                match = matches[0]
                start = max(0, match.start() - 200)
                end = min(len(text), match.end() + 500)
                context = text[start:end].replace('\n', ' ')
                
                coa_details.append({
                    'page': page_num,
                    'pattern': pattern,
                    'context': context
                })
                break  # Only count page once
    
    return sorted(set(coa_pages)), coa_details

def extract_sample_ids_comprehensive(text, tables=None):
    """Comprehensive sample ID extraction."""
    sample_ids = set()
    
    # Pattern 1: "Sample ID: XXX" or "Item #: XXX"
    patterns = [
        r'\b(?:Sample\s*ID|Item\s*#|Item\s*Number|Exhibit\s*#|Exhibit\s*Number|Evidence\s*#|Case\s*#)[\s:]*([A-Z0-9][A-Z0-9\-]{1,20})\b',
        r'\b(?:Sample|Item|Exhibit|Evidence|Specimen|Batch)[\s#:]+([A-Z0-9][A-Z0-9\-]{1,20})\b',
        r'\b([A-Z]{1,3}[- ]?\d{2,6}[A-Z]?[- ]?\d{0,4})\b',  # Alphanumeric IDs
        r'\b([E][- ]?\d{3,6})\b',  # Evidence numbers
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            id_val = match.group(1) if match.groups() else match.group(0)
            id_val = id_val.strip().upper()
            
            # Filter out dates and common words
            if (len(id_val) >= 2 and len(id_val) <= 25 and 
                not re.match(r'^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$', id_val)):
                sample_ids.add(id_val)
    
    # Extract from tables if provided
    if tables:
        for table in tables:
            if not table:
                continue
            for row in table:
                if not row:
                    continue
                for cell in row:
                    if not cell:
                        continue
                    cell_text = str(cell).strip()
                    for pattern in patterns:
                        matches = re.finditer(pattern, cell_text, re.IGNORECASE)
                        for match in matches:
                            id_val = match.group(1) if match.groups() else match.group(0)
                            id_val = id_val.strip().upper()
                            if len(id_val) >= 2 and len(id_val) <= 25:
                                sample_ids.add(id_val)
    
    return sample_ids

def extract_weights(text, tables=None):
    """Extract weight measurements."""
    weights = []
    
    # Weight patterns: "X.XX g", "X.XX grams", "X.XX kg", etc.
    weight_patterns = [
        r'(\d+\.?\d*)\s*(?:g|gram|grams|kg|kilogram|kilograms|oz|ounce|ounces|lb|pound|pounds)\b',
        r'(?:weight|mass|net\s*weight|gross\s*weight)[\s:]*(\d+\.?\d*)\s*(?:g|gram|grams)',
        r'(\d+\.?\d*)\s*(?:g|gram)\s*(?:total|combined|aggregate)',
    ]
    
    for pattern in weight_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            try:
                weight_val = float(match.group(1))
                unit = match.group(0).lower()
                weights.append({
                    'value': weight_val,
                    'unit': unit,
                    'context': text[max(0, match.start()-50):min(len(text), match.end()+50)]
                })
            except:
                pass
    
    # Extract from tables
    if tables:
        for table in tables:
            if not table:
                continue
            for row in table:
                if not row:
                    continue
                row_text = ' '.join([str(cell) for cell in row if cell])
                for pattern in weight_patterns:
                    matches = re.finditer(pattern, row_text, re.IGNORECASE)
                    for match in matches:
                        try:
                            weight_val = float(match.group(1))
                            weights.append({
                                'value': weight_val,
                                'unit': match.group(0),
                                'context': 'table_data'
                            })
                        except:
                            pass
    
    return weights

def extract_potency_tables(text, tables=None):
    """Extract potency/concentration data."""
    potency_indicators = [
        r'\b(?:THC|CBD|potency|concentration|percentage|%|percent)\b',
        r'\b(?:delta-9|delta\s*9|tetrahydrocannabinol)\b',
    ]
    
    has_potency = any(re.search(pattern, text, re.IGNORECASE) for pattern in potency_indicators)
    
    potency_data = []
    if has_potency and tables:
        for table in tables:
            if not table:
                continue
            # Look for tables with percentage or concentration data
            table_text = ' '.join([' '.join([str(cell) for cell in row if cell]) for row in table])
            if re.search(r'%|\d+\.\d+\s*(?:%|percent)', table_text):
                potency_data.append({
                    'table_text': table_text[:500],
                    'rows': len(table)
                })
    
    return potency_data

def check_composite_vs_individual(text):
    """Check for composite vs individual testing."""
    composite_indicators = [
        r'\bcomposite\s+(?:sample|specimen|test)\b',
        r'\bhomogenized\s+(?:sample|material)\b',
        r'\bcombined\s+(?:sample|samples)\b',
        r'\bpooled\s+(?:sample|samples)\b',
        r'\brepresentative\s+sample\b',
    ]
    
    individual_indicators = [
        r'\bindividual\s+(?:sample|samples|specimen)\b',
        r'\bseparate\s+(?:sample|samples)\b',
        r'\beach\s+(?:sample|item)\b',
        r'\bdiscrete\s+(?:sample|samples)\b',
    ]
    
    is_composite = any(re.search(pattern, text, re.IGNORECASE) for pattern in composite_indicators)
    is_individual = any(re.search(pattern, text, re.IGNORECASE) for pattern in individual_indicators)
    
    return {
        'composite': is_composite,
        'individual': is_individual,
        'unclear': not (is_composite or is_individual)
    }

def check_sampling_plan(text):
    """Check for sampling plan documentation."""
    sampling_keywords = [
        r'\bsampling\s+(?:plan|protocol|method|procedure|strategy)\b',
        r'\bselection\s+(?:method|procedure|criteria)\b',
        r'\brandom(?:ization|ized|ly)?\s+(?:sampling|selection)\b',
        r'\bhomogenization\s+(?:procedure|method|protocol)\b',
        r'\bsample\s+preparation\b',
    ]
    
    found = []
    for pattern in sampling_keywords:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            start = max(0, match.start() - 300)
            end = min(len(text), match.end() + 300)
            context = text[start:end].replace('\n', ' ')
            found.append({
                'term': match.group(0),
                'context': context
            })
    
    return found

def count_seized_items(text_by_page):
    """Count total items seized from property lists, evidence forms, etc."""
    item_count_patterns = [
        r'(?:total|number of|count of)\s+(?:items?|bags?|containers?|packages?|samples?|pieces?)[\s:]*(\d+)',
        r'(\d+)\s+(?:items?|bags?|containers?|packages?|samples?|pieces?)\s+(?:seized|collected|submitted|received|inventory)',
        r'(?:seized|collected|submitted|received|inventory)[\s:]*(\d+)\s+(?:items?|bags?|containers?|packages?)',
        r'(?:evidence|property|exhibit)[\s#:]*(\d+)',
        r'(\d+)\s+(?:evidence|property|exhibit)',
        r'(?:item|bag|container|package)[\s#:]*(\d+)',
    ]
    
    counts = []
    locations = []
    
    for page_num, text in text_by_page.items():
        if not text:
            continue
        
        for pattern in item_count_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    count = int(match.group(1))
                    if 1 <= count <= 10000:  # Reasonable range
                        counts.append(count)
                        locations.append({
                            'page': page_num,
                            'count': count,
                            'context': text[max(0, match.start()-100):min(len(text), match.end()+100)]
                        })
                except:
                    pass
    
    return counts, locations

def check_commingling(text_by_page):
    """Check for indicators of commingling or repackaging."""
    commingling_indicators = [
        r'\b(?:combined|commingled|mixed|repackaged|consolidated)\s+(?:items?|samples?|evidence)\b',
        r'\b(?:items?|samples?)\s+(?:combined|commingled|mixed|repackaged|consolidated)\b',
    ]
    
    heterogeneous_indicators = [
        r'\b(?:different|various|varied|heterogeneous|diverse)\s+(?:appearance|packaging|source|type)\b',
        r'\b(?:appearance|packaging|source|type)\s+(?:varies|differs|different)\b',
    ]
    
    commingling_found = []
    heterogeneous_found = []
    
    for page_num, text in text_by_page.items():
        if not text:
            continue
        
        for pattern in commingling_indicators:
            if re.search(pattern, text, re.IGNORECASE):
                commingling_found.append(page_num)
                break
        
        for pattern in heterogeneous_indicators:
            if re.search(pattern, text, re.IGNORECASE):
                heterogeneous_found.append(page_num)
                break
    
    return {
        'commingling_pages': sorted(set(commingling_found)),
        'heterogeneous_pages': sorted(set(heterogeneous_found))
    }

def check_swgdrug_compliance(text_by_page):
    """Check compliance with SWGDRUG guidelines."""
    swgdrug_mentions = []
    compliance_issues = []
    
    all_text = ' '.join(text_by_page.values())
    
    # Check for SWGDRUG mentions
    if re.search(r'SWGDRUG', all_text, re.IGNORECASE):
        swgdrug_mentions.append('SWGDRUG mentioned in document')
    
    # Check for required elements
    required_elements = {
        'random_sampling': r'\brandom(?:ization|ized|ly)?\s+(?:sampling|selection)\b',
        'representative': r'\brepresentative\s+sample\b',
        'sampling_plan': r'\bsampling\s+(?:plan|protocol)\b',
        'homogenization': r'\bhomogenization\b',
        'uncertainty': r'\buncertainty\s+(?:of\s+)?(?:measurement|analysis)\b',
    }
    
    for element, pattern in required_elements.items():
        if not re.search(pattern, all_text, re.IGNORECASE):
            compliance_issues.append(f'Missing: {element.replace("_", " ")}')
    
    return {
        'swgdrug_mentioned': len(swgdrug_mentions) > 0,
        'compliance_issues': compliance_issues
    }

def check_astm_compliance(text_by_page):
    """Check compliance with ASTM standards."""
    astm_mentions = []
    all_text = ' '.join(text_by_page.values())
    
    astm_patterns = [
        r'ASTM\s+E2329',
        r'ASTM\s+E2548',
        r'ASTM\s+E2917',
    ]
    
    for pattern in astm_patterns:
        if re.search(pattern, all_text, re.IGNORECASE):
            astm_mentions.append(pattern)
    
    return {
        'astm_mentioned': len(astm_mentions) > 0,
        'standards_found': astm_mentions
    }

def phase1_ocr(pdf_path):
    """Phase 1: OCR all documents."""
    print("\n" + "="*80)
    print("PHASE 1: INGEST & OCR EVERYTHING")
    print("="*80)
    
    print(f"\nProcessing: {Path(pdf_path).name}")
    
    # Check if searchable
    is_searchable = check_pdf_searchable(pdf_path)
    
    if is_searchable:
        print("[OK] PDF is text-searchable - no OCR needed")
        text_by_page, tables_by_page = extract_text_from_pdf(pdf_path)
        print(f"[OK] Extracted text from {len(text_by_page)} pages")
        return text_by_page, tables_by_page
    else:
        print("[->] PDF appears to be scanned - attempting OCR...")
        ocr_result = ocr_pdf_file(pdf_path)
        if ocr_result and isinstance(ocr_result, dict):
            print(f"[OK] OCR complete - {len(ocr_result)} pages processed")
            return ocr_result, {}
        else:
            # Fallback: try to extract anyway
            print("[->] Attempting text extraction despite OCR limitations...")
            text_by_page, tables_by_page = extract_text_from_pdf(pdf_path)
            return text_by_page, tables_by_page

def phase2_extract_lab_testing(text_by_page, tables_by_page):
    """Phase 2: Extract all lab testing data."""
    print("\n" + "="*80)
    print("PHASE 2: EXTRACT ALL LAB TESTING")
    print("="*80)
    
    # Find COA documents
    print("\n[->] Searching for COA and lab report documents...")
    coa_pages, coa_details = find_coa_documents(text_by_page)
    print(f"[OK] Found {len(coa_pages)} pages with COA/lab report indicators")
    
    # Extract sample IDs
    print("\n[->] Extracting sample IDs...")
    all_sample_ids = set()
    sample_id_locations = defaultdict(list)
    
    for page_num in sorted(text_by_page.keys()):
        text = text_by_page[page_num]
        tables = tables_by_page.get(page_num, [])
        
        if not text:
            continue
        
        page_ids = extract_sample_ids_comprehensive(text, tables)
        for sample_id in page_ids:
            all_sample_ids.add(sample_id)
            sample_id_locations[sample_id].append(page_num)
    
    print(f"[OK] Extracted {len(all_sample_ids)} unique sample IDs")
    
    # Extract weights
    print("\n[->] Extracting weight measurements...")
    all_weights = []
    for page_num in sorted(text_by_page.keys()):
        text = text_by_page[page_num]
        tables = tables_by_page.get(page_num, [])
        weights = extract_weights(text, tables)
        for w in weights:
            w['page'] = page_num
            all_weights.append(w)
    print(f"[OK] Found {len(all_weights)} weight measurements")
    
    # Extract potency data
    print("\n[->] Extracting potency/concentration data...")
    potency_data = []
    for page_num in sorted(text_by_page.keys()):
        text = text_by_page[page_num]
        tables = tables_by_page.get(page_num, [])
        potency = extract_potency_tables(text, tables)
        if potency:
            potency_data.extend(potency)
    print(f"[OK] Found {len(potency_data)} pages with potency data")
    
    # Check composite vs individual
    print("\n[->] Checking for composite vs individual testing...")
    composite_info = []
    individual_info = []
    for page_num in sorted(text_by_page.keys()):
        text = text_by_page[page_num]
        if not text:
            continue
        check = check_composite_vs_individual(text)
        if check['composite']:
            composite_info.append(page_num)
        if check['individual']:
            individual_info.append(page_num)
    print(f"[OK] Composite testing: {len(composite_info)} pages")
    print(f"[OK] Individual testing: {len(individual_info)} pages")
    
    # Check sampling plans
    print("\n[->] Checking for sampling plan documentation...")
    sampling_plans = []
    for page_num in sorted(text_by_page.keys()):
        text = text_by_page[page_num]
        if not text:
            continue
        plans = check_sampling_plan(text)
        if plans:
            sampling_plans.append({'page': page_num, 'plans': plans})
    print(f"[OK] Found sampling plan mentions on {len(sampling_plans)} pages")
    
    # Count samples tested per COA
    print("\n[->] Counting samples tested per COA...")
    samples_per_coa = {}
    for page_num in coa_pages:
        text = text_by_page[page_num]
        tables = tables_by_page.get(page_num, [])
        
        # Count sample IDs on this page
        page_ids = extract_sample_ids_comprehensive(text, tables)
        samples_per_coa[page_num] = len(page_ids)
    
    return {
        'coa_pages': coa_pages,
        'coa_details': coa_details,
        'sample_ids': all_sample_ids,
        'sample_id_locations': sample_id_locations,
        'weights': all_weights,
        'potency_data': potency_data,
        'composite_pages': composite_info,
        'individual_pages': individual_info,
        'sampling_plans': sampling_plans,
        'samples_per_coa': samples_per_coa
    }

def phase3_count_seized_items(text_by_page):
    """Phase 3: Count total items seized."""
    print("\n" + "="*80)
    print("PHASE 3: COUNT TOTAL ITEMS SEIZED")
    print("="*80)
    
    print("\n[->] Searching for property lists, evidence forms, chain of custody...")
    
    # Count items
    counts, locations = count_seized_items(text_by_page)
    print(f"[OK] Found {len(counts)} mentions of item counts")
    if counts:
        print(f"  Counts found: {sorted(set(counts))}")
        print(f"  Maximum count: {max(counts)}")
    
    # Check for commingling
    print("\n[->] Checking for commingling or repackaging...")
    commingling_info = check_commingling(text_by_page)
    print(f"[OK] Commingling mentioned on {len(commingling_info['commingling_pages'])} pages")
    print(f"[OK] Heterogeneous material mentioned on {len(commingling_info['heterogeneous_pages'])} pages")
    
    return {
        'item_counts': counts,
        'count_locations': locations,
        'commingling': commingling_info
    }

def phase4_crosscheck(testing_data, seized_data, text_by_page):
    """Phase 4: Cross-check testing coverage."""
    print("\n" + "="*80)
    print("PHASE 4: CROSS-CHECK TESTING COVERAGE")
    print("="*80)
    
    # Compare seized vs tested
    print("\n[->] Comparing seized items vs tested samples...")
    total_seized = max(seized_data['item_counts']) if seized_data['item_counts'] else None
    total_tested = len(testing_data['sample_ids'])
    
    print(f"  Total items seized (max mentioned): {total_seized if total_seized else 'Unknown'}")
    print(f"  Total unique sample IDs found: {total_tested}")
    
    if total_seized and total_tested:
        coverage_pct = (total_tested / total_seized) * 100 if total_seized > 0 else 0
        print(f"  Testing coverage: {coverage_pct:.1f}%")
    
    # Check SWGDRUG compliance
    print("\n[->] Checking SWGDRUG compliance...")
    swgdrug_check = check_swgdrug_compliance(text_by_page)
    print(f"  SWGDRUG mentioned: {swgdrug_check['swgdrug_mentioned']}")
    print(f"  Compliance issues: {len(swgdrug_check['compliance_issues'])}")
    if swgdrug_check['compliance_issues']:
        for issue in swgdrug_check['compliance_issues']:
            print(f"    - {issue}")
    
    # Check ASTM compliance
    print("\n[->] Checking ASTM compliance...")
    astm_check = check_astm_compliance(text_by_page)
    print(f"  ASTM standards mentioned: {astm_check['astm_mentioned']}")
    if astm_check['standards_found']:
        for std in astm_check['standards_found']:
            print(f"    - {std}")
    
    # Identify procedural defects
    print("\n[->] Identifying procedural defects...")
    defects = []
    
    if not testing_data['sampling_plans']:
        defects.append("No sampling plan documented")
    
    if not testing_data['composite_pages'] and not testing_data['individual_pages']:
        defects.append("Testing methodology unclear (no composite/individual indication)")
    
    if len(testing_data['composite_pages']) > 0 and not testing_data['sampling_plans']:
        defects.append("Composite samples used without documented justification")
    
    if total_seized and total_tested and total_tested < (total_seized * 0.1):
        defects.append(f"Only {total_tested} samples tested from {total_seized} seized items (<10% coverage)")
    
    print(f"  Found {len(defects)} potential procedural defects")
    for defect in defects:
        print(f"    - {defect}")
    
    return {
        'total_seized': total_seized,
        'total_tested': total_tested,
        'coverage_pct': (total_tested / total_seized * 100) if total_seized and total_seized > 0 else None,
        'swgdrug_compliance': swgdrug_check,
        'astm_compliance': astm_check,
        'defects': defects
    }

def phase5_generate_report(pdf_path, testing_data, seized_data, crosscheck_data, text_by_page):
    """Phase 5: Generate final report."""
    print("\n" + "="*80)
    print("PHASE 5: GENERATING FINAL REPORT")
    print("="*80)
    
    report_lines = []
    report_lines.append("="*80)
    report_lines.append("COMPLETE FORENSIC LABORATORY TESTING AUDIT REPORT")
    report_lines.append("="*80)
    report_lines.append(f"Source File: {Path(pdf_path).name}")
    report_lines.append(f"Total Pages: {len(text_by_page)}")
    report_lines.append(f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_lines.append("")
    
    # 1. Final Summary (Plain English)
    report_lines.append("="*80)
    report_lines.append("1. FINAL SUMMARY (PLAIN ENGLISH)")
    report_lines.append("="*80)
    report_lines.append("")
    
    total_seized = crosscheck_data['total_seized']
    total_tested = crosscheck_data['total_tested']
    
    report_lines.append(f"TOTAL ITEMS SEIZED:")
    if total_seized:
        report_lines.append(f"  {total_seized} items (based on maximum count found in documents)")
    else:
        report_lines.append("  Unable to determine from searchable text")
    report_lines.append("")
    
    report_lines.append(f"TOTAL SAMPLES ACTUALLY TESTED:")
    report_lines.append(f"  {total_tested} unique sample IDs identified in lab testing documents")
    report_lines.append(f"  {len(testing_data['coa_pages'])} pages contain COA/lab report indicators")
    report_lines.append("")
    
    report_lines.append("WHETHER TESTING COVERED 100% OR ONLY A SUBSET:")
    if total_seized and total_tested:
        coverage = crosscheck_data['coverage_pct']
        if coverage >= 100:
            report_lines.append(f"  Testing appears to cover 100% or more of seized items")
        elif coverage >= 50:
            report_lines.append(f"  Testing covers approximately {coverage:.1f}% of seized items")
        else:
            report_lines.append(f"  Testing covers only {coverage:.1f}% of seized items - SUBSET TESTING")
    else:
        report_lines.append("  Unable to determine coverage percentage (missing seized item count)")
    report_lines.append("")
    
    report_lines.append("WHETHER STATE'S AGGREGATE-WEIGHT CHARGE IS SCIENTIFICALLY JUSTIFIED:")
    defects = crosscheck_data['defects']
    if len(defects) == 0 and total_seized and total_tested and crosscheck_data['coverage_pct'] and crosscheck_data['coverage_pct'] >= 50:
        report_lines.append("  MAY BE JUSTIFIED - Testing appears comprehensive")
    elif len(defects) > 0 or (total_seized and total_tested and crosscheck_data['coverage_pct'] and crosscheck_data['coverage_pct'] < 10):
        report_lines.append("  QUESTIONABLE - Significant procedural issues or low coverage")
    else:
        report_lines.append("  UNCLEAR - Insufficient data to determine")
    report_lines.append("")
    
    report_lines.append("KEY DEFICIENCIES:")
    if defects:
        for defect in defects:
            report_lines.append(f"  - {defect}")
    else:
        report_lines.append("  No major deficiencies identified in searchable text")
    report_lines.append("")
    
    # 2. Technical Compliance Review
    report_lines.append("="*80)
    report_lines.append("2. TECHNICAL COMPLIANCE REVIEW")
    report_lines.append("="*80)
    report_lines.append("")
    
    report_lines.append("SWGDRUG SAMPLING GUIDELINES:")
    swgdrug = crosscheck_data['swgdrug_compliance']
    report_lines.append(f"  SWGDRUG mentioned in document: {swgdrug['swgdrug_mentioned']}")
    if swgdrug['compliance_issues']:
        report_lines.append("  Deviations from SWGDRUG guidelines:")
        for issue in swgdrug['compliance_issues']:
            report_lines.append(f"    - {issue}")
    else:
        report_lines.append("  No major deviations identified")
    report_lines.append("")
    
    report_lines.append("ASTM STANDARDS (E2329, E2548, E2917):")
    astm = crosscheck_data['astm_compliance']
    report_lines.append(f"  ASTM standards mentioned: {astm['astm_mentioned']}")
    if astm['standards_found']:
        report_lines.append("  Standards referenced:")
        for std in astm['standards_found']:
            report_lines.append(f"    - {std}")
    else:
        report_lines.append("  No ASTM standards explicitly referenced")
    report_lines.append("")
    
    # 3. Detailed Findings
    report_lines.append("="*80)
    report_lines.append("3. DETAILED FINDINGS")
    report_lines.append("="*80)
    report_lines.append("")
    
    report_lines.append("COA/LAB REPORT PAGES:")
    report_lines.append("-"*80)
    for page in testing_data['coa_pages']:
        report_lines.append(f"  Page {page}: {Path(pdf_path).name}")
    report_lines.append("")
    
    report_lines.append("SAMPLE IDs EXTRACTED (First 100):")
    report_lines.append("-"*80)
    sorted_ids = sorted(testing_data['sample_ids'], key=lambda x: (len(x), x))
    for sample_id in sorted_ids[:100]:
        pages = sorted(set(testing_data['sample_id_locations'][sample_id]))
        report_lines.append(f"  {sample_id}: pages {', '.join(map(str, pages[:10]))}" + 
                          (f" (and {len(pages)-10} more)" if len(pages) > 10 else ""))
    if len(sorted_ids) > 100:
        report_lines.append(f"  ... and {len(sorted_ids) - 100} more sample IDs")
    report_lines.append("")
    
    report_lines.append("HETEROGENEITY OR COMMINGLING:")
    report_lines.append("-"*80)
    if seized_data['commingling']['commingling_pages']:
        report_lines.append("  Commingling mentioned on pages:")
        for page in seized_data['commingling']['commingling_pages']:
            report_lines.append(f"    - Page {page}")
    if seized_data['commingling']['heterogeneous_pages']:
        report_lines.append("  Heterogeneous material mentioned on pages:")
        for page in seized_data['commingling']['heterogeneous_pages']:
            report_lines.append(f"    - Page {page}")
    if not seized_data['commingling']['commingling_pages'] and not seized_data['commingling']['heterogeneous_pages']:
        report_lines.append("  No explicit mentions of commingling or heterogeneity found")
    report_lines.append("")
    
    # 4. Evidence Reliability Risk Rating
    report_lines.append("="*80)
    report_lines.append("4. EVIDENCE RELIABILITY RISK RATING")
    report_lines.append("="*80)
    report_lines.append("")
    
    # Determine rating
    rating = "Questionable"
    if (len(defects) == 0 and 
        total_seized and total_tested and 
        crosscheck_data['coverage_pct'] and 
        crosscheck_data['coverage_pct'] >= 50 and
        testing_data['sampling_plans']):
        rating = "Scientifically Valid"
    elif (len(defects) > 3 or 
          (total_seized and total_tested and crosscheck_data['coverage_pct'] and crosscheck_data['coverage_pct'] < 5)):
        rating = "Not Supported by Testing"
    
    report_lines.append(f"RATING: {rating}")
    report_lines.append("")
    report_lines.append("RATIONALE:")
    if rating == "Scientifically Valid":
        report_lines.append("  - Adequate sample coverage")
        report_lines.append("  - Sampling plan documented")
        report_lines.append("  - No major procedural defects identified")
    elif rating == "Questionable":
        report_lines.append("  - Some procedural issues or unclear methodology")
        if defects:
            for defect in defects[:3]:
                report_lines.append(f"  - {defect}")
    else:
        report_lines.append("  - Significant procedural defects or insufficient testing")
        for defect in defects:
            report_lines.append(f"  - {defect}")
    report_lines.append("")
    
    report_lines.append("="*80)
    report_lines.append("END OF REPORT")
    report_lines.append("="*80)
    
    return '\n'.join(report_lines)

def main():
    pdf_path = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
    
    if not Path(pdf_path).exists():
        print(f"ERROR: PDF file not found: {pdf_path}")
        return
    
    print("="*80)
    print("COMPLETE FORENSIC LABORATORY TESTING AUDIT")
    print("="*80)
    
    # Phase 1: OCR
    text_by_page, tables_by_page = phase1_ocr(pdf_path)
    
    # Phase 2: Extract lab testing
    testing_data = phase2_extract_lab_testing(text_by_page, tables_by_page)
    
    # Phase 3: Count seized items
    seized_data = phase3_count_seized_items(text_by_page)
    
    # Phase 4: Cross-check
    crosscheck_data = phase4_crosscheck(testing_data, seized_data, text_by_page)
    
    # Phase 5: Generate report
    report = phase5_generate_report(pdf_path, testing_data, seized_data, crosscheck_data, text_by_page)
    
    # Save report
    output_file = "FORENSIC_AUDIT_COMPLETE_REPORT.txt"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\n[OK] Complete audit report saved to: {output_file}")
    print("\n" + "="*80)
    print("AUDIT COMPLETE")
    print("="*80)

if __name__ == "__main__":
    main()

