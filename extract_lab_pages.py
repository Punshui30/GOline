#!/usr/bin/env python3
"""
Extract all laboratory report pages from discovery PDF
Creates LAB_PACKET.pdf and lab_packet_index.csv
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
OUTPUT_DIR = Path(r"C:\Users\simmo\Desktop\audit\lab_extraction")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

LAB_PACKET_PDF = OUTPUT_DIR / "LAB_PACKET.pdf"
LAB_PACKET_INDEX_CSV = OUTPUT_DIR / "lab_packet_index.csv"
LAB_BLOCKS_SUMMARY = OUTPUT_DIR / "lab_blocks_summary.txt"

# Strong lab report markers (case-insensitive)
LAB_MARKERS = {
    'laboratory_report': [
        r'\blaboratory\s+report\b',
        r'\blab\s+report\b',
        r'forensic\s+laboratory',
        r'forensic\s+lab',
    ],
    'analyst': [
        r'\banalyst\b',
        r'analyzed\s+by',
        r'analyst\s+name',
    ],
    'submission': [
        r'submitted\s+by',
        r'submission',
        r'received\s+by',
    ],
    'case_number': [
        r'case\s+number',
        r'case\s*#',
        r'case\s+no',
    ],
    'item_description': [
        r'item\s+description',
        r'specimen\s+description',
        r'sample\s+description',
    ],
    'results': [
        r'\bresult[s]?\b',
        r'test\s+result[s]?',
        r'analytical\s+result[s]?',
    ],
    'method': [
        r'\bmethod\b',
        r'instrumentation',
        r'analytical\s+method',
        r'test\s+method',
    ],
    'nms': [
        r'\bnms\s+labs?\b',
        r'\bnms\b',
        r'national\s+medical\s+services',
    ],
    'msp_fsd': [
        r'maryland\s+state\s+police',
        r'forensic\s+sciences?\s+division',
        r'\bfsd\b',
    ],
    'coa': [
        r'certificate\s+of\s+analysis',
        r'\bcoa\b',
    ],
    'accession': [
        r'\baccession\b',
        r'accession\s+number',
        r'accession\s*#',
    ],
    'specimen': [
        r'\bspecimen\b',
        r'specimen\s+id',
    ],
    'batch': [
        r'\bbatch\b',
        r'batch\s+number',
    ],
}

LAB_NAMES = {
    'nms': ['nms', 'national medical services'],
    'msp_fsd': ['maryland state police', 'fsd', 'forensic sciences division'],
    'unknown': []
}

def score_page_as_lab(text: str) -> tuple[float, list, str, str]:
    """
    Score a page as LAB or NOT LAB.
    Returns: (score, matched_markers, lab_name, doc_title)
    """
    if not text or len(text.strip()) < 50:
        return (0.0, [], "", "")
    
    text_lower = text.lower()
    score = 0.0
    matched_markers = []
    
    # Score based on markers
    for marker_name, patterns in LAB_MARKERS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                score += 1.0
                matched_markers.append(marker_name)
                break  # Count each marker type only once
    
    # Additional scoring for strong indicators
    if any(term in text_lower for term in ['delta-9', 'thca', 'thc', 'cannabinoid']) and '%' in text:
        score += 0.5  # Cannabinoid analysis is a strong lab indicator
    
    # Detect lab name
    lab_name = ""
    for name_key, name_terms in LAB_NAMES.items():
        if name_key == 'unknown':
            continue
        if any(term in text_lower for term in name_terms):
            lab_name = name_key.upper() if name_key != 'msp_fsd' else 'MSP FSD'
            break
    
    # Extract document title (first line or header-like text)
    doc_title = ""
    lines = text.split('\n')[:10]  # Check first 10 lines
    for line in lines:
        line_clean = line.strip()
        if len(line_clean) > 10 and len(line_clean) < 100:
            if any(term in line_clean.lower() for term in ['report', 'certificate', 'analysis', 'laboratory', 'lab']):
                doc_title = line_clean[:100]
                break
    
    # Determine confidence
    if score >= 4:
        confidence = "HIGH"
    elif score >= 2:
        confidence = "MED"
    else:
        confidence = "LOW"
    
    return (score, list(set(matched_markers)), lab_name, doc_title)

def extract_lab_pages():
    """Extract lab pages from PDF and create packet."""
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
    
    # Use the modules
    pdf_module = pdfplumber if HAS_LIBS else None
    if not pdf_module:
        print("ERROR: pdfplumber not available")
        return
    
    from PyPDF2 import PdfReader, PdfWriter
    
    print("Scanning PDF for lab report pages...")
    
    # Step 1: Scan all pages and identify lab pages
    lab_pages = []
    
    with pdf_module.open(PDF_PATH) as pdf:
        total_pages = len(pdf.pages)
        print(f"Total pages: {total_pages}")
        
        for page_num in range(1, total_pages + 1):
            if page_num % 100 == 0:
                print(f"  Processing page {page_num}/{total_pages}...")
            
            try:
                page = pdf.pages[page_num - 1]
                text = page.extract_text() or ""
                
                score, markers, lab_name, doc_title = score_page_as_lab(text)
                
                # Include page if score >= 2.0 (has at least 2 markers)
                if score >= 2.0:
                    lab_pages.append({
                        'original_page': page_num,
                        'score': score,
                        'markers': markers,
                        'lab_name': lab_name,
                        'doc_title': doc_title,
                        'confidence': "HIGH" if score >= 4 else "MED" if score >= 2 else "LOW"
                    })
            
            except Exception as e:
                print(f"  Error processing page {page_num}: {e}")
                continue
    
    print(f"\nFound {len(lab_pages)} lab pages")
    
    if not lab_pages:
        print("No lab pages found!")
        return
    
    # Step 2: Group consecutive pages into blocks
    blocks = []
    current_block = {
        'start': lab_pages[0]['original_page'],
        'end': lab_pages[0]['original_page'],
        'pages': [lab_pages[0]],
        'lab_name': lab_pages[0]['lab_name'],
        'doc_title': lab_pages[0]['doc_title']
    }
    
    for page_info in lab_pages[1:]:
        page_num = page_info['original_page']
        
        # If page is consecutive or within 2 pages, add to current block
        if page_num <= current_block['end'] + 2:
            current_block['end'] = page_num
            current_block['pages'].append(page_info)
            # Update block lab_name/doc_title if more specific
            if page_info['lab_name'] and not current_block['lab_name']:
                current_block['lab_name'] = page_info['lab_name']
            if page_info['doc_title'] and not current_block['doc_title']:
                current_block['doc_title'] = page_info['doc_title']
        else:
            # Start new block
            blocks.append(current_block)
            current_block = {
                'start': page_num,
                'end': page_num,
                'pages': [page_info],
                'lab_name': page_info['lab_name'],
                'doc_title': page_info['doc_title']
            }
    
    blocks.append(current_block)
    
    print(f"Grouped into {len(blocks)} blocks")
    
    # Step 3: Create lab packet PDF
    print("\nCreating LAB_PACKET.pdf...")
    reader = PdfReader(PDF_PATH)
    writer = PdfWriter()
    
    lab_packet_index = []
    lab_packet_page_num = 1
    
    for block_idx, block in enumerate(blocks, 1):
        block_id = f"BLOCK_{block_idx:03d}"
        original_range = f"{block['start']}-{block['end']}"
        
        for page_info in block['pages']:
            original_page = page_info['original_page']
            
            # Add page to output PDF
            writer.add_page(reader.pages[original_page - 1])
            
            # Add to index
            lab_packet_index.append({
                'original_page': original_page,
                'lab_packet_page': lab_packet_page_num,
                'block_id': block_id,
                'block_page_range_original': original_range,
                'detected_lab_name': page_info['lab_name'] or 'Unknown',
                'detected_doc_title': page_info['doc_title'][:100] if page_info['doc_title'] else '',
                'matched_markers': ', '.join(page_info['markers']),
                'confidence': page_info['confidence']
            })
            
            lab_packet_page_num += 1
    
    # Write PDF
    with open(LAB_PACKET_PDF, 'wb') as f:
        writer.write(f)
    
    print(f"  Saved {len(lab_packet_index)} pages to {LAB_PACKET_PDF}")
    
    # Step 4: Write CSV index
    import csv
    with open(LAB_PACKET_INDEX_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'original_page', 'lab_packet_page', 'block_id', 'block_page_range_original',
            'detected_lab_name', 'detected_doc_title', 'matched_markers', 'confidence'
        ])
        writer.writeheader()
        writer.writerows(lab_packet_index)
    
    print(f"  Saved index to {LAB_PACKET_INDEX_CSV}")
    
    # Step 5: Write blocks summary
    with open(LAB_BLOCKS_SUMMARY, 'w', encoding='utf-8') as f:
        f.write("LAB BLOCKS SUMMARY\n")
        f.write("=" * 80 + "\n\n")
        
        for block_idx, block in enumerate(blocks, 1):
            block_id = f"BLOCK_{block_idx:03d}"
            f.write(f"Block ID: {block_id}\n")
            f.write(f"  Original Page Range: {block['start']}-{block['end']} ({len(block['pages'])} pages)\n")
            f.write(f"  Detected Lab Name: {block['lab_name'] or 'Unknown'}\n")
            if block['doc_title']:
                f.write(f"  Detected Document Title: {block['doc_title'][:100]}\n")
            f.write("\n")
    
    print(f"  Saved summary to {LAB_BLOCKS_SUMMARY}")
    print("\nExtraction complete!")

if __name__ == "__main__":
    extract_lab_pages()

