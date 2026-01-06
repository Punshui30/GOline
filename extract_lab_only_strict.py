#!/usr/bin/env python3
"""
Clean reset: Extract ONLY confirmed laboratory testing documents
STRICT: HIGH confidence only, excludes chain-of-custody, forms, etc.
"""

import re
from pathlib import Path
from collections import defaultdict

try:
    import pdfplumber
    from PyPDF2 import PdfReader, PdfWriter
    HAS_LIBS = True
except ImportError:
    HAS_LIBS = False

PDF_PATH = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
OUTPUT_DIR = Path(r"C:\Users\simmo\Desktop\audit\LAB_ONLY_RESET")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

LAB_PACKET_PDF = OUTPUT_DIR / "LAB_ONLY_PACKET.pdf"
LAB_INDEX_CSV = OUTPUT_DIR / "lab_only_index.csv"
LAB_SUMMARY_TXT = OUTPUT_DIR / "lab_only_summary.txt"

# STRICT inclusion patterns - must be clearly lab testing documents
FSD_PATTERNS = {
    'lab_report': [
        r'\blaboratory\s+report\b',
        r'\blab\s+report\b',
        r'forensic\s+analysis\s+report',
        r'controlled\s+dangerous\s+substance\s+analysis\s+report',
    ],
    'analyst': [
        r'\banalyst[:\s]+[A-Z]',
        r'analyzed\s+by[:\s]+[A-Z]',
        r'analyst\s+name[:\s]+[A-Z]',
        r'signed\s+by\s+analyst',
    ],
    'results_section': [
        r'\bresult[s]?\b.*\d+\.?\d*\s*%',
        r'analytical\s+result[s]?',
        r'test\s+result[s]?',
        r'findings[:\s]+',
    ],
    'method_section': [
        r'\bmethod[:\s]+',
        r'instrumentation[:\s]+',
        r'analytical\s+method',
        r'test\s+method',
        r'gc[- ]?ms',
        r'hplc',
        r'gas\s+chromatography',
    ],
    'fsd_branding': [
        r'maryland\s+state\s+police',
        r'forensic\s+sciences?\s+division',
        r'\bfsd\b',
    ],
}

NMS_PATTERNS = {
    'coa': [
        r'certificate\s+of\s+analysis',
        r'\bcoa\b',
    ],
    'nms_branding': [
        r'\bnms\s+labs?\b',
        r'\bnms\b.*laboratory',
        r'national\s+medical\s+services',
    ],
    'analyte_table': [
        r'analyte.*concentration',
        r'analyte.*result',
        r'cannabinoid.*analysis',
    ],
    'results': [
        r'\bresult[s]?\b.*\d+\.?\d*\s*%',
        r'quantitative\s+result',
    ],
}

LIGHTLAB_PATTERNS = {
    'lightlab_branding': [
        r'lightlab',
        r'orange\s+photonics',
        r'orange.*photonics',
    ],
    'instrument_output': [
        r'instrument\s+readout',
        r'device\s+output',
        r'sample\s+scan',
    ],
}

# EXCLUSION patterns - explicitly exclude these
EXCLUSION_PATTERNS = [
    r'notice\s+of\s+seizure',
    r'property\s+receipt',
    r'chain\s+of\s+custody.*only',
    r'submission\s+form',
    r'request\s+for\s+laboratory\s+examination',
    r'evidence\s+log',
    r'inventory\s+list',
    r'court\s+filing',
    r'warrant',
    r'administrative',
]

def is_excluded(text: str) -> bool:
    """Check if page should be excluded."""
    text_lower = text.lower()
    
    # Check exclusion patterns
    for pattern in EXCLUSION_PATTERNS:
        if re.search(pattern, text_lower):
            return True
    
    # Exclude if it's ONLY a submission/request form without results
    if re.search(r'request\s+for\s+laboratory\s+examination', text_lower):
        # Must have results or analysis to include
        if not re.search(r'\bresult[s]?\b.*\d+\.?\d*\s*%', text_lower):
            return True
    
    # Exclude chain-of-custody ONLY pages (without analysis)
    if re.search(r'chain\s+of\s+custody', text_lower):
        # Must have lab report content to include
        if not any(re.search(p, text_lower) for pattern_list in [FSD_PATTERNS.values(), NMS_PATTERNS.values()] for p in pattern_list):
            return True
    
    return False

def classify_lab_page(text: str) -> tuple[bool, str, str]:
    """
    Classify if page is a lab testing document.
    Returns: (is_lab, lab_name, doc_type)
    HIGH confidence only - must have strong indicators.
    """
    if not text or len(text.strip()) < 100:
        return (False, "", "")
    
    text_lower = text.lower()
    
    # Check exclusions first
    if is_excluded(text):
        return (False, "", "")
    
    # Check FSD
    fsd_score = 0
    has_fsd_branding = False
    has_lab_report = False
    has_analyst = False
    has_results = False
    has_method = False
    
    for pattern in FSD_PATTERNS['fsd_branding']:
        if re.search(pattern, text_lower):
            has_fsd_branding = True
            fsd_score += 1
            break
    
    for pattern in FSD_PATTERNS['lab_report']:
        if re.search(pattern, text_lower):
            has_lab_report = True
            fsd_score += 1
            break
    
    for pattern in FSD_PATTERNS['analyst']:
        if re.search(pattern, text_lower):
            has_analyst = True
            fsd_score += 1
            break
    
    for pattern in FSD_PATTERNS['results_section']:
        if re.search(pattern, text_lower):
            has_results = True
            fsd_score += 1
            break
    
    for pattern in FSD_PATTERNS['method_section']:
        if re.search(pattern, text_lower):
            has_method = True
            fsd_score += 1
            break
    
    # FSD requires: branding + (lab_report OR (analyst AND results AND method))
    if has_fsd_branding and (has_lab_report or (has_analyst and has_results and has_method)):
        return (True, "FSD", "Lab Report")
    
    # Check NMS
    has_nms_branding = any(re.search(p, text_lower) for p in NMS_PATTERNS['nms_branding'])
    has_coa = any(re.search(p, text_lower) for p in NMS_PATTERNS['coa'])
    has_nms_results = any(re.search(p, text_lower) for p in NMS_PATTERNS['results'])
    has_analyte_table = any(re.search(p, text_lower) for p in NMS_PATTERNS['analyte_table'])
    
    # NMS requires: branding + (COA OR (results OR analyte_table))
    if has_nms_branding and (has_coa or has_nms_results or has_analyte_table):
        doc_type = "COA" if has_coa else "Lab Report"
        return (True, "NMS", doc_type)
    
    # Check LightLab
    has_lightlab_branding = any(re.search(p, text_lower) for p in LIGHTLAB_PATTERNS['lightlab_branding'])
    has_instrument_output = any(re.search(p, text_lower) for p in LIGHTLAB_PATTERNS['instrument_output'])
    
    # LightLab requires: branding + instrument output
    if has_lightlab_branding and has_instrument_output:
        return (True, "LightLab", "Instrument Output")
    
    # If we have LightLab branding and results/numbers, include it
    if has_lightlab_branding and re.search(r'\d+\.?\d*\s*%', text):
        return (True, "LightLab", "Instrument Output")
    
    return (False, "", "")

def extract_lab_only():
    """Extract ONLY confirmed lab testing pages."""
    global HAS_LIBS
    
    if not Path(PDF_PATH).exists():
        print(f"ERROR: PDF not found: {PDF_PATH}")
        return
    
    if not HAS_LIBS:
        import subprocess
        import sys
        print("Installing required libraries...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "PyPDF2", "-q"])
        import pdfplumber as pdfplumber_module
        from PyPDF2 import PdfReader, PdfWriter
        globals()['pdfplumber'] = pdfplumber_module
        HAS_LIBS = True
    
    from PyPDF2 import PdfReader, PdfWriter
    
    print("Scanning PDF for lab testing documents only (STRICT mode)...")
    
    pdf_module = pdfplumber if HAS_LIBS else None
    lab_pages = []
    
    # Step 1: Scan all pages
    with pdf_module.open(PDF_PATH) as pdf:
        total_pages = len(pdf.pages)
        print(f"Total pages: {total_pages}")
        
        for page_num in range(1, total_pages + 1):
            if page_num % 100 == 0:
                print(f"  Processing page {page_num}/{total_pages}...")
            
            try:
                page = pdf.pages[page_num - 1]
                text = page.extract_text() or ""
                
                is_lab, lab_name, doc_type = classify_lab_page(text)
                
                if is_lab:
                    lab_pages.append({
                        'page': page_num,
                        'lab_name': lab_name,
                        'doc_type': doc_type
                    })
            
            except Exception as e:
                print(f"  Error processing page {page_num}: {e}")
                continue
    
    print(f"\nFound {len(lab_pages)} lab testing pages (HIGH confidence only)")
    
    if not lab_pages:
        print("No lab pages found!")
        return
    
    # Step 2: Group into blocks (same lab, consecutive pages)
    blocks = []
    if lab_pages:
        current_block = {
            'start': lab_pages[0]['page'],
            'end': lab_pages[0]['page'],
            'lab_name': lab_pages[0]['lab_name'],
            'doc_type': lab_pages[0]['doc_type'],
            'pages': [lab_pages[0]['page']]
        }
        
        for page_info in lab_pages[1:]:
            page_num = page_info['page']
            
            # Same lab and consecutive (or within 1 page gap)
            if (page_info['lab_name'] == current_block['lab_name'] and
                page_num <= current_block['end'] + 1):
                current_block['end'] = page_num
                current_block['pages'].append(page_num)
            else:
                # Start new block
                blocks.append(current_block)
                current_block = {
                    'start': page_num,
                    'end': page_num,
                    'lab_name': page_info['lab_name'],
                    'doc_type': page_info['doc_type'],
                    'pages': [page_num]
                }
        
        blocks.append(current_block)
    
    print(f"Grouped into {len(blocks)} lab blocks")
    
    # Step 3: Create PDF packet
    print("\nCreating LAB_ONLY_PACKET.pdf...")
    reader = PdfReader(PDF_PATH)
    writer = PdfWriter()
    
    for page_info in lab_pages:
        writer.add_page(reader.pages[page_info['page'] - 1])
    
    with open(LAB_PACKET_PDF, 'wb') as f:
        writer.write(f)
    
    print(f"  Saved {len(lab_pages)} pages to {LAB_PACKET_PDF}")
    
    # Step 4: Write CSV index
    import csv
    csv_rows = []
    for block_idx, block in enumerate(blocks, 1):
        block_id = f"BLOCK_{block_idx:03d}"
        csv_rows.append({
            'lab_block_id': block_id,
            'lab_name': block['lab_name'],
            'document_type': block['doc_type'],
            'original_page_start': block['start'],
            'original_page_end': block['end'],
            'page_count': len(block['pages']),
            'confidence': 'HIGH'
        })
    
    with open(LAB_INDEX_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'lab_block_id', 'lab_name', 'document_type', 'original_page_start',
            'original_page_end', 'page_count', 'confidence'
        ])
        writer.writeheader()
        writer.writerows(csv_rows)
    
    print(f"  Saved index to {LAB_INDEX_CSV}")
    
    # Step 5: Write summary
    with open(LAB_SUMMARY_TXT, 'w', encoding='utf-8') as f:
        for block_idx, block in enumerate(blocks, 1):
            block_id = f"BLOCK_{block_idx:03d}"
            f.write(f"{block_id}: ")
            f.write(f"This is a {block['doc_type']} from {block['lab_name']} ")
            f.write(f"consisting of {len(block['pages'])} pages ")
            f.write(f"(original pages {block['start']}-{block['end']}).\n\n")
    
    print(f"  Saved summary to {LAB_SUMMARY_TXT}")
    print("\nExtraction complete!")

if __name__ == "__main__":
    extract_lab_only()















