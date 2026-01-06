#!/usr/bin/env python3
"""
Create clickable HTML discovery index from master CSV
"""

import csv
from pathlib import Path
from collections import defaultdict

CSV_PATH = r"C:\Users\simmo\Desktop\audit\master_discovery_index.csv"
HTML_OUTPUT = r"C:\Users\simmo\Desktop\audit\clickable_discovery_index.html"

PDF_BASE_PATH = "file:///C:/Users/simmo/Downloads/Copy%20of%20Discovery%20attachments%20Babars%20combined%20840%20pages_RedactedB%20(1)%20(1).pdf#page="

ISSUE_HEADERS = {
    'A': 'Evidence Identity Problems (Issue A)',
    'B': 'Evidence Weight Problems (Issue B)',
    'C': 'Chain-of-Custody Gaps (Issue C)',
    'D': 'Lab Intake / Handling Problems (Issue D)'
}

def shorten_description(desc: str, max_words: int = 12) -> str:
    """Shorten description to max_words words."""
    # Clean up the description - remove redundant parts
    desc = desc.strip()
    
    # Remove common prefixes/suffixes that are redundant
    desc = desc.replace('handwritten - handwritten', 'handwritten')
    desc = desc.replace('handwritten/unreadable - handwritten', 'handwritten/unreadable')
    desc = desc.replace('unclear/ambiguous - blank fields', 'blank/unclear weight fields')
    desc = desc.replace('missing - weight unclear', 'missing weight')
    
    # Shorten "Multiple evidence numbering systems" descriptions
    if 'Multiple evidence numbering systems' in desc:
        # Extract just the key info: multiple numbering systems
        desc = 'Multiple numbering systems (Agency, Lab, Property, FSD, Barcodes)'
    
    # Remove "Incomplete transfers: " prefix
    if desc.startswith('Incomplete transfers: '):
        desc = desc.replace('Incomplete transfers: ', '')
    
    # Remove "Lab intake defects: " prefix
    if desc.startswith('Lab intake defects: '):
        desc = desc.replace('Lab intake defects: ', '')
    
    # Shorten common phrases
    desc = desc.replace('missing signatures, missing timestamps', 'missing signatures & timestamps')
    desc = desc.replace('released without received, missing signatures', 'released without received')
    desc = desc.replace('missing handler names, missing timestamps', 'missing handler names & timestamps')
    
    # Split into words and take first max_words
    words = desc.split()
    if len(words) <= max_words:
        return ' '.join(words)
    
    # Smart truncation - try to end at a word boundary that makes sense
    shortened = ' '.join(words[:max_words])
    # Remove trailing incomplete phrases
    if shortened.endswith('(') or shortened.endswith('(Agency'):
        # Remove incomplete parenthetical
        words_list = shortened.split()
        while words_list and (words_list[-1].startswith('(') or words_list[-1] == '(Agency'):
            words_list.pop()
        shortened = ' '.join(words_list)
        if shortened and not shortened[-1] in '.!?,;:':
            shortened += '...'
    
    return shortened

def create_html(entries_by_issue: dict) -> str:
    """Create HTML content."""
    html_parts = [
        '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Discovery Index - Clickable Page References</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            max-width: 900px;
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
            margin: 8px 0;
            padding: 8px;
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
    </style>
</head>
<body>
    <h1>Discovery Index</h1>
'''
    ]
    
    # Add each issue section in order A, B, C, D
    for issue_code in ['A', 'B', 'C', 'D']:
        if issue_code not in entries_by_issue:
            continue
        
        entries = entries_by_issue[issue_code]
        html_parts.append(f'    <h2>{ISSUE_HEADERS[issue_code]}</h2>\n')
        html_parts.append('    <ul>\n')
        
        # Sort entries by page number
        entries.sort(key=lambda x: x['page'])
        
        for entry in entries:
            page_num = entry['page']
            desc = shorten_description(entry['description'])
            page_link = PDF_BASE_PATH + str(page_num)
            
            html_parts.append(
                f'        <li>• <a href="{page_link}" class="page-link">Page {page_num}</a> — {desc}</li>\n'
            )
        
        html_parts.append('    </ul>\n\n')
    
    html_parts.append('</body>\n</html>')
    
    return ''.join(html_parts)

def main():
    # Read CSV and group by issue code
    entries_by_issue = defaultdict(list)
    
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            issue_code = row['issue_code']
            if issue_code in ISSUE_HEADERS:
                entries_by_issue[issue_code].append({
                    'page': int(row['page']),
                    'description': row['description']
                })
    
    # Create HTML
    html_content = create_html(entries_by_issue)
    
    # Write HTML file
    with open(HTML_OUTPUT, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"HTML file created: {HTML_OUTPUT}")
    print(f"\nSummary:")
    for issue_code in ['A', 'B', 'C', 'D']:
        count = len(entries_by_issue.get(issue_code, []))
        print(f"  Issue {issue_code}: {count} entries")

if __name__ == "__main__":
    main()

