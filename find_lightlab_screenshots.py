#!/usr/bin/env python3
"""
Find ALL LightLab / Orange Photonics result screenshots
Flag chemically impossible results
"""

import re
from pathlib import Path

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

PDF_PATH = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
OUTPUT_DIR = Path(r"C:\Users\simmo\Desktop\audit\LightLab_impossible")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

CSV_OUTPUT = OUTPUT_DIR / "lightlab_all_hits.csv"
HTML_IMPOSSIBLE = OUTPUT_DIR / "clickable_lightlab_impossible.html"
HTML_ALL = OUTPUT_DIR / "clickable_lightlab_all.html"

PDF_BASE_PATH = "file:///C:/Users/simmo/Downloads/Copy%20of%20Discovery%20attachments%20Babars%20combined%20840%20pages_RedactedB%20(1)%20(1).pdf#page="

# Inclusion patterns - page must have at least one
INCLUSION_PATTERNS = [
    r'dashboard\.orangephotonics\.com',
    r'lightlab|light\s+lab\s+3',
    r'copy\s+to\s+clipboard',
    r'chromatogram',
    r'\bresult[s]?\b',
    r'thc[- ]?a|thca',
    r'Δ9[- ]?thc|a9[- ]?thc|delta[- ]?9',
]

def has_lightlab_content(text: str) -> bool:
    """Check if page has LightLab content."""
    if not text:
        return False
    
    text_lower = text.lower()
    
    for pattern in INCLUSION_PATTERNS:
        if re.search(pattern, text_lower):
            return True
    
    return False

def extract_text_snippet(text: str, max_length: int = 200) -> str:
    """Extract a snippet of text from the page."""
    if not text:
        return ""
    
    # Try to find LightLab-related content
    text_lower = text.lower()
    
    # Find sentences with LightLab keywords
    sentences = re.split(r'[.!?\n]', text)
    relevant_sentences = []
    
    for sentence in sentences:
        sentence_lower = sentence.lower()
        if any(keyword in sentence_lower for keyword in ['lightlab', 'orange', 'thc', 'thca', 'delta', 'result', 'chromatogram']):
            relevant_sentences.append(sentence.strip())
            if len(' '.join(relevant_sentences)) > max_length:
                break
    
    snippet = ' '.join(relevant_sentences)[:max_length]
    if not snippet:
        # Fallback: first 200 chars
        snippet = text[:max_length].strip()
    
    return snippet

def check_chemically_impossible(text: str) -> tuple[bool, str]:
    """
    Check for chemically impossible results.
    Returns: (is_impossible, reason)
    """
    if not text:
        return (False, "")
    
    text_lower = text.lower()
    
    # Pattern 1: THC-A = 0.0% (or ND) AND Δ9-THC is non-zero
    # Look for patterns like "THC-A: 0.0%" or "THCA: ND" and "Δ9-THC: X.X%" where X > 0
    
    # Try to find THC-A values
    thca_patterns = [
        r'thc[- ]?a[:\s]*(\d+\.?\d*)\s*%',
        r'thc[- ]?a[:\s]*(?:nd|n\.?d\.?|0\.0)',
        r'thca[:\s]*(\d+\.?\d*)\s*%',
    ]
    
    thca_value = None
    thca_is_zero = False
    
    for pattern in thca_patterns:
        match = re.search(pattern, text_lower)
        if match:
            if match.group(0).lower() in ['nd', 'n.d.', '0.0', '0', '0%']:
                thca_is_zero = True
            elif len(match.groups()) > 0:
                try:
                    thca_value = float(match.group(1))
                    if thca_value == 0.0:
                        thca_is_zero = True
                except:
                    pass
            break
    
    # Look for Δ9-THC values
    delta9_patterns = [
        r'[Δa]9[- ]?thc[:\s]*(\d+\.?\d*)\s*%',
        r'delta[- ]?9[- ]?thc[:\s]*(\d+\.?\d*)\s*%',
        r'd9[- ]?thc[:\s]*(\d+\.?\d*)\s*%',
    ]
    
    delta9_value = None
    delta9_is_zero = False
    
    for pattern in delta9_patterns:
        match = re.search(pattern, text_lower)
        if match:
            if len(match.groups()) > 0:
                try:
                    delta9_value = float(match.group(1))
                    if delta9_value == 0.0:
                        delta9_is_zero = True
                except:
                    pass
            break
    
    # Pattern 1: THC-A = 0 AND Δ9-THC > 0
    if thca_is_zero and delta9_value and delta9_value > 0:
        return (True, "THC-A = 0% but Δ9-THC is non-zero")
    
    # Pattern 2: Δ9-THC = 0 AND THC-A > 0 (less common but still impossible in final product)
    if delta9_is_zero and thca_value and thca_value > 0:
        # Actually, this might be possible if it's raw plant material, so we need to be careful
        # But if Total THC is shown as non-zero, then it's impossible
        if re.search(r'total\s+thc[:\s]*(\d+\.?\d*)\s*%', text_lower):
            total_match = re.search(r'total\s+thc[:\s]*(\d+\.?\d*)\s*%', text_lower)
            if total_match:
                try:
                    total_value = float(total_match.group(1))
                    if total_value > 0:
                        return (True, "Δ9-THC = 0% but Total THC is non-zero")
                except:
                    pass
    
    # Pattern 3: Total THC shown but BOTH THC-A and Δ9-THC are 0/ND
    if re.search(r'total\s+thc[:\s]*(\d+\.?\d*)\s*%', text_lower):
        total_match = re.search(r'total\s+thc[:\s]*(\d+\.?\d*)\s*%', text_lower)
        if total_match:
            try:
                total_value = float(total_match.group(1))
                if total_value > 0 and thca_is_zero and (delta9_is_zero or delta9_value == 0):
                    return (True, "Total THC is non-zero but both THC-A and Δ9-THC are 0%")
            except:
                pass
    
    # Pattern 4: 100% Δ9 with 0% THC-A
    if delta9_value == 100.0 and thca_is_zero:
        return (True, "100% Δ9-THC with 0% THC-A")
    
    # Pattern 5: 100% THC-A with 0% Δ9 (in final product, this suggests no decarboxylation which is suspicious)
    if thca_value == 100.0 and delta9_is_zero:
        # Check if this is a final product (not raw material)
        if re.search(r'total\s+thc', text_lower):
            return (True, "100% THC-A with 0% Δ9-THC (inconsistent with Total THC)")
    
    return (False, "")

def find_lightlab_pages():
    """Find all LightLab pages and flag impossible results."""
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
    
    print("Scanning PDF for LightLab screenshots...")
    
    hits = []
    
    with pdf_module.open(PDF_PATH) as pdf:
        total_pages = len(pdf.pages)
        print(f"Total pages: {total_pages}")
        
        for page_num in range(1, total_pages + 1):
            if page_num % 100 == 0:
                print(f"  Processing page {page_num}/{total_pages}...")
            
            try:
                page = pdf.pages[page_num - 1]
                text = page.extract_text() or ""
                
                if has_lightlab_content(text):
                    snippet = extract_text_snippet(text, max_length=200)
                    is_impossible, reason = check_chemically_impossible(text)
                    
                    hits.append({
                        'page': page_num,
                        'snippet': snippet,
                        'flag': 'YES' if is_impossible else 'NO',
                        'reason': reason if is_impossible else ''
                    })
            
            except Exception as e:
                print(f"  Error processing page {page_num}: {e}")
                continue
    
    print(f"\nFound {len(hits)} LightLab pages")
    impossible_count = sum(1 for h in hits if h['flag'] == 'YES')
    print(f"  {impossible_count} flagged as chemically impossible")
    
    # Write CSV
    import csv
    with open(CSV_OUTPUT, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['Page', 'ExtractedTextSnippet', 'Flag', 'Reason'])
        writer.writeheader()
        for hit in hits:
            writer.writerow({
                'Page': hit['page'],
                'ExtractedTextSnippet': hit['snippet'],
                'Flag': hit['flag'],
                'Reason': hit['reason']
            })
    
    print(f"Saved CSV to {CSV_OUTPUT}")
    
    # Write HTML for impossible only
    impossible_hits = [h for h in hits if h['flag'] == 'YES']
    html_impossible = [
        '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>LightLab Chemically Impossible Results</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
        h1 { color: #c0392b; border-bottom: 3px solid #c0392b; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 10px 0; padding: 10px; background: #ffe6e6; border-left: 4px solid #c0392b; }
        a { color: #2980b9; text-decoration: none; font-weight: bold; }
        a:hover { text-decoration: underline; }
        .page-link { font-family: monospace; background: #ecf0f1; padding: 2px 6px; }
        .reason { color: #7f8c8d; font-style: italic; margin-top: 5px; }
    </style>
</head>
<body>
    <h1>LightLab Chemically Impossible Results</h1>
    <p><em>Pages flagged as containing chemically impossible THC profiles</em></p>
    <ul>
'''
    ]
    
    for hit in impossible_hits:
        page_link = PDF_BASE_PATH + str(hit['page'])
        html_impossible.append(f'        <li>')
        html_impossible.append(f'            <a href="{page_link}" class="page-link">Page {hit["page"]}</a>')
        if hit['reason']:
            html_impossible.append(f'            <div class="reason">Reason: {hit["reason"]}</div>')
        html_impossible.append(f'        </li>\n')
    
    html_impossible.append('    </ul>\n</body>\n</html>')
    
    with open(HTML_IMPOSSIBLE, 'w', encoding='utf-8') as f:
        f.write(''.join(html_impossible))
    
    print(f"Saved impossible HTML to {HTML_IMPOSSIBLE}")
    
    # Write HTML for all hits
    html_all = [
        '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>All LightLab Pages</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; }
        h2 { color: #34495e; margin-top: 30px; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 10px 0; padding: 10px; background: white; border-left: 4px solid #3498db; }
        li.impossible { background: #ffe6e6; border-left-color: #c0392b; }
        a { color: #2980b9; text-decoration: none; font-weight: bold; }
        a:hover { text-decoration: underline; }
        .page-link { font-family: monospace; background: #ecf0f1; padding: 2px 6px; }
        .reason { color: #7f8c8d; font-style: italic; margin-top: 5px; }
        .snippet { color: #555; font-size: 0.9em; margin-top: 5px; }
    </style>
</head>
<body>
    <h1>All LightLab Pages</h1>
    <h2>Flagged as Chemically Impossible (Flag=YES)</h2>
    <ul>
'''
    ]
    
    for hit in impossible_hits:
        page_link = PDF_BASE_PATH + str(hit['page'])
        html_all.append(f'        <li class="impossible">')
        html_all.append(f'            <a href="{page_link}" class="page-link">Page {hit["page"]}</a>')
        if hit['reason']:
            html_all.append(f'            <div class="reason">Reason: {hit["reason"]}</div>')
        html_all.append(f'        </li>\n')
    
    html_all.append('    </ul>\n    <h2>Not Flagged (Flag=NO)</h2>\n    <ul>\n')
    
    normal_hits = [h for h in hits if h['flag'] == 'NO']
    for hit in normal_hits:
        page_link = PDF_BASE_PATH + str(hit['page'])
        html_all.append(f'        <li>')
        html_all.append(f'            <a href="{page_link}" class="page-link">Page {hit["page"]}</a>')
        if hit['snippet']:
            html_all.append(f'            <div class="snippet">{hit["snippet"][:150]}...</div>')
        html_all.append(f'        </li>\n')
    
    html_all.append('    </ul>\n</body>\n</html>')
    
    with open(HTML_ALL, 'w', encoding='utf-8') as f:
        f.write(''.join(html_all))
    
    print(f"Saved all hits HTML to {HTML_ALL}")
    print("\nLightLab scan complete!")

if __name__ == "__main__":
    find_lightlab_pages()















