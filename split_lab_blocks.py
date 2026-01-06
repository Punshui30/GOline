#!/usr/bin/env python3
"""
Split LAB_PACKET.pdf into separate PDFs per block_id
"""

from pathlib import Path
import csv

try:
    from PyPDF2 import PdfReader, PdfWriter
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

LAB_PACKET_PDF = Path(r"C:\Users\simmo\Desktop\audit\lab_extraction\LAB_PACKET.pdf")
LAB_PACKET_INDEX_CSV = Path(r"C:\Users\simmo\Desktop\audit\lab_extraction\lab_packet_index.csv")
BLOCKS_DIR = Path(r"C:\Users\simmo\Desktop\audit\lab_extraction\blocks")
BLOCKS_DIR.mkdir(parents=True, exist_ok=True)

MANIFEST_CSV = BLOCKS_DIR / "lab_blocks_manifest.csv"

def split_lab_blocks():
    """Split lab packet into individual block PDFs."""
    global HAS_PYPDF2
    
    if not HAS_PYPDF2:
        import subprocess
        import sys
        print("Installing PyPDF2...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "PyPDF2", "-q"])
    
    from PyPDF2 import PdfReader, PdfWriter
    HAS_PYPDF2 = True
    
    if not LAB_PACKET_PDF.exists():
        print(f"ERROR: {LAB_PACKET_PDF} not found!")
        return
    
    if not LAB_PACKET_INDEX_CSV.exists():
        print(f"ERROR: {LAB_PACKET_INDEX_CSV} not found!")
        return
    
    # Read index to get block information
    blocks = {}
    with open(LAB_PACKET_INDEX_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            block_id = row['block_id']
            lab_packet_page = int(row['lab_packet_page'])
            original_range = row['block_page_range_original']
            lab_name = row['detected_lab_name']
            doc_title = row['detected_doc_title']
            
            if block_id not in blocks:
                blocks[block_id] = {
                    'pages': [],
                    'original_range': original_range,
                    'lab_name': lab_name,
                    'doc_title': doc_title
                }
            blocks[block_id]['pages'].append(lab_packet_page - 1)  # 0-indexed
    
    print(f"Found {len(blocks)} blocks to split")
    
    # Read the lab packet PDF
    reader = PdfReader(LAB_PACKET_PDF)
    
    # Create manifest
    manifest_rows = []
    
    # Split each block
    for block_id, block_info in sorted(blocks.items()):
        pages = sorted(block_info['pages'])
        original_range = block_info['original_range']
        lab_name = block_info['lab_name']
        doc_title = block_info['doc_title']
        
        # Create output filename
        start_page, end_page = original_range.split('-')
        output_filename = f"LAB_BLOCK_{block_id}_origpages_{start_page}-{end_page}.pdf"
        output_path = BLOCKS_DIR / output_filename
        
        # Create PDF for this block
        writer = PdfWriter()
        for page_idx in pages:
            writer.add_page(reader.pages[page_idx])
        
        with open(output_path, 'wb') as f:
            writer.write(f)
        
        print(f"  Created {output_filename} ({len(pages)} pages)")
        
        # Add to manifest
        manifest_rows.append({
            'block_id': block_id,
            'original_page_range': original_range,
            'output_pdf_filename': output_filename,
            'detected_lab_name': lab_name,
            'detected_doc_title': doc_title[:100] if doc_title else ''
        })
    
    # Write manifest
    with open(MANIFEST_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'block_id', 'original_page_range', 'output_pdf_filename',
            'detected_lab_name', 'detected_doc_title'
        ])
        writer.writeheader()
        writer.writerows(manifest_rows)
    
    print(f"\nSaved manifest to {MANIFEST_CSV}")
    print("Block splitting complete!")

if __name__ == "__main__":
    split_lab_blocks()

