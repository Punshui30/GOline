#!/usr/bin/env python3
"""
Comprehensive Forensic Laboratory Testing Audit
Performs complete 5-phase audit of discovery documents
"""

import sys
import re
import json
from pathlib import Path
from collections import defaultdict
from datetime import datetime

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    print("ERROR: pdfplumber required. Install with: pip install pdfplumber")
    sys.exit(1)

try:
    from pdf2image import convert_from_path
    import pytesseract
    HAS_OCR = True
except ImportError:
    print("WARNING: OCR libraries not available. Install with: pip install pdf2image pytesseract pillow")
    print("Continuing with text extraction only...")
    HAS_OCR = False

# Output data structures
audit_data = {
    'coas': [],
    'lab_reports': [],
    'sample_ids': set(),
    'sample_id_details': defaultdict(list),
    'weights': [],
    'potency_tables': [],
    'seized_items': [],
    'evidence_lists': [],
    'testing_coverage': {},
    'scientific_issues': []
}

def print_phase(phase_num, phase_name):
    """Print phase header."""
    print("\n" + "=" * 80)
    print(f"PHASE {phase_num}: {phase_name}")
    print("=" * 80)

def ocr_pdf_page(page_image):
    """Run OCR on a single page image."""
    if not HAS_OCR:
        return ""
    try:
        text = pytesseract.image_to_string(page_image, lang='eng')
        return text
    except Exception as e:
        print(f"  OCR error: {e}")
        return ""

def extract_with_ocr(pdf_path):
    """Extract text from PDF with OCR fallback."""
    print(f"Extracting text from: {pdf_path.name}")
    
    text_by_page = {}
    tables_by_page = {}
    ocr_applied = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            print(f"Total pages: {total_pages}")
            
            for page_num, page in enumerate(pdf.pages):
                page_idx = page_num + 1
                
                # Try text extraction first
                text = page.extract_text()
                
                # If little or no text, try OCR
                if not text or len(text.strip()) < 100:
                    if HAS_OCR:
                        try:
                            print(f"  Page {page_idx}: Low text, applying OCR...")
                            # Convert page to image
                            images = convert_from_path(str(pdf_path), first_page=page_idx, last_page=page_idx)
                            if images:
                                ocr_text = ocr_pdf_page(images[0])
                                if ocr_text and len(ocr_text.strip()) > len(text.strip() if text else ""):
                                    text = ocr_text
                                    ocr_applied.append(page_idx)
                                    print(f"    OCR extracted {len(ocr_text)} characters")
                        except Exception as e:
                            print(f"    OCR failed: {e}")
                
                text_by_page[page_idx] = text or ""
                
                # Extract tables
                tables = page.extract_tables()
                if tables:
                    tables_by_page[page_idx] = tables
                
                if page_idx % 50 == 0:
                    print(f"  Processed {page_idx}/{total_pages} pages")
    
    except Exception as e:
        print(f"Error processing PDF: {e}")
    
    print(f"\nOCR applied to {len(ocr_applied)} pages: {ocr_applied[:10]}{'...' if len(ocr_applied) > 10 else ''}")
    return text_by_page, tables_by_page

def find_coa_patterns(text):
    """Find all COA and lab report patterns."""
    patterns = {
        'coa': [
            r'Certificate\s+of\s+Analysis',
            r'C\.O\.A\.',
            r'C\s+of\s+A',
            r'\bCOA\b'
        ],
        'lab_report': [
            r'Laboratory\s+Report',
            r'Lab\s+Report',
            r'Forensic\s+Chemistry\s+Report',
            r'Forensic\s+Laboratory\s+Report',
            r'Chemistry\s+Report'
        ],
        'forensic': [
            r'Forensic\s+Analysis',
            r'Forensic\s+Testing',
            r'Forensic\s+Lab'
        ]
    }
    
    found = defaultdict(list)
    for category, pattern_list in patterns.items():
        for pattern in pattern_list:
            matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                found[category].append({
                    'match': match.group(0),
                    'start': match.start(),
                    'end': match.end()
                })
    
    return found

def extract_sample_ids_comprehensive(text, page_num):
    """Comprehensive sample ID extraction."""
    # More specific patterns
    patterns = [
        # "Sample ID: XXX" or "Item #: XXX"
        r'(?:Sample\s+ID|Item\s*#|Exhibit\s*#|Evidence\s*#|Specimen\s*#)[\s:]*([A-Z0-9][A-Z0-9\-]{1,20})',
        # "Subsample XXX" or "Batch XXX"
        r'(?:Subsample|Batch|Run|Replicate)[\s#:]*([A-Z0-9][A-Z0-9\-]{1,20})',
        # Alphanumeric codes
        r'\b([A-Z]{1,3}[- ]?\d{2,6}[A-Z]?[- ]?\d{0,4})\b',
        # Evidence numbers
        r'\b([E][- ]?\d{3,6})\b',
        # Case numbers
        r'\b(Case\s*#?\s*[A-Z0-9\-]+)\b',
    ]
    
    sample_ids = []
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            id_val = match.group(1) if match.groups() else match.group(0)
            id_val = id_val.strip()
            
            # Filter out dates and common words
            if re.match(r'^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$', id_val):
                continue
            if len(id_val) < 2 or len(id_val) > 25:
                continue
            
            # Get context
            start = max(0, match.start() - 100)
            end = min(len(text), match.end() + 100)
            context = text[start:end].replace('\n', ' ').strip()
            
            sample_ids.append({
                'id': id_val,
                'page': page_num,
                'context': context,
                'position': match.start()
            })
    
    return sample_ids

def extract_weights(text, page_num):
    """Extract weight measurements."""
    # Weight patterns
    patterns = [
        r'(\d+\.?\d*)\s*(?:grams?|g|G|GRAMS?|Grams?)',
        r'(\d+\.?\d*)\s*(?:pounds?|lbs?|LBS?|Pounds?)',
        r'(\d+\.?\d*)\s*(?:ounces?|oz|OZ|Ounces?)',
        r'Weight[:\s]+(\d+\.?\d*)',
        r'Net\s+Weight[:\s]+(\d+\.?\d*)',
        r'Gross\s+Weight[:\s]+(\d+\.?\d*)',
    ]
    
    weights = []
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            weight_val = match.group(1)
            unit_match = re.search(r'(grams?|g|pounds?|lbs?|ounces?|oz)', match.group(0), re.IGNORECASE)
            unit = unit_match.group(0) if unit_match else "unknown"
            
            weights.append({
                'value': weight_val,
                'unit': unit,
                'page': page_num,
                'context': text[max(0, match.start()-50):min(len(text), match.end()+50)]
            })
    
    return weights

def extract_potency_tables(text, tables, page_num):
    """Extract potency/concentration data from text and tables."""
    potency_data = []
    
    # Look for THC, CBD, concentration patterns
    potency_patterns = [
        r'THC[:\s]+(\d+\.?\d*)\s*%',
        r'CBD[:\s]+(\d+\.?\d*)\s*%',
        r'(\d+\.?\d*)\s*%\s*THC',
        r'(\d+\.?\d*)\s*%\s*CBD',
        r'Potency[:\s]+(\d+\.?\d*)',
        r'Concentration[:\s]+(\d+\.?\d*)',
    ]
    
    for pattern in potency_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            potency_data.append({
                'value': match.group(1),
                'compound': 'THC' if 'THC' in match.group(0).upper() else 'CBD' if 'CBD' in match.group(0).upper() else 'Unknown',
                'page': page_num,
                'context': text[max(0, match.start()-50):min(len(text), match.end()+50)]
            })
    
    # Check tables for potency data
    if tables:
        for table in tables:
            table_text = ' '.join([' '.join([str(cell) for cell in row if cell]) for row in table if row])
            if re.search(r'THC|CBD|potency|concentration', table_text, re.IGNORECASE):
                potency_data.append({
                    'type': 'table',
                    'page': page_num,
                    'table_data': str(table)[:500]
                })
    
    return potency_data

def check_composite_individual(text):
    """Check for composite vs individual testing."""
    composite_keywords = [
        r'\bcomposite\s+(?:sample|specimen|test)\b',
        r'\bhomogenized\s+(?:sample|material)\b',
        r'\bcombined\s+(?:sample|samples)\b',
        r'\bpooled\s+(?:sample|samples)\b',
        r'\brepresentative\s+sample\b',
    ]
    
    individual_keywords = [
        r'\bindividual\s+(?:sample|samples|specimen)\b',
        r'\bseparate\s+(?:sample|samples)\b',
        r'\beach\s+(?:sample|item)\b',
        r'\bdiscrete\s+(?:sample|samples)\b',
    ]
    
    sampling_keywords = [
        r'\bsampling\s+plan\b',
        r'\bsampling\s+method\b',
        r'\bselection\s+method\b',
        r'\brandomization\b',
        r'\brandom\s+sampling\b',
        r'\bhomogenization\s+(?:procedure|method|protocol)\b',
    ]
    
    result = {
        'composite': False,
        'individual': False,
        'sampling_plan': False,
        'homogenization': False,
        'details': []
    }
    
    for pattern in composite_keywords:
        if re.search(pattern, text, re.IGNORECASE):
            result['composite'] = True
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for m in matches:
                start = max(0, m.start() - 100)
                end = min(len(text), m.end() + 100)
                result['details'].append({
                    'type': 'composite',
                    'context': text[start:end].replace('\n', ' ')
                })
    
    for pattern in individual_keywords:
        if re.search(pattern, text, re.IGNORECASE):
            result['individual'] = True
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for m in matches:
                start = max(0, m.start() - 100)
                end = min(len(text), m.end() + 100)
                result['details'].append({
                    'type': 'individual',
                    'context': text[start:end].replace('\n', ' ')
                })
    
    for pattern in sampling_keywords:
        if re.search(pattern, text, re.IGNORECASE):
            result['sampling_plan'] = True
            if 'homogenization' in pattern.lower():
                result['homogenization'] = True
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for m in matches:
                start = max(0, m.start() - 150)
                end = min(len(text), m.end() + 150)
                result['details'].append({
                    'type': 'sampling',
                    'context': text[start:end].replace('\n', ' ')
                })
    
    return result

def find_seized_items(text, page_num):
    """Find property lists, evidence lists, chain of custody."""
    evidence_patterns = [
        r'Property\s+List',
        r'Evidence\s+List',
        r'Chain\s+of\s+Custody',
        r'Evidence\s+Submission',
        r'Photo\s+Log',
        r'Police\s+Evidence',
        r'Items\s+Seized',
        r'Seized\s+Items',
    ]
    
    found = []
    for pattern in evidence_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                start = max(0, match.start() - 200)
                end = min(len(text), match.end() + 500)
                context = text[start:end]
                
                # Try to extract item counts
                count_patterns = [
                    r'(\d+)\s+(?:items?|bags?|containers?|packages?)',
                    r'Total[:\s]+(\d+)',
                    r'Count[:\s]+(\d+)',
                ]
                
                item_count = None
                for cp in count_patterns:
                    cm = re.search(cp, context, re.IGNORECASE)
                    if cm:
                        try:
                            item_count = int(cm.group(1))
                            break
                        except:
                            pass
                
                found.append({
                    'type': match.group(0),
                    'page': page_num,
                    'item_count': item_count,
                    'context': context[:1000]
                })
    
    # Look for commingling/combining indicators
    commingling_patterns = [
        r'\bcombined\b',
        r'\brepackaged\b',
        r'\bcommingled\b',
        r'\bmerged\b',
        r'\bmixed\s+together\b',
    ]
    
    commingling = []
    for pattern in commingling_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                start = max(0, match.start() - 150)
                end = min(len(text), match.end() + 150)
                commingling.append({
                    'term': match.group(0),
                    'page': page_num,
                    'context': text[start:end].replace('\n', ' ')
                })
    
    return found, commingling

def count_samples_tested(text, tables, page_num):
    """Count number of samples tested."""
    counts = []
    
    # Direct count patterns
    count_patterns = [
        r'(\d+)\s+(?:samples?|items?|specimens?)\s+(?:tested|analyzed|examined|submitted)',
        r'(?:tested|analyzed|examined|submitted)\s+(\d+)\s+(?:samples?|items?|specimens?)',
        r'Total\s+Samples[:\s]+(\d+)',
        r'Number\s+of\s+Samples[:\s]+(\d+)',
        r'Samples\s+Tested[:\s]+(\d+)',
    ]
    
    for pattern in count_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            try:
                count = int(match.group(1))
                if 1 <= count <= 10000:
                    counts.append({
                        'count': count,
                        'page': page_num,
                        'context': text[max(0, match.start()-50):min(len(text), match.end()+50)]
                    })
            except:
                pass
    
    # Count from tables
    if tables:
        for table in tables:
            if not table:
                continue
            # Count data rows (exclude headers)
            data_rows = 0
            for row in table[1:]:  # Skip first row (likely header)
                if row and any(cell for cell in row if cell and str(cell).strip()):
                    data_rows += 1
            if data_rows > 0:
                counts.append({
                    'count': data_rows,
                    'page': page_num,
                    'source': 'table',
                    'type': 'estimated_from_table'
                })
    
    return counts

def phase1_ocr_ingest(pdf_path):
    """Phase 1: OCR and ingest all documents."""
    print_phase(1, "INGEST & OCR EVERYTHING")
    
    print(f"Processing: {pdf_path}")
    text_by_page, tables_by_page = extract_with_ocr(pdf_path)
    
    print(f"\n[OK] Text extracted from {len(text_by_page)} pages")
    print(f"[OK] Tables extracted from {len(tables_by_page)} pages")
    print(f"[OK] OCR applied where needed")
    
    return text_by_page, tables_by_page

def phase2_extract_lab_testing(text_by_page, tables_by_page, pdf_path):
    """Phase 2: Extract all lab testing data."""
    print_phase(2, "EXTRACT ALL LAB TESTING")
    
    coa_pages = []
    all_sample_ids = set()
    all_weights = []
    all_potency = []
    composite_individual_info = []
    
    for page_num in sorted(text_by_page.keys()):
        text = text_by_page[page_num]
        tables = tables_by_page.get(page_num, [])
        
        if not text or len(text.strip()) < 50:
            continue
        
        # Find COAs
        coa_matches = find_coa_patterns(text)
        if any(coa_matches.values()):
            coa_pages.append({
                'page': page_num,
                'matches': dict(coa_matches),
                'file': Path(pdf_path).name
            })
            print(f"  Found COA/lab report on page {page_num}")
        
        # Extract sample IDs
        sample_ids = extract_sample_ids_comprehensive(text, page_num)
        for sid in sample_ids:
            all_sample_ids.add(sid['id'])
            audit_data['sample_id_details'][sid['id']].append({
                'page': page_num,
                'context': sid['context']
            })
        
        # Extract weights
        weights = extract_weights(text, page_num)
        all_weights.extend(weights)
        
        # Extract potency
        potency = extract_potency_tables(text, tables, page_num)
        all_potency.extend(potency)
        
        # Check composite/individual
        comp_ind = check_composite_individual(text)
        if comp_ind['composite'] or comp_ind['individual'] or comp_ind['sampling_plan']:
            composite_individual_info.append({
                'page': page_num,
                **comp_ind
            })
        
        # Count samples tested
        sample_counts = count_samples_tested(text, tables, page_num)
        if sample_counts:
            audit_data['testing_coverage'][page_num] = sample_counts
    
    print(f"\n[OK] Found {len(coa_pages)} pages with COA/lab reports")
    print(f"[OK] Extracted {len(all_sample_ids)} unique sample IDs")
    print(f"[OK] Found {len(all_weights)} weight measurements")
    print(f"[OK] Found {len(all_potency)} potency measurements")
    print(f"[OK] Found {len(composite_individual_info)} pages with composite/individual info")
    
    audit_data['coas'] = coa_pages
    audit_data['sample_ids'] = all_sample_ids
    audit_data['weights'] = all_weights
    audit_data['potency_tables'] = all_potency
    audit_data['composite_individual'] = composite_individual_info
    
    return coa_pages, all_sample_ids, all_weights, all_potency, composite_individual_info

def phase3_count_seized_items(text_by_page):
    """Phase 3: Count total items seized."""
    print_phase(3, "COUNT TOTAL ITEMS SEIZED")
    
    evidence_lists = []
    all_commingling = []
    total_items_seized = None
    
    for page_num in sorted(text_by_page.keys()):
        text = text_by_page[page_num]
        if not text:
            continue
        
        evidence, commingling = find_seized_items(text, page_num)
        if evidence:
            evidence_lists.extend(evidence)
            print(f"  Found evidence list on page {page_num}")
        if commingling:
            all_commingling.extend(commingling)
            print(f"  Found commingling indicator on page {page_num}")
    
    # Try to determine total items
    item_counts = [e['item_count'] for e in evidence_lists if e['item_count']]
    if item_counts:
        total_items_seized = max(item_counts)  # Take highest count found
        print(f"\n[OK] Found evidence lists on {len(evidence_lists)} pages")
        print(f"[OK] Total items seized (from evidence lists): {total_items_seized}")
    else:
        print(f"\n[OK] Found evidence lists on {len(evidence_lists)} pages")
        print(f"[WARNING] Could not determine exact total items seized from text")
    
    audit_data['evidence_lists'] = evidence_lists
    audit_data['commingling'] = all_commingling
    audit_data['total_items_seized'] = total_items_seized
    
    return evidence_lists, all_commingling, total_items_seized

def phase4_crosscheck_coverage():
    """Phase 4: Cross-check testing coverage and scientific validity."""
    print_phase(4, "CROSS-CHECK TESTING COVERAGE")
    
    # Count total samples tested
    total_samples_tested = len(audit_data['sample_ids'])
    
    # Get sample counts from testing coverage data
    explicit_counts = []
    for page, counts in audit_data['testing_coverage'].items():
        for count_data in counts:
            if isinstance(count_data, dict) and 'count' in count_data:
                explicit_counts.append(count_data['count'])
    
    if explicit_counts:
        max_explicit_count = max(explicit_counts)
        print(f"  Explicit sample counts found: {explicit_counts}")
        print(f"  Maximum explicit count: {max_explicit_count}")
    else:
        max_explicit_count = total_samples_tested
        print(f"  Using unique sample ID count: {total_samples_tested}")
    
    total_seized = audit_data['total_items_seized']
    
    # Calculate coverage
    if total_seized and max_explicit_count:
        coverage_percent = (max_explicit_count / total_seized) * 100
        print(f"\n  Items Seized: {total_seized}")
        print(f"  Samples Tested: {max_explicit_count}")
        print(f"  Coverage: {coverage_percent:.1f}%")
    else:
        coverage_percent = None
        print(f"\n  ⚠ Cannot calculate coverage - missing seized or tested count")
    
    # Check for scientific issues
    issues = []
    
    # Check for homogenization
    has_homogenization = any(ci.get('homogenization', False) for ci in audit_data['composite_individual'])
    if not has_homogenization:
        issues.append({
            'issue': 'No homogenization documented',
            'severity': 'high',
            'description': 'No evidence of homogenization procedure found in documents'
        })
    
    # Check for sampling plan
    has_sampling_plan = any(ci.get('sampling_plan', False) for ci in audit_data['composite_individual'])
    if not has_sampling_plan:
        issues.append({
            'issue': 'No sampling plan documented',
            'severity': 'high',
            'description': 'No evidence of documented sampling plan, randomization, or selection method'
        })
    
    # Check coverage
    if coverage_percent and coverage_percent < 10:
        issues.append({
            'issue': 'Low testing coverage',
            'severity': 'high',
            'description': f'Only {coverage_percent:.1f}% of seized items tested - may not be statistically representative'
        })
    elif coverage_percent and coverage_percent < 50:
        issues.append({
            'issue': 'Moderate testing coverage',
            'severity': 'medium',
            'description': f'{coverage_percent:.1f}% of seized items tested - may require justification for representativeness'
        })
    
    # Check for composite without justification
    has_composite = any(ci.get('composite', False) for ci in audit_data['composite_individual'])
    if has_composite and not has_sampling_plan:
        issues.append({
            'issue': 'Composite testing without documented sampling plan',
            'severity': 'high',
            'description': 'Composite samples used but no sampling plan or justification documented'
        })
    
    audit_data['scientific_issues'] = issues
    audit_data['coverage_percent'] = coverage_percent
    audit_data['total_samples_tested'] = max_explicit_count
    
    print(f"\n[OK] Identified {len(issues)} scientific issues")
    
    return issues, coverage_percent

def phase5_generate_output():
    """Phase 5: Generate final output."""
    print_phase(5, "GENERATE FINAL OUTPUT")
    
    output = []
    output.append("=" * 80)
    output.append("COMPREHENSIVE FORENSIC LABORATORY TESTING AUDIT")
    output.append("=" * 80)
    output.append(f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    output.append("")
    
    # 1. Final Summary (Plain English)
    output.append("=" * 80)
    output.append("1. FINAL SUMMARY (PLAIN ENGLISH)")
    output.append("=" * 80)
    output.append("")
    
    total_seized = audit_data['total_items_seized'] or "UNKNOWN"
    total_tested = audit_data['total_samples_tested'] or len(audit_data['sample_ids'])
    coverage = audit_data['coverage_percent']
    
    output.append(f"Total Items Seized: {total_seized}")
    output.append(f"Total Samples Actually Tested: {total_tested}")
    output.append("")
    
    if coverage:
        if coverage >= 100:
            output.append(f"Testing Coverage: {coverage:.1f}% (All items tested)")
        elif coverage >= 50:
            output.append(f"Testing Coverage: {coverage:.1f}% (Majority tested)")
        elif coverage >= 10:
            output.append(f"Testing Coverage: {coverage:.1f}% (Subset tested)")
        else:
            output.append(f"Testing Coverage: {coverage:.1f}% (Small subset tested)")
    else:
        output.append("Testing Coverage: UNKNOWN (Cannot determine from available data)")
    
    output.append("")
    
    # Scientific justification
    issues = audit_data['scientific_issues']
    high_severity = [i for i in issues if i['severity'] == 'high']
    
    if high_severity:
        output.append("State's Aggregate Weight Charge: NOT SCIENTIFICALLY JUSTIFIED")
        output.append("")
        output.append("Key Deficiencies:")
        for issue in high_severity:
            output.append(f"  • {issue['issue']}: {issue['description']}")
    else:
        output.append("State's Aggregate Weight Charge: REQUIRES REVIEW")
        output.append("")
        if issues:
            output.append("Issues Identified:")
            for issue in issues:
                output.append(f"  • {issue['issue']}: {issue['description']}")
    
    output.append("")
    
    # 2. Technical Compliance Review
    output.append("=" * 80)
    output.append("2. TECHNICAL COMPLIANCE REVIEW")
    output.append("=" * 80)
    output.append("")
    
    output.append("SWGDRUG Sampling Guidelines Compliance:")
    output.append("-" * 80)
    
    has_sampling_plan = any(ci.get('sampling_plan', False) for ci in audit_data['composite_individual'])
    has_homogenization = any(ci.get('homogenization', False) for ci in audit_data['composite_individual'])
    
    output.append(f"  Sampling Plan Documented: {'YES' if has_sampling_plan else 'NO'}")
    output.append(f"  Homogenization Procedure: {'YES' if has_homogenization else 'NO'}")
    output.append(f"  Random Sampling: {'UNKNOWN' if not has_sampling_plan else 'CHECK DOCUMENTS'}")
    output.append("")
    
    if not has_sampling_plan:
        output.append("  DEVIATION: No documented sampling plan found")
    if not has_homogenization:
        output.append("  DEVIATION: No documented homogenization procedure found")
    
    output.append("")
    output.append("ASTM Standards Compliance:")
    output.append("-" * 80)
    output.append("  ASTM E2329 (Chemical Evidence Processing): Requires documented sampling")
    output.append("  ASTM E2548 (Sampling Plans): Requires statistical justification")
    output.append("  ASTM E2917 (Uncertainty): Requires uncertainty of measurement")
    output.append("")
    output.append("  Status: Compliance cannot be verified without documented sampling plan")
    output.append("")
    
    # 3. Detailed Findings
    output.append("=" * 80)
    output.append("3. DETAILED FINDINGS")
    output.append("=" * 80)
    output.append("")
    
    output.append("COA/Lab Report Pages:")
    output.append("-" * 80)
    for coa in audit_data['coas']:
        output.append(f"  Page {coa['page']}: {coa['file']}")
        for category, matches in coa['matches'].items():
            if matches:
                output.append(f"    - Found {len(matches)} {category} indicators")
    output.append("")
    
    output.append(f"Sample IDs Extracted ({len(audit_data['sample_ids'])} unique):")
    output.append("-" * 80)
    sorted_ids = sorted(audit_data['sample_ids'])
    for sid in sorted_ids[:100]:  # First 100
        locations = audit_data['sample_id_details'][sid]
        pages = sorted(set([loc['page'] for loc in locations]))
        output.append(f"  {sid}: Pages {', '.join(map(str, pages[:10]))}" + 
                     (f" (+{len(pages)-10} more)" if len(pages) > 10 else ""))
    if len(sorted_ids) > 100:
        output.append(f"  ... and {len(sorted_ids) - 100} more sample IDs")
    output.append("")
    
    output.append("Composite/Individual Testing:")
    output.append("-" * 80)
    for ci in audit_data['composite_individual']:
        output.append(f"  Page {ci['page']}:")
        if ci.get('composite'):
            output.append("    - Composite testing indicated")
        if ci.get('individual'):
            output.append("    - Individual testing indicated")
        if ci.get('sampling_plan'):
            output.append("    - Sampling plan mentioned")
        if ci.get('homogenization'):
            output.append("    - Homogenization mentioned")
    output.append("")
    
    output.append("Commingling/Combining Indicators:")
    output.append("-" * 80)
    for comm in audit_data['commingling']:
        output.append(f"  Page {comm['page']}: {comm['term']}")
        output.append(f"    Context: {comm['context'][:200]}...")
    output.append("")
    
    # 4. Evidence Reliability Risk Rating
    output.append("=" * 80)
    output.append("4. EVIDENCE RELIABILITY RISK RATING")
    output.append("=" * 80)
    output.append("")
    
    if high_severity:
        rating = "NOT SUPPORTED BY TESTING"
        reason = "Multiple high-severity scientific deficiencies identified"
    elif issues:
        rating = "QUESTIONABLE"
        reason = "Some scientific concerns identified"
    else:
        rating = "SCIENTIFICALLY VALID"
        reason = "No major scientific issues identified"
    
    output.append(f"Rating: {rating}")
    output.append(f"Reason: {reason}")
    output.append("")
    
    if high_severity:
        output.append("High-Severity Issues:")
        for issue in high_severity:
            output.append(f"  • {issue['issue']}")
            output.append(f"    {issue['description']}")
    
    output.append("")
    output.append("=" * 80)
    output.append("END OF REPORT")
    output.append("=" * 80)
    
    return '\n'.join(output)

# Main execution
if __name__ == "__main__":
    pdf_path = Path(r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf")
    
    if not pdf_path.exists():
        print(f"ERROR: PDF not found: {pdf_path}")
        sys.exit(1)
    
    print("\n" + "=" * 80)
    print("COMPREHENSIVE FORENSIC LABORATORY TESTING AUDIT")
    print("=" * 80)
    
    # Phase 1
    text_by_page, tables_by_page = phase1_ocr_ingest(pdf_path)
    
    # Phase 2
    phase2_extract_lab_testing(text_by_page, tables_by_page, pdf_path)
    
    # Phase 3
    phase3_count_seized_items(text_by_page)
    
    # Phase 4
    phase4_crosscheck_coverage()
    
    # Phase 5
    report = phase5_generate_output()
    
    # Save report
    output_file = "COMPREHENSIVE_FORENSIC_AUDIT_REPORT.txt"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\n[OK] Report saved to: {output_file}")
    print("\n" + "=" * 80)
    print("AUDIT COMPLETE")
    print("=" * 80)
    
    # Print summary
    print("\n" + report.split("1. FINAL SUMMARY")[1].split("2. TECHNICAL")[0])

