#!/usr/bin/env python3
"""
Final comprehensive extractor - checking specific pages mentioned and all findings
"""

import sys
from pathlib import Path
from typing import Dict, List, Tuple
import re

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

PDF_PATH = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"

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

def clean_excerpt(text: str, keywords: List[str], context: int = 400) -> str:
    """Get excerpt around keywords."""
    text_lower = text.lower()
    for keyword in keywords:
        keyword_lower = keyword.lower()
        idx = text_lower.find(keyword_lower)
        if idx != -1:
            start = max(0, idx - context // 2)
            end = min(len(text), idx + len(keyword) + context // 2)
            excerpt = text[start:end].strip()
            return " ".join(excerpt.split())
    return text[:context] if len(text) > context else text

def main():
    global HAS_PDFPLUMBER
    
    pdf_path = PDF_PATH
    
    if not Path(pdf_path).exists():
        print(f"ERROR: PDF file not found: {pdf_path}")
        return
    
    print(f"Extracting text from PDF...")
    
    if not HAS_PDFPLUMBER:
        print("Installing pdfplumber...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
        import pdfplumber
        HAS_PDFPLUMBER = True
    
    text_by_page = extract_text_pdfplumber(pdf_path)
    print(f"Extracted text from {len(text_by_page)} pages\n")
    
    # Store all findings
    all_findings = {i: [] for i in range(1, 13)}
    
    # FINDING 1: LightLab unvalidated
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if "lightlab" in text_lower or "light lab" in text_lower:
            if any(term in text_lower for term in ["proprietary", "validation", "validate", "unvalidated", 
                                                     "error rate", "peer review", "algorithm"]):
                excerpt = clean_excerpt(text, ["lightlab", "light lab", "proprietary", "validation"])
                all_findings[1].append((page_num, excerpt))
    
    # FINDING 2: LightLab cannot be used for criminality/probable cause
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if "lightlab" in text_lower or "light lab" in text_lower:
            if any(term in text_lower for term in ["criminal", "probable cause", "legal", "purpose"]):
                excerpt = clean_excerpt(text, ["lightlab", "light lab", "criminal", "probable cause"])
                all_findings[2].append((page_num, excerpt))
    
    # FINDING 3: 100% Delta-9 with zero THCA
    # Check page 741 specifically (lab report page)
    if 741 in text_by_page:
        text = text_by_page[741]
        if "1.00%" in text or "1.00 %" in text or "100%" in text:
            if "delta-9" in text.lower() or "delta 9" in text.lower():
                excerpt = clean_excerpt(text, ["delta-9", "1.00%", "100%"])
                all_findings[3].append((741, excerpt))
    
    # Also search more broadly
    for page_num, text in text_by_page.items():
        # Look for very high delta-9 percentages
        delta9_match = re.search(r'(?:delta[- ]?9|delta[- ]?9[- ]?thc)[:\s]*(\d+\.?\d*)\s*%', text, re.IGNORECASE)
        if delta9_match:
            val = float(delta9_match.group(1))
            if val >= 95:  # Very high
                if "thca" in text.lower():
                    thca_match = re.search(r'THCA[:\s]*(\d+\.?\d*)[\s%]*', text, re.IGNORECASE)
                    if thca_match and float(thca_match.group(1)) < 0.5:
                        excerpt = clean_excerpt(text, [delta9_match.group(0), "thca"])
                        all_findings[3].append((page_num, excerpt))
    
    # FINDING 4: GC-MS converts THCA to Delta-9
    # Check lab report pages around 741-744
    for page_num in [741, 742, 743, 744]:
        if page_num in text_by_page:
            text = text_by_page[page_num]
            text_lower = text.lower()
            if any(method in text_lower for method in ["gc-ms", "gc/ms", "gas chromatography"]):
                if "thca" in text_lower:
                    excerpt = clean_excerpt(text, ["gc-ms", "gc/ms", "gas chromatography", "thca"])
                    all_findings[4].append((page_num, excerpt))
    
    # Also broader search
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if any(method in text_lower for method in ["gc-ms", "gc/ms", "gcms"]):
            if "thca" in text_lower and any(term in text_lower for term in ["convert", "decarboxyl", "into"]):
                excerpt = clean_excerpt(text, ["gc-ms", "thca", "convert"])
                all_findings[4].append((page_num, excerpt))
    
    # FINDING 5: 22 tested / 889 entries
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if "22" in text or "twenty-two" in text_lower:
            if any(term in text_lower for term in ["test", "sample", "evidence", "889", "entries"]):
                excerpt = clean_excerpt(text, ["22", "test", "evidence"])
                all_findings[5].append((page_num, excerpt))
    
    # FINDING 6: No homogenization
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if any(term in text_lower for term in ["homogeniz", "fragment", "represent", "whole"]):
            if any(term in text_lower for term in ["jar", "package", "sample"]):
                excerpt = clean_excerpt(text, ["homogen", "fragment", "represent"])
                all_findings[6].append((page_num, excerpt))
    
    # FINDING 7: Page 743 disclaimer
    if 743 in text_by_page:
        text = text_by_page[743]
        text_lower = text.lower()
        if "hemp" in text_lower or "marijuana" in text_lower:
            if any(term in text_lower for term in ["differentiat", "disclaimer", "not performed"]):
                excerpt = clean_excerpt(text, ["hemp", "marijuana", "differentiat", "disclaimer"])
                all_findings[7].append((743, excerpt))
    
    # FINDING 8: 0.88 conversion
    if 744 in text_by_page:
        text = text_by_page[744]
        if "0.88" in text or "0.877" in text:
            if "thca" in text.lower():
                excerpt = clean_excerpt(text, ["0.88", "thca", "multiply"])
                all_findings[8].append((744, excerpt))
    
    # Also search other pages
    for page_num, text in text_by_page.items():
        if page_num == 744:
            continue
        if "0.88" in text or "0.877" in text:
            if "thca" in text.lower():
                excerpt = clean_excerpt(text, ["0.88", "thca"])
                all_findings[8].append((page_num, excerpt))
    
    # FINDING 9: Felony aggregate weight before classification
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if any(term in text_lower for term in ["felony", "aggregate", "weight"]):
            if any(term in text_lower for term in ["charge", "before", "classification", "marijuana"]):
                excerpt = clean_excerpt(text, ["felony", "aggregate", "weight"])
                all_findings[9].append((page_num, excerpt))
    
    # FINDING 10: Weights combined from stores
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if any(term in text_lower for term in ["store", "combined", "aggregate"]):
            if any(term in text_lower for term in ["weight", "without", "classification"]):
                excerpt = clean_excerpt(text, ["store", "combined", "weight"])
                all_findings[10].append((page_num, excerpt))
    
    # FINDING 11: Non-statistical sampling
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if "non-statistical" in text_lower or "non statistical" in text_lower:
            if "sampling" in text_lower:
                excerpt = clean_excerpt(text, ["non-statistical", "sampling"])
                all_findings[11].append((page_num, excerpt))
        elif any(term in text_lower for term in ["swgdrug", "astm"]):
            if "sampling" in text_lower:
                excerpt = clean_excerpt(text, ["swgdrug", "astm", "sampling"])
                all_findings[11].append((page_num, excerpt))
    
    # FINDING 12: Expert conclusion unreliable
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if any(term in text_lower for term in ["expert", "opinion", "conclusion"]):
            if any(term in text_lower for term in ["unreliable", "not reliable", "scientifically", "legally"]):
                if "marijuana" in text_lower or "cannabis" in text_lower:
                    excerpt = clean_excerpt(text, ["expert", "unreliable", "marijuana"])
                    all_findings[12].append((page_num, excerpt))
    
    # Search for lab reports
    lab_reports = []
    seen_pages = set()
    for page_num, text in text_by_page.items():
        if page_num in seen_pages:
            continue
        text_lower = text.lower()
        
        # Check for lab report indicators
        if any(indicator in text_lower for indicator in ["lab report", "laboratory report", "certificate of analysis", 
                                                           "nms labs", "controlled dangerous substance analysis",
                                                           "maryland state police", "final report"]):
            # Determine report type
            report_type = "Lab Report"
            if "certificate" in text_lower or "coa" in text_lower:
                report_type = "COA"
            elif "supplemental" in text_lower:
                report_type = "Supplemental Report"
            elif "nms labs" in text_lower:
                report_type = "NMS Labs Report"
            elif "maryland state police" in text_lower and "analysis" in text_lower:
                report_type = "MDSP Lab Report"
            
            excerpt = clean_excerpt(text, ["report", "analysis", "laboratory"], context=300)
            lab_reports.append((page_num, report_type, excerpt))
            seen_pages.add(page_num)
    
    # Format output
    print("="*80)
    print("RESULTS")
    print("="*80)
    
    findings_titles = {
        1: "LightLab is unvalidated: proprietary algorithms, unknown error rates, no peer-reviewed validation.",
        2: "LightLab cannot legally be used to determine criminality or support probable cause.",
        3: "LightLab produced chemically impossible results (100% Delta-9 with zero THCA, etc.).",
        4: "State GC-MS method converts THCA into Delta-9 during testing.",
        5: "Approximately 22 tested items out of ~889 evidence entries (extremely low coverage).",
        6: "No homogenization of jars/packages; fragments cannot represent the whole.",
        7: "State Lab disclaimer (page ~743): hemp/marijuana differentiation NOT performed.",
        8: "THCA × 0.88 conversion automatically inflates THC levels.",
        9: "Felony aggregate weight charging done before establishing marijuana classification.",
        10: "Weights from different stores combined without THC classification for each item.",
        11: "Sampling did not follow SWGDRUG, ASTM, or any statistically valid protocol.",
        12: "Final expert conclusion: results scientifically and legally unreliable for marijuana classification.",
    }
    
    for finding_num in sorted(all_findings.keys()):
        matches = all_findings[finding_num]
        print(f"\nFINDING #{finding_num}:")
        if matches:
            seen_pages = set()
            for page_num, excerpt in matches:
                if page_num not in seen_pages:
                    seen_pages.add(page_num)
                    excerpt_display = excerpt[:400] + "..." if len(excerpt) > 400 else excerpt
                    print(f"• Page {page_num} — [file]: \"{excerpt_display}\"")
        else:
            print("NO SUPPORTING PAGES FOUND.")
    
    print("\n" + "="*80)
    print("ADDITIONAL LAB REPORTS FOUND:")
    print("="*80)
    
    if lab_reports:
        for page_num, report_type, excerpt in lab_reports:
            excerpt_display = excerpt[:300] + "..." if len(excerpt) > 300 else excerpt
            print(f"• Page {page_num} — [file] ({report_type}): \"{excerpt_display}\"")
    else:
        print("NO ADDITIONAL LAB REPORTS FOUND.")

if __name__ == "__main__":
    main()















