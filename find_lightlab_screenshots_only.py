#!/usr/bin/env python3
"""
Identify ONLY LightLab / Orange Photonics SCREENSHOT pages
Excludes written reports, forms, and narrative text
"""

import re
from pathlib import Path

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

PDF_PATH = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
OUTPUT_DIR = Path(r"C:\Users\simmo\Desktop\audit\LightLab_screenshots_only")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

CSV_OUTPUT = OUTPUT_DIR / "lightlab_screenshot_pages.csv"
HTML_OUTPUT = OUTPUT_DIR / "clickable_lightlab_screenshots.html"

PDF_BASE_PATH = "file:///C:/Users/simmo/Downloads/Copy%20of%20Discovery%20attachments%20Babars%20combined%20840%20pages_RedactedB%20(1)%20(1).pdf#page="

# SCREENSHOT-SPECIFIC inclusion patterns
SCREENSHOT_INDICATORS = {
    'dashboard_url': [
        r'orangephotonics\.com',
        r'dashboard\.orangephotonics',
    ],
    'lightlab_branding': [
        r'\blightlab\b',
        r'light\s+lab\s+3',
    ],
    'ui_button': [
        r'copy\s+to\s+clipboard',
        r'copy\s+clipboard',
    ],
    'results_panel': [
        r'total\s+thc',
        r'thc[- ]?a|thca',
        r'[Δa]9[- ]?thc|delta[- ]?9',
    ],
    'chromatogram': [
        r'chromatogram',
    ],
    'ui_elements': [
        r'panel|card|slider|button',
    ],
}

# EXCLUSION patterns - exclude if these are present (indicates written report, not screenshot)
EXCLUSION_PATTERNS = [
    r'chain\s+of\s+custody',
    r'seizure\s+notice',
    r'property\s+receipt',
    r'submission\s+form',
    r'request\s+for\s+laboratory',
    r'evidence\s+log',
    r'inventory',
    r'written\s+report',
    r'narrative',
    r'officer\s+statement',
    r'affidavit',
]

def is_excluded(text: str) -> bool:
    """Check if page should be excluded (written report, form, etc.)."""
    if not text:
        return False
    
    text_lower = text.lower()
    
    # Exclude if it's clearly a written report or form
    for pattern in EXCLUSION_PATTERNS:
        if re.search(pattern, text_lower):
            return True
    
    # Exclude if it's mostly narrative text (long paragraphs without UI elements)
    # If text is very long and doesn't have UI indicators, likely a written report
    if len(text) > 2000:
        has_ui_indicators = any(
            re.search(pattern, text_lower)
            for pattern_list in SCREENSHOT_INDICATORS.values()
            for pattern in pattern_list
        )
        if not has_ui_indicators:
            return True
    
    return False

def detect_screenshot_elements(text: str) -> tuple[bool, list, str]:
    """
    Detect if page contains LightLab screenshot elements.
    Returns: (is_screenshot, detected_elements, ocr_snippet)
    """
    if not text:
        return (False, [], "")
    
    text_lower = text.lower()
    
    # Check exclusions first
    if is_excluded(text):
        return (False, [], "")
    
    detected_elements = []
    
    # Check each screenshot indicator category
    for category, patterns in SCREENSHOT_INDICATORS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                if category not in detected_elements:
                    detected_elements.append(category)
                break
    
    # Must have at least one strong indicator
    strong_indicators = ['dashboard_url', 'lightlab_branding', 'ui_button', 'chromatogram']
    has_strong_indicator = any(elem in detected_elements for elem in strong_indicators)
    
    # OR must have results_panel with multiple cannabinoid terms
    if 'results_panel' in detected_elements:
        # Check for multiple cannabinoid terms
        cannabinoid_count = 0
        if re.search(r'total\s+thc', text_lower):
            cannabinoid_count += 1
        if re.search(r'thc[- ]?a|thca', text_lower):
            cannabinoid_count += 1
        if re.search(r'[Δa]9[- ]?thc|delta[- ]?9', text_lower):
            cannabinoid_count += 1
        
        if cannabinoid_count >= 2:
            has_strong_indicator = True
    
    if not has_strong_indicator:
        return (False, [], "")
    
    # Extract OCR snippet (first 200 chars with LightLab-related content)
    snippet = ""
    sentences = re.split(r'[.!?\n]', text)
    relevant_sentences = []
    
    for sentence in sentences:
        sentence_lower = sentence.lower()
        if any(keyword in sentence_lower for keyword in [
            'lightlab', 'orange', 'dashboard', 'chromatogram', 
            'thc', 'thca', 'delta', 'copy', 'clipboard'
        ]):
            relevant_sentences.append(sentence.strip())
            if len(' '.join(relevant_sentences)) > 200:
                break
    
    snippet = ' '.join(relevant_sentences)[:200]
    if not snippet:
        snippet = text[:200].strip()
    
    return (True, detected_elements, snippet)

def find_lightlab_screenshots():
    """Find all LightLab screenshot pages."""
    global HAS_PDFPLUMBER
    
    if not Path(PDF_PATH).exists():
        print(f"ERROR: PDF not found: {PDF_PATH}")
        return
    
    if not HAS_PDFPLUMBER:
        import subprocess
        import sys
        print("Installing pdfplumber...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
        import pdfplumber as pdfplumber_module
        globals()['pdfplumber'] = pdfplumber_module
        HAS_PDFPLUMBER = True
    
    pdf_module = pdfplumber if HAS_PDFPLUMBER else None
    
    print("Scanning PDF for LightLab SCREENSHOT pages only...")
    
    screenshot_pages = []
    
    with pdf_module.open(PDF_PATH) as pdf:
        total_pages = len(pdf.pages)
        print(f"Total pages: {total_pages}")
        
        for page_num in range(1, total_pages + 1):
            if page_num % 100 == 0:
                print(f"  Processing page {page_num}/{total_pages}...")
            
            try:
                page = pdf.pages[page_num - 1]
                text = page.extract_text() or ""
                
                is_screenshot, elements, snippet = detect_screenshot_elements(text)
                
                if is_screenshot:
                    screenshot_pages.append({
                        'page': page_num,
                        'elements': elements,
                        'snippet': snippet
                    })
            
            except Exception as e:
                print(f"  Error processing page {page_num}: {e}")
                continue
    
    print(f"\nFound {len(screenshot_pages)} LightLab screenshot pages")
    
    # Write CSV
    import csv
    with open(CSV_OUTPUT, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['page_number', 'detected_visual_elements', 'OCR_snippet'])
        writer.writeheader()
        for page_info in screenshot_pages:
            writer.writerow({
                'page_number': page_info['page'],
                'detected_visual_elements': ', '.join(page_info['elements']),
                'OCR_snippet': page_info['snippet']
            })
    
    print(f"Saved CSV to {CSV_OUTPUT}")
    
    # Write HTML
    html_parts = [
        '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>LightLab Screenshot Pages</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        ul {
            list-style-type: none;
            padding: 0;
        }
        li {
            margin: 12px 0;
            padding: 15px;
            background: white;
            border-left: 4px solid #3498db;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        a {
            color: #2980b9;
            text-decoration: none;
            font-weight: bold;
        }
        a:hover {
            text-decoration: underline;
        }
        .page-link {
            font-family: 'Courier New', monospace;
            background: #ecf0f1;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 1.1em;
        }
        .elements {
            color: #7f8c8d;
            font-size: 0.9em;
            margin: 8px 0;
        }
        .snippet {
            color: #555;
            font-style: italic;
            font-size: 0.9em;
            margin-top: 8px;
            padding-left: 15px;
            border-left: 2px solid #bdc3c7;
        }
    </style>
</head>
<body>
    <h1>LightLab Screenshot Pages</h1>
    <p><em>Pages containing LightLab / Orange Photonics screenshot UI elements</em></p>
    <ul>
'''
    ]
    
    for page_info in screenshot_pages:
        page_link = PDF_BASE_PATH + str(page_info['page'])
        html_parts.append(f'        <li>')
        html_parts.append(f'            <a href="{page_link}" class="page-link">Page {page_info["page"]}</a>')
        html_parts.append(f'            <div class="elements">Detected: {", ".join(page_info["elements"])}</div>')
        if page_info['snippet']:
            html_parts.append(f'            <div class="snippet">{page_info["snippet"][:150]}...</div>')
        html_parts.append(f'        </li>\n')
    
    html_parts.append('    </ul>\n</body>\n</html>')
    
    with open(HTML_OUTPUT, 'w', encoding='utf-8') as f:
        f.write(''.join(html_parts))
    
    print(f"Saved HTML to {HTML_OUTPUT}")
    print("\nScan complete!")

if __name__ == "__main__":
    find_lightlab_screenshots()















