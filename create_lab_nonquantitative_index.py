#!/usr/bin/env python3
"""
Create clickable index of explicit lab statements about inability to quantify
STRICT: Only explicit lab admissions, zero inference
"""

import re
from pathlib import Path
from collections import defaultdict

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False
    pdfplumber = None

PDF_PATH = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
HTML_OUTPUT = r"C:\Users\simmo\Desktop\audit\clickable_lab_nonquantitative_index.html"
CSV_OUTPUT = r"C:\Users\simmo\Desktop\audit\clickable_lab_nonquantitative_index.csv"

PDF_BASE_PATH = "file:///C:/Users/simmo/Downloads/Copy%20of%20Discovery%20attachments%20Babars%20combined%20840%20pages_RedactedB%20(1)%20(1).pdf#page="

# Expanded patterns - exact phrases to match (case-insensitive)
SEARCH_PATTERNS = [
    # Not calculated
    (r'was\s+not\s+calculated', 'was not calculated'),
    (r'\bnot\s+calculated\b', 'not calculated'),
    (r'could\s+not\s+be\s+calculated', 'could not be calculated'),
    
    # Not quantitated
    (r'\bnot\s+quantitated\b', 'not quantitated'),
    (r'unable\s+to\s+be\s+quantitated', 'unable to be quantitated'),
    (r'could\s+not\s+be\s+quantitated', 'could not be quantitated'),
    
    # Below reporting limit
    (r'\bbelow\s+reporting\s+limit\b', 'below reporting limit'),
    (r'\bbelow\s+the\s+reporting\s+limit\b', 'below the reporting limit'),
    
    # Outside calibration range
    (r'\boutside\s+calibration\s+range\b', 'outside calibration range'),
    (r'not\s+within\s+calibration\s+range', 'not within calibration range'),
    
    # Threshold
    (r'\bthreshold\b', 'threshold'),
    
    # Threshold percentage
    (r'≥\s*1\.00\s*%', '≥ 1.00%'),
    (r'>=\s*1\.00\s*%', '≥ 1.00%'),
    
    # Screening
    (r'\bscreening\b', 'screening'),
    
    # Qualitative
    (r'\bqualitative\b', 'qualitative'),
    
    # Additional patterns from original
    (r'could\s+not\s+be\s+quantified', 'could not be quantified'),
    (r'unable\s+to\s+quantify', 'unable to quantify'),
    (r'below\s+quantitation\s+limit', 'below quantitation limit'),
    (r'unable\s+to\s+calculate', 'unable to calculate'),
    (r'could\s+not\s+quantitate', 'could not quantitate'),
    (r'cannot\s+be\s+quantified', 'cannot be quantified'),
    (r'not\s+quantifiable', 'not quantifiable'),
    (r'qualitative\s+analysis\s+only', 'qualitative analysis only'),
    (r'screening\s+only', 'screening only'),
    (r'qualitative\s+only', 'qualitative only'),
]

def is_lab_document(text: str) -> bool:
    """Check if page is a lab report/document."""
    text_lower = text.lower()
    
    # Must be clearly a lab document
    lab_indicators = [
        'laboratory', 'lab report', 'certificate of analysis', 'coa',
        'nms', 'forensic lab', 'analytical report', 'test results',
        'cannabinoid analysis', 'gc-ms', 'hplc', 'chromatography',
        'analytical', 'test method', 'sample analysis', 'delta-9',
        'thca', 'cannabinoid', 'analytical chemistry', 'mass spectrometry'
    ]
    
    has_lab_indicator = any(indicator in text_lower for indicator in lab_indicators)
    
    # Also check if page contains lab-like content (tables with cannabinoid data, etc.)
    has_lab_content = (
        ('delta-9' in text_lower or 'thca' in text_lower or 'cbd' in text_lower) and
        ('%' in text or 'percent' in text_lower or 'concentration' in text_lower)
    )
    
    if not (has_lab_indicator or has_lab_content):
        return False
    
    # Exclude if it's clearly a custody, evidence, or court document
    exclude_indicators = [
        'chain of custody', 'evidence inventory', 'property record',
        'court', 'petition', 'motion', 'warrant', 'charging',
        'judge', 'attorney', 'defendant', 'plaintiff'
    ]
    
    # Only exclude if it's clearly NOT a lab document
    if any(indicator in text_lower for indicator in exclude_indicators):
        # But allow if it also has strong lab indicators
        if not has_lab_indicator:
            return False
    
    return True

def extract_lab_name(text: str) -> str:
    """Extract lab name from text."""
    text_lower = text.lower()
    
    if 'nms' in text_lower:
        return "NMS"
    elif 'msp' in text_lower and 'forensic' in text_lower:
        return "MSP Forensic Lab"
    elif 'maryland state police' in text_lower:
        return "MSP Forensic Lab"
    elif 'forensic lab' in text_lower:
        # Try to extract lab name
        match = re.search(r'([A-Z][a-z]+\s+[Ff]orensic\s+[Ll]ab)', text)
        if match:
            return match.group(1)
        return "Forensic Lab"
    else:
        return "Unknown Lab"

def find_explicit_statements(text: str) -> list:
    """Find explicit lab statements about inability to quantify."""
    findings = []
    matched_positions = []  # Track all match positions to avoid overlaps
    
    # Sort patterns by specificity (longer/more specific first)
    sorted_patterns = sorted(SEARCH_PATTERNS, key=lambda x: len(x[0]), reverse=True)
    
    for pattern, phrase_label in sorted_patterns:
        matches = list(re.finditer(pattern, text, re.IGNORECASE))
        for match in matches:
            match_start = match.start()
            match_end = match.end()
            
            # Check if this overlaps with a more specific match we already found
            overlaps = False
            for existing_start, existing_end, existing_phrase in matched_positions:
                # If this match overlaps significantly with an existing one, skip it
                if (match_start < existing_end and match_end > existing_start):
                    # If the existing match is more specific (longer), skip this one
                    if len(existing_phrase) >= len(phrase_label):
                        overlaps = True
                        break
            
            if overlaps:
                continue
            
            # For "threshold" and "screening", only match in relevant contexts
            if phrase_label == 'threshold':
                # Must be in context of testing/analysis
                context_before = text[max(0, match_start-50):match_start].lower()
                context_after = text[match_end:min(len(text), match_end+50)].lower()
                if not any(term in context_before + context_after for term in 
                          ['thc', 'cannabinoid', 'analysis', 'test', 'determination', 'limit', 'reporting']):
                    continue
            
            if phrase_label == 'screening':
                # Must be in context of testing/analysis
                context_before = text[max(0, match_start-50):match_start].lower()
                context_after = text[match_end:min(len(text), match_end+50)].lower()
                if not any(term in context_before + context_after for term in 
                          ['test', 'analysis', 'only', 'method', 'procedure', 'lab']):
                    continue
            
            # Record this match
            matched_positions.append((match_start, match_end, phrase_label))
            
            # Get context around the match (150 chars before and after)
            start = max(0, match_start - 150)
            end = min(len(text), match_end + 150)
            context = text[start:end]
            
            # Extract the sentence or paragraph containing the match
            # Find sentence boundaries
            sentence_start = max(0, context.rfind('.', 0, match_start - start))
            if sentence_start == 0:
                sentence_start = max(0, context.rfind('\n', 0, match_start - start))
            
            sentence_end = context.find('.', match_end - start)
            if sentence_end == -1:
                sentence_end = context.find('\n', match_end - start)
            if sentence_end == -1:
                sentence_end = len(context)
            
            sentence = context[sentence_start:sentence_end].strip()
            if sentence.startswith('.'):
                sentence = sentence[1:].strip()
            
            # If sentence is still very short, expand context
            if len(sentence) < 50:
                # Try to get more context
                expanded_start = max(0, match_start - 200)
                expanded_end = min(len(text), match_end + 200)
                sentence = text[expanded_start:expanded_end].strip()
            
            # Clean up sentence
            sentence = re.sub(r'\s+', ' ', sentence)
            # Limit to 200 chars as specified
            if len(sentence) > 200:
                sentence = sentence[:200] + "..."
            
            findings.append({
                'phrase_matched': phrase_label,
                'quote': sentence,
                'match_text': match.group(0)
            })
    
    return findings

def create_label(quote: str, phrase_matched: str) -> str:
    """Create a plain English label (≤10 words)."""
    # Use the phrase matched to create a concise label
    phrase_lower = phrase_matched.lower()
    
    if 'not calculated' in phrase_lower:
        return "Lab states not calculated"
    elif 'not quantitated' in phrase_lower:
        return "Lab states not quantitated"
    elif 'below reporting limit' in phrase_lower:
        return "Lab states below reporting limit"
    elif 'outside calibration range' in phrase_lower:
        return "Lab states outside calibration range"
    elif 'threshold' in phrase_lower:
        return "Lab states threshold determination"
    elif 'screening' in phrase_lower:
        return "Lab states screening"
    elif 'qualitative' in phrase_lower:
        return "Lab states qualitative"
    else:
        # Generic label based on phrase
        return f"Lab states {phrase_matched}"

def scan_pdf(pdf_module) -> list:
    """Scan entire PDF for explicit lab non-quantitative statements."""
    all_findings = []
    
    with pdf_module.open(PDF_PATH) as pdf:
        total = len(pdf.pages)
        print(f"Scanning {total} pages for explicit lab statements...")
        
        for i, page in enumerate(pdf.pages, 1):
            if i % 200 == 0:
                print(f"  Processed {i}/{total} pages...")
            
            try:
                text = page.extract_text() or ""
                
                # Must be a lab document OR be near known lab pages (741-755)
                # This catches lab report pages that might not have obvious headers
                is_near_lab_pages = 740 <= i <= 756
                is_lab = is_lab_document(text)
                
                if not (is_lab or is_near_lab_pages):
                    continue
                
                # If near lab pages but not clearly a lab doc, check for lab content
                if is_near_lab_pages and not is_lab:
                    # Must have some lab-like content
                    text_lower = text.lower()
                    if not any(term in text_lower for term in [
                        'delta-9', 'thca', 'thc', 'cannabinoid', 'nms', 'laboratory',
                        'analysis', 'test', 'sample', 'concentration', '%'
                    ]):
                        continue
                
                # Find explicit statements
                statements = find_explicit_statements(text)
                
                if statements:
                    lab_name = extract_lab_name(text)
                    for stmt in statements:
                        all_findings.append({
                            'page': i,
                            'lab_name': lab_name,
                            'quote': stmt['quote'],
                            'phrase_matched': stmt['phrase_matched'],
                            'label': create_label(stmt['quote'], stmt['phrase_matched'])
                        })
            
            except Exception as e:
                print(f"  Error processing page {i}: {e}")
                continue
    
    return all_findings

def main():
    global HAS_PDFPLUMBER
    
    if not Path(PDF_PATH).exists():
        print(f"ERROR: PDF not found: {PDF_PATH}")
        return
    
    if not HAS_PDFPLUMBER:
        import subprocess
        import sys
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
        import pdfplumber as pdfplumber_module
        globals()['pdfplumber'] = pdfplumber_module
        HAS_PDFPLUMBER = True
    
    # Use the module
    pdf_module = pdfplumber if HAS_PDFPLUMBER else None
    if not pdf_module:
        print("ERROR: pdfplumber not available")
        return
    
    # Scan PDF
    findings = scan_pdf(pdf_module)
    
    print(f"\nFound {len(findings)} explicit lab statements across {len(set(f['page'] for f in findings))} pages")
    
    # Group by lab
    findings_by_lab = defaultdict(list)
    for finding in findings:
        findings_by_lab[finding['lab_name']].append(finding)
    
    # Write CSV
    import csv
    with open(CSV_OUTPUT, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['Page', 'Lab', 'Exact_Quote', 'PhraseMatched'])
        writer.writeheader()
        for finding in findings:
            writer.writerow({
                'Page': finding['page'],
                'Lab': finding['lab_name'],
                'Exact_Quote': finding['quote'],
                'PhraseMatched': finding['phrase_matched']
            })
    
    print(f"CSV saved to: {CSV_OUTPUT}")
    
    # Write HTML
    html_parts = [
        '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lab Non-Quantitative Statements Index</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        h2 {
            color: #34495e;
            margin-top: 40px;
            margin-bottom: 15px;
            padding: 10px;
            background-color: #ecf0f1;
            border-left: 4px solid #3498db;
        }
        ul {
            list-style-type: none;
            padding-left: 0;
        }
        li {
            margin: 12px 0;
            padding: 12px;
            background-color: white;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        a {
            color: #2980b9;
            text-decoration: none;
            font-weight: 600;
        }
        a:hover {
            color: #1abc9c;
            text-decoration: underline;
        }
        .page-link {
            font-family: 'Courier New', monospace;
            background-color: #ecf0f1;
            padding: 2px 6px;
            border-radius: 3px;
        }
        .quote {
            font-style: italic;
            color: #555;
            margin: 8px 0;
            padding-left: 20px;
            border-left: 3px solid #3498db;
        }
        .label {
            font-weight: 600;
            color: #2c3e50;
        }
    </style>
</head>
<body>
    <h1>Lab Non-Quantitative Statements Index</h1>
    <p><em>This index contains only explicit lab admissions that quantitative testing was not performed or not possible. Zero inference.</em></p>
'''
    ]
    
    # Write each lab group
    for lab_name in sorted(findings_by_lab.keys()):
        lab_findings = findings_by_lab[lab_name]
        lab_findings.sort(key=lambda x: x['page'])
        
        html_parts.append(f'    <h2>{lab_name}</h2>\n')
        html_parts.append('    <ul>\n')
        
        for finding in lab_findings:
            page_num = finding['page']
            quote = finding['quote']
            label = finding['label']
            phrase = finding['phrase_matched']
            
            page_link = PDF_BASE_PATH + str(page_num)
            
            html_parts.append(f'        <li>\n')
            html_parts.append(f'            <span class="label"><a href="{page_link}" class="page-link">Page {page_num}</a> — {label}</span><br>\n')
            html_parts.append(f'            <div class="quote">"{quote}"</div>\n')
            html_parts.append(f'            <div style="font-size: 0.9em; color: #777; margin-top: 4px;">Matched phrase: <strong>{phrase}</strong></div>\n')
            html_parts.append(f'        </li>\n')
        
        html_parts.append('    </ul>\n\n')
    
    html_parts.append('</body>\n</html>')
    
    with open(HTML_OUTPUT, 'w', encoding='utf-8') as f:
        f.write(''.join(html_parts))
    
    print(f"HTML saved to: {HTML_OUTPUT}")
    print("\nDone!")

if __name__ == "__main__":
    main()

