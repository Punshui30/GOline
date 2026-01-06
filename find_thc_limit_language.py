#!/usr/bin/env python3
"""
Scan discovery PDF for explicit lab language about thresholds and quantitation limits
"""

import re
from pathlib import Path

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

PDF_PATH = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
OUTPUT_DIR = Path(r"C:\Users\simmo\Desktop\audit\THC_limit_language")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

CSV_OUTPUT = OUTPUT_DIR / "thc_limit_language_hits.csv"
HTML_OUTPUT = OUTPUT_DIR / "clickable_thc_limit_language.html"

PDF_BASE_PATH = "file:///C:/Users/simmo/Downloads/Copy%20of%20Discovery%20attachments%20Babars%20combined%20840%20pages_RedactedB%20(1)%20(1).pdf#page="

# Search patterns with labels
SEARCH_PATTERNS = [
    (r'not\s+calculated', 'not calculated'),
    (r'not\s+quantitated', 'not quantitated'),
    (r'not\s+quantified', 'not quantified'),
    (r'unable\s+to\s+quantify', 'unable to quantify'),
    (r'reporting\s+limit', 'reporting limit'),
    (r'quantitation\s+limit', 'quantitation limit'),
    (r'\blod\b', 'LOD'),
    (r'\bloq\b', 'LOQ'),
    (r'greater\s+than\s+1%|>1%', 'greater than 1%'),
    (r'less\s+than\s+1%|<1%', 'less than 1%'),
    (r'\bthreshold\b', 'threshold'),
    (r'semi[- ]?quantitative', 'semi-quantitative'),
    (r'\bqualitative\b', 'qualitative'),
]

# Special pattern for "total THC" AND ("not" OR "unable" OR "could not")
SPECIAL_PATTERN = (r'total\s+thc.*(?:not|unable|could\s+not)', 'total THC with not/unable/could not')

def extract_snippet(text: str, match_start: int, match_end: int, context: int = 100) -> str:
    """Extract snippet around match."""
    snippet_start = max(0, match_start - context)
    snippet_end = min(len(text), match_end + context)
    snippet = text[snippet_start:snippet_end].strip()
    
    # Clean up whitespace
    snippet = re.sub(r'\s+', ' ', snippet)
    
    # Limit length
    if len(snippet) > 250:
        snippet = snippet[:250] + "..."
    
    return snippet

def detect_source_type(text: str) -> str:
    """Try to detect source type (lab name) if obvious."""
    text_lower = text.lower()
    
    if 'nms' in text_lower or 'national medical services' in text_lower:
        return "NMS"
    elif 'maryland state police' in text_lower or 'fsd' in text_lower:
        return "MSP FSD"
    elif 'lightlab' in text_lower or 'orange photonics' in text_lower:
        return "LightLab"
    else:
        return ""

def find_thc_limit_language():
    """Find all pages with THC limit/quantitation language."""
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
    
    print("Scanning PDF for THC limit/quantitation language...")
    
    all_hits = []
    pages_seen = set()
    
    with pdf_module.open(PDF_PATH) as pdf:
        total_pages = len(pdf.pages)
        print(f"Total pages: {total_pages}")
        
        for page_num in range(1, total_pages + 1):
            if page_num % 100 == 0:
                print(f"  Processing page {page_num}/{total_pages}...")
            
            try:
                page = pdf.pages[page_num - 1]
                text = page.extract_text() or ""
                
                if not text:
                    continue
                
                text_lower = text.lower()
                page_hits = []
                
                # Check standard patterns
                for pattern, label in SEARCH_PATTERNS:
                    matches = list(re.finditer(pattern, text_lower, re.IGNORECASE))
                    for match in matches:
                        snippet = extract_snippet(text, match.start(), match.end())
                        page_hits.append({
                            'page': page_num,
                            'phrase': label,
                            'snippet': snippet,
                            'source_type': detect_source_type(text)
                        })
                
                # Check special pattern (must have "total THC" AND negation)
                if re.search(SPECIAL_PATTERN[0], text_lower, re.IGNORECASE):
                    match = re.search(SPECIAL_PATTERN[0], text_lower, re.IGNORECASE)
                    snippet = extract_snippet(text, match.start(), match.end())
                    page_hits.append({
                        'page': page_num,
                        'phrase': SPECIAL_PATTERN[1],
                        'snippet': snippet,
                        'source_type': detect_source_type(text)
                    })
                
                if page_hits:
                    # Deduplicate by phrase on same page
                    seen_phrases = set()
                    for hit in page_hits:
                        if hit['phrase'] not in seen_phrases:
                            seen_phrases.add(hit['phrase'])
                            all_hits.append(hit)
                            pages_seen.add(page_num)
            
            except Exception as e:
                print(f"  Error processing page {page_num}: {e}")
                continue
    
    print(f"\nFound {len(all_hits)} matches across {len(pages_seen)} pages")
    
    # Write CSV
    import csv
    with open(CSV_OUTPUT, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['Page', 'ExactMatchedPhrase', 'Snippet', 'SourceType'])
        writer.writeheader()
        for hit in all_hits:
            writer.writerow({
                'Page': hit['page'],
                'ExactMatchedPhrase': hit['phrase'],
                'Snippet': hit['snippet'],
                'SourceType': hit['source_type'] or ''
            })
    
    print(f"Saved CSV to {CSV_OUTPUT}")
    
    # Write HTML
    html_parts = [
        '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>THC Limit / Quantitation Language</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1100px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 15px 0; padding: 15px; background: white; border-left: 4px solid #3498db; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        a { color: #2980b9; text-decoration: none; font-weight: bold; }
        a:hover { text-decoration: underline; }
        .page-link { font-family: monospace; background: #ecf0f1; padding: 4px 8px; border-radius: 3px; }
        .phrase { color: #e74c3c; font-weight: bold; margin: 8px 0; }
        .snippet { color: #555; font-style: italic; margin: 8px 0; padding-left: 20px; border-left: 2px solid #bdc3c7; }
        .source { color: #7f8c8d; font-size: 0.9em; margin-top: 5px; }
    </style>
</head>
<body>
    <h1>THC Limit / Quantitation Language</h1>
    <p><em>Pages containing explicit language about thresholds, quantitation limits, or inability to quantify</em></p>
    <ul>
'''
    ]
    
    # Sort by page number
    all_hits.sort(key=lambda x: x['page'])
    
    for hit in all_hits:
        page_link = PDF_BASE_PATH + str(hit['page'])
        html_parts.append(f'        <li>')
        html_parts.append(f'            <a href="{page_link}" class="page-link">Page {hit["page"]}</a>')
        html_parts.append(f'            <div class="phrase">Matched phrase: {hit["phrase"]}</div>')
        html_parts.append(f'            <div class="snippet">"{hit["snippet"]}"</div>')
        if hit['source_type']:
            html_parts.append(f'            <div class="source">Source: {hit["source_type"]}</div>')
        html_parts.append(f'        </li>\n')
    
    html_parts.append('    </ul>\n</body>\n</html>')
    
    with open(HTML_OUTPUT, 'w', encoding='utf-8') as f:
        f.write(''.join(html_parts))
    
    print(f"Saved HTML to {HTML_OUTPUT}")
    print("\nTHC limit language scan complete!")

if __name__ == "__main__":
    find_thc_limit_language()















