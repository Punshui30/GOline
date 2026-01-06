#!/usr/bin/env python3
"""
Extract page-anchored evidence for 12 talking points from discovery PDFs
"""

import sys
import re
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

PDF_PATH = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
PDF_FILENAME = "Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"

def extract_text_pdfplumber(pdf_path: str) -> Dict[int, str]:
    """Extract text from PDF using pdfplumber."""
    text_by_page = {}
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            try:
                text = page.extract_text()
                text_by_page[page_num] = text or ""
            except Exception as e:
                text_by_page[page_num] = ""
    return text_by_page

def get_context_around_match(text: str, match_term: str, context_chars: int = 400) -> str:
    """Get context around a matched term."""
    text_lower = text.lower()
    term_lower = match_term.lower()
    
    idx = text_lower.find(term_lower)
    if idx == -1:
        return text[:context_chars] if len(text) > context_chars else text
    
    start = max(0, idx - context_chars // 2)
    end = min(len(text), idx + len(match_term) + context_chars // 2)
    
    excerpt = text[start:end].strip()
    # Clean up whitespace
    excerpt = " ".join(excerpt.split())
    
    # Try to get sentence boundaries
    sentences = re.split(r'([.!?]\s+)', excerpt)
    if len(sentences) > 3:
        # Return first 2-3 sentences
        excerpt = "".join(sentences[:5])
    
    return excerpt

def extract_quote_for_term(text: str, term: str) -> str:
    """Extract a meaningful quote containing the search term."""
    text_lower = text.lower()
    term_lower = term.lower()
    
    if term_lower not in text_lower:
        return ""
    
    # Find the term and extract surrounding context
    idx = text_lower.find(term_lower)
    start = max(0, idx - 300)
    end = min(len(text), idx + len(term) + 300)
    
    context = text[start:end].strip()
    
    # Clean and format
    context = " ".join(context.split())
    
    # Try to extract complete sentences
    # Find sentence boundaries
    sentences = re.split(r'([.!?]\s+)', context)
    
    # Find which sentence contains the term
    term_pos_in_context = context.lower().find(term_lower)
    
    # Extract 1-3 sentences around the match
    result = ""
    char_count = 0
    target_start = max(0, term_pos_in_context - 200)
    target_end = term_pos_in_context + len(term) + 200
    
    for i in range(0, len(sentences), 2):
        if i < len(sentences):
            sentence = sentences[i] + (sentences[i+1] if i+1 < len(sentences) else "")
            if char_count < target_end and (char_count + len(sentence)) > target_start:
                result += sentence
                char_count += len(sentence)
                if len(result) > 400:  # Limit to ~400 chars
                    break
    
    return result.strip() if result else context[:400]

# Define the 12 talking points with search terms
TALKING_POINTS = {
    1: {
        'title': 'LightLab is not a validated forensic instrument.',
        'terms': ["lightlab", "field test", "not validated", "not certified", "screening device", 
                  "not forensic", "algorithm", "proprietary", "cannot determine", "not approved method"],
        'why': "supports lack of validation"
    },
    2: {
        'title': 'LightLab cannot be used to determine criminality or establish probable cause.',
        'terms': ["probable cause", "pc", "field test", "lightlab", "used to determine legality", 
                  "basis for warrant", "controlled purchase tested"],
        'why': "shows LightLab used for PC"
    },
    3: {
        'title': 'LightLab produced chemically impossible THC profiles.',
        'terms': ["100% thc", "0% thca", "impossible", "inconsistent", "unusual cannabinoid profile"],
        'why': "shows impossible results"
    },
    4: {
        'title': 'GC-MS method converts THCA into Delta-9 THC.',
        'terms': ["gc-ms", "gas chromatography", "mass spectrometry", "thca", "converts", 
                  "thermal", "heat", "decarboxylation"],
        'why': "shows THCA conversion"
    },
    5: {
        'title': 'Only ~22 items tested out of ~889 evidence entries.',
        'terms': ["five sample items", "sent to lab", "laboratory received", "items submitted", 
                  "evidence entries", "total items seized", "889", "inventory report"],
        'why': "shows low testing coverage"
    },
    6: {
        'title': 'No homogenization before testing.',
        'terms': ["homogenize", "mixed", "representative", "jar", "fragment", "non-uniform", 
                  "bud fragment", "not mixed", "grab sample"],
        'why': "shows lack of homogenization"
    },
    7: {
        'title': 'State Lab did not perform hemp/marijuana differentiation.',
        'terms': ["does not differentiate", "hemp/marijuana classification", "not requested", 
                  "lab does not offer", "cannot determine hemp vs marijuana"],
        'why': "shows no differentiation performed"
    },
    8: {
        'title': 'THCA × 0.88 formula inflates THC levels.',
        'terms': ["0.88", "thca conversion", "total thc", "multiplied by 0.88", "formula", "calculation"],
        'why': "shows 0.88 conversion formula"
    },
    9: {
        'title': 'Aggregate weight charging done in the wrong legal sequence.',
        'terms': ["aggregate weight", "combined weight", "before classification", "charged", 
                  "weight threshold", "sequence"],
        'why': "shows charging sequence issue"
    },
    10: {
        'title': 'Weights from different stores combined without classification.',
        'terms': ["multiple locations", "combined weight", "smoke star", "best choice", 
                  "tobacco town", "convenience city", "added together"],
        'why': "shows stores combined without classification"
    },
    11: {
        'title': 'Sampling did not follow SWGDRUG or ASTM standards.',
        'terms': ["swgdrug", "astm", "non-statistical sampling", "grab sample", 
                  "no sampling plan", "representative sampling"],
        'why': "shows non-standard sampling"
    },
    12: {
        'title': 'Final conclusion: the evidence cannot classify the material as marijuana.',
        'terms': ["cannot determine", "insufficient", "not reliable", "inconclusive", 
                  "not marijuana", "no basis", "cannot conclude", "not established"],
        'why': "shows inability to classify"
    }
}

def search_talking_point(text_by_page: Dict[int, str], point_num: int) -> List[Dict]:
    """Search for evidence supporting a talking point."""
    point = TALKING_POINTS[point_num]
    results = []
    seen_pages = set()
    
    for page_num, text in text_by_page.items():
        if page_num in seen_pages:
            continue
        
        text_lower = text.lower()
        matched_terms = []
        
        # Check each search term
        for term in point['terms']:
            term_lower = term.lower()
            # Use word boundary matching for better precision
            if len(term.split()) > 1:
                # Multi-word phrase
                if term_lower in text_lower:
                    matched_terms.append(term)
            else:
                # Single word - check for word boundaries
                pattern = r'\b' + re.escape(term_lower) + r'\b'
                if re.search(pattern, text_lower):
                    matched_terms.append(term)
        
        if matched_terms:
            # Extract quote
            # Use the first matched term to get context
            quote = extract_quote_for_term(text, matched_terms[0])
            if not quote:
                # Fallback to context extraction
                quote = get_context_around_match(text, matched_terms[0], 400)
            
            if quote and len(quote) > 20:  # Valid quote
                results.append({
                    'page': page_num,
                    'quote': quote,
                    'matched_terms': matched_terms
                })
                seen_pages.add(page_num)
    
    return results

def main():
    global HAS_PDFPLUMBER
    
    pdf_path = PDF_PATH
    
    if not Path(pdf_path).exists():
        print(f"ERROR: PDF file not found: {pdf_path}")
        return
    
    print(f"Extracting text from PDF: {Path(pdf_path).name}")
    print(f"File size: {Path(pdf_path).stat().st_size / (1024*1024):.1f} MB\n")
    
    if not HAS_PDFPLUMBER:
        print("Installing pdfplumber...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
        import pdfplumber
        HAS_PDFPLUMBER = True
    
    text_by_page = extract_text_pdfplumber(pdf_path)
    print(f"Extracted text from {len(text_by_page)} pages\n")
    
    # Search each talking point
    output_lines = []
    
    for point_num in sorted(TALKING_POINTS.keys()):
        point = TALKING_POINTS[point_num]
        print(f"Searching TALKING POINT {point_num}...")
        
        results = search_talking_point(text_by_page, point_num)
        
        output_lines.append(f"TALKING POINT {point_num}:")
        output_lines.append(point['title'])
        output_lines.append("")
        
        if results:
            # Sort by page number
            results.sort(key=lambda x: x['page'])
            
            for result in results:
                # Format quote (limit to 1-3 sentences, max 400 chars)
                quote = result['quote']
                if len(quote) > 400:
                    # Try to truncate at sentence boundary
                    sentences = re.split(r'([.!?]\s+)', quote)
                    quote = ""
                    for i in range(0, min(6, len(sentences)), 2):
                        if i < len(sentences):
                            quote += sentences[i] + (sentences[i+1] if i+1 < len(sentences) else "")
                        if len(quote) > 350:
                            break
                    quote = quote[:400].strip()
                
                # Clean up quote
                quote = " ".join(quote.split())
                
                # Why clause
                why_clause = point.get('why', f"matches: {', '.join(result['matched_terms'][:2])}")
                
                output_lines.append(
                    f"- Page {result['page']} — [{PDF_FILENAME}]: \"{quote}\" ({why_clause})"
                )
        else:
            output_lines.append("NO SUPPORTING PAGES FOUND.")
        
        output_lines.append("")
    
    # Write output
    output_path = Path("C:/Users/simmo/Desktop/talking_points_page_anchored_evidence.txt")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(output_lines))
    
    print(f"\nOutput saved to: {output_path}")
    print(f"\nTotal talking points searched: {len(TALKING_POINTS)}")
    
    # Print summary
    for point_num in sorted(TALKING_POINTS.keys()):
        point = TALKING_POINTS[point_num]
        results = search_talking_point(text_by_page, point_num)
        status = f"{len(results)} pages" if results else "NO EVIDENCE"
        print(f"  Point {point_num}: {status}")

if __name__ == "__main__":
    main()















