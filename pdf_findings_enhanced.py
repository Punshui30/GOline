#!/usr/bin/env python3
"""
Enhanced extractor for 12 specific findings - with better pattern matching
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

try:
    from PyPDF2 import PdfReader
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

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

def clean_excerpt(text: str, keyword: str, context: int = 400) -> str:
    """Get excerpt around keyword."""
    text_lower = text.lower()
    keyword_lower = keyword.lower()
    idx = text_lower.find(keyword_lower)
    if idx == -1:
        return text[:context] if len(text) > context else text
    start = max(0, idx - context // 2)
    end = min(len(text), idx + len(keyword) + context // 2)
    excerpt = text[start:end].strip()
    return " ".join(excerpt.split())

# Finding search functions
def search_finding_1(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """LightLab is unvalidated: proprietary algorithms, unknown error rates, no peer-reviewed validation."""
    matches = []
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if "lightlab" in text_lower or "light lab" in text_lower:
            # Look for validation-related terms
            if any(term in text_lower for term in ["proprietary", "validation", "validate", "unvalidated", 
                                                     "error rate", "peer review", "peer-reviewed", "algorithm"]):
                excerpt = clean_excerpt(text, "lightlab" if "lightlab" in text_lower else "light lab")
                matches.append((page_num, excerpt))
    return matches

def search_finding_2(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """LightLab cannot legally be used to determine criminality or support probable cause."""
    matches = []
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if "lightlab" in text_lower or "light lab" in text_lower:
            if any(term in text_lower for term in ["criminal", "criminality", "probable cause", 
                                                     "legal", "legally", "not intended", "purpose", "cannot be used"]):
                excerpt = clean_excerpt(text, "lightlab" if "lightlab" in text_lower else "light lab")
                matches.append((page_num, excerpt))
    return matches

def search_finding_3(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """LightLab produced chemically impossible results (100% Delta-9 with zero THCA, etc.)."""
    matches = []
    for page_num, text in text_by_page.items():
        # Look for 100% or very high delta-9 values
        delta9_pattern = re.search(r'(?:delta[- ]?9|delta[- ]?9[- ]?thc)[:\s]*(\d+\.?\d*)\s*%', text, re.IGNORECASE)
        if delta9_pattern:
            delta9_val = float(delta9_pattern.group(1))
            if delta9_val >= 90:  # Very high delta-9 (chemically unusual)
                # Check for THCA in same context
                if "thca" in text.lower() or "thc-a" in text.lower():
                    # Check if THCA is zero or very low
                    thca_pattern = re.search(r'THCA[:\s]*(\d+\.?\d*)[\s%]*', text, re.IGNORECASE)
                    if thca_pattern:
                        thca_val = float(thca_pattern.group(1))
                        if thca_val < 1.0:  # Very low or zero THCA with high delta-9
                            excerpt = clean_excerpt(text, delta9_pattern.group(0))
                            matches.append((page_num, excerpt))
                    else:
                        # THCA mentioned but no value - could be zero
                        excerpt = clean_excerpt(text, delta9_pattern.group(0))
                        matches.append((page_num, excerpt))
        # Also check for explicit "100%" with delta-9
        if re.search(r'100\s*%\s*(?:delta[- ]?9|delta[- ]?9[- ]?thc)', text, re.IGNORECASE):
            excerpt = clean_excerpt(text, "100%")
            matches.append((page_num, excerpt))
    return matches

def search_finding_4(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """State GC-MS method converts THCA into Delta-9 during testing."""
    matches = []
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        # Look for GC-MS mentions
        if any(method in text_lower for method in ["gc-ms", "gc/ms", "gcms", "gas chromatography"]):
            # Check for conversion/decarboxylation language
            if any(term in text_lower for term in ["convert", "conversion", "decarboxyl", "degrade", 
                                                     "into delta", "thca to", "thc-a to"]):
                if "thca" in text_lower or "thc-a" in text_lower:
                    # Find the GC-MS term to anchor excerpt
                    method_term = None
                    for m in ["gc-ms", "gc/ms", "gcms", "gas chromatography"]:
                        if m in text_lower:
                            method_term = m
                            break
                    excerpt = clean_excerpt(text, method_term or "gc")
                    matches.append((page_num, excerpt))
    return matches

def search_finding_5(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """Approximately 22 tested items out of ~889 evidence entries (extremely low coverage)."""
    matches = []
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        # Look for number patterns suggesting tested vs total
        # Pattern: "22" or "twenty-two" with context about testing
        if "22" in text or "twenty-two" in text_lower:
            if any(term in text_lower for term in ["test", "tested", "sample", "analyze", "analysis"]):
                if any(term in text_lower for term in ["889", "800", "900", "evidence", "entries", "items", "total"]):
                    excerpt = clean_excerpt(text, "22" if "22" in text else "twenty")
                    matches.append((page_num, excerpt))
        # Look for ratio patterns
        if re.search(r'\d+\s*(?:out\s*of|of|/)\s*\d+', text):
            if "test" in text_lower or "sample" in text_lower:
                excerpt = clean_excerpt(text, "out of" if "out of" in text_lower else "of")
                matches.append((page_num, excerpt))
    return matches

def search_finding_6(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """No homogenization of jars/packages; fragments cannot represent the whole."""
    matches = []
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if any(term in text_lower for term in ["homogeniz", "homogen", "fragment", "represent", 
                                                 "whole", "cannot", "not representative", "partial"]):
            if any(term in text_lower for term in ["jar", "package", "sample", "portion"]):
                excerpt = clean_excerpt(text, "homogen" if "homogen" in text_lower else "fragment")
                matches.append((page_num, excerpt))
    return matches

def search_finding_7(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """State Lab disclaimer (page ~743): hemp/marijuana differentiation NOT performed."""
    matches = []
    # Check page 743 specifically
    if 743 in text_by_page:
        text = text_by_page[743]
        text_lower = text.lower()
        if "hemp" in text_lower or "marijuana" in text_lower:
            if any(term in text_lower for term in ["differentiat", "disclaimer", "not performed", 
                                                     "not conducted", "not determined"]):
                excerpt = clean_excerpt(text, "hemp" if "hemp" in text_lower else "marijuana")
                matches.append((743, excerpt))
    # Check other pages for similar disclaimers
    for page_num, text in text_by_page.items():
        if page_num == 743:
            continue
        text_lower = text.lower()
        if ("hemp" in text_lower or "marijuana" in text_lower) and \
           any(term in text_lower for term in ["disclaimer", "not performed", "not conducted", 
                                                "differentiat", "not determined"]):
            excerpt = clean_excerpt(text, "hemp" if "hemp" in text_lower else "marijuana")
            matches.append((page_num, excerpt))
    return matches

def search_finding_8(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """THCA × 0.88 conversion automatically inflates THC levels."""
    matches = []
    for page_num, text in text_by_page.items():
        # Look for 0.88 or 0.877 conversion factor
        if re.search(r'0\.8{1,3}', text) or "0.88" in text or "0.877" in text:
            if "thca" in text.lower() or "thc-a" in text.lower():
                if any(term in text.lower() for term in ["multiply", "conversion", "convert", "total thc"]):
                    # Find the 0.88 pattern
                    factor_match = re.search(r'0\.8{1,3}', text)
                    excerpt = clean_excerpt(text, factor_match.group(0) if factor_match else "0.88")
                    matches.append((page_num, excerpt))
        # Also check page 744 specifically (mentioned in original finding)
        if page_num == 744 and "0.88" in text:
            if "thca" in text.lower():
                excerpt = clean_excerpt(text, "0.88")
                matches.append((page_num, excerpt))
    return matches

def search_finding_9(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """Felony aggregate weight charging done before establishing marijuana classification."""
    matches = []
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if any(term in text_lower for term in ["felony", "aggregate", "weight"]):
            if any(term in text_lower for term in ["charge", "charging", "before", "establish", 
                                                     "classification", "classify", "marijuana"]):
                excerpt = clean_excerpt(text, "felony" if "felony" in text_lower else "aggregate")
                matches.append((page_num, excerpt))
        # Also look for weight charging patterns
        if "aggregate weight" in text_lower:
            if "marijuana" in text_lower or "classification" in text_lower:
                excerpt = clean_excerpt(text, "aggregate weight")
                matches.append((page_num, excerpt))
    return matches

def search_finding_10(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """Weights from different stores combined without THC classification for each item."""
    matches = []
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if any(term in text_lower for term in ["store", "location", "different"]):
            if any(term in text_lower for term in ["combined", "aggregate", "total weight", "sum"]):
                if any(term in text_lower for term in ["without", "no classification", "thc", "each item"]):
                    excerpt = clean_excerpt(text, "store" if "store" in text_lower else "combined")
                    matches.append((page_num, excerpt))
    return matches

def search_finding_11(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """Sampling did not follow SWGDRUG, ASTM, or any statistically valid protocol."""
    matches = []
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        # Look for SWGDRUG or ASTM mentions
        if any(term in text_lower for term in ["swgdrug", "swg-drug", "astm"]):
            if "sampling" in text_lower or "sample" in text_lower:
                excerpt = clean_excerpt(text, "swgdrug" if "swgdrug" in text_lower else "astm")
                matches.append((page_num, excerpt))
        # Look for "non-statistical" or lack of statistical protocol
        if "non-statistical" in text_lower or "non statistical" in text_lower:
            if "sampling" in text_lower:
                excerpt = clean_excerpt(text, "non-statistical")
                matches.append((page_num, excerpt))
        # Look for protocol mentions without statistical validity
        if "sampling" in text_lower and "protocol" in text_lower:
            if "statistical" not in text_lower or "non-statistical" in text_lower:
                excerpt = clean_excerpt(text, "sampling")
                matches.append((page_num, excerpt))
    return matches

def search_finding_12(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """Final expert conclusion: results scientifically and legally unreliable for marijuana classification."""
    matches = []
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        # Look for expert/opinion/conclusion language
        if any(term in text_lower for term in ["expert", "opinion", "conclusion", "conclude"]):
            if any(term in text_lower for term in ["unreliable", "not reliable", "unreliability", 
                                                     "scientifically", "legally", "invalid"]):
                if "marijuana" in text_lower or "classification" in text_lower or "cannabis" in text_lower:
                    excerpt = clean_excerpt(text, "expert" if "expert" in text_lower else "conclusion")
                    matches.append((page_num, excerpt))
        # Also look for reliability statements
        if "unreliable" in text_lower or "not reliable" in text_lower:
            if "marijuana" in text_lower or "cannabis" in text_lower:
                excerpt = clean_excerpt(text, "unreliable")
                matches.append((page_num, excerpt))
    return matches

def search_lab_reports(text_by_page: Dict[int, str]) -> List[Tuple[int, str, str]]:
    """Search for additional lab reports, COAs, supplemental analyses."""
    lab_reports = []
    report_keywords = [
        ("lab report", "Lab Report"),
        ("laboratory report", "Lab Report"),
        ("certificate of analysis", "COA"),
        ("coa", "COA"),
        ("supplemental report", "Supplemental Report"),
        ("revised report", "Revised Report"),
        ("final report", "Final Report"),
        ("analytical report", "Analytical Report"),
        ("forensic report", "Forensic Report"),
        ("nms labs", "NMS Labs Report"),
        ("maryland state police", "MDSP Lab Report"),
        ("controlled dangerous substance analysis", "CDS Analysis Report"),
    ]
    
    seen_pages = set()
    for page_num, text in text_by_page.items():
        if page_num in seen_pages:
            continue
        text_lower = text.lower()
        
        # Check for report headers/indicators
        for keyword, report_type in report_keywords:
            if keyword in text_lower:
                # Try to get more specific info from first lines
                lines = text.split('\n')[:15]
                header_text = " ".join([line.strip() for line in lines if line.strip()][:5])
                
                # Determine if it's a unique report
                if any(indicator in text_lower for indicator in ["report", "analysis", "certificate", 
                                                                   "laboratory", "forensic"]):
                    excerpt = clean_excerpt(text, keyword, context=300)
                    lab_reports.append((page_num, report_type, excerpt or header_text[:400]))
                    seen_pages.add(page_num)
                    break
    
    return lab_reports

def main():
    global HAS_PDFPLUMBER, HAS_PYPDF2
    pdf_path = PDF_PATH
    
    if not Path(pdf_path).exists():
        print(f"ERROR: PDF file not found: {pdf_path}")
        return
    
    print(f"Extracting text from PDF...")
    print(f"File size: {Path(pdf_path).stat().st_size / (1024*1024):.1f} MB")
    
    if not HAS_PDFPLUMBER and not HAS_PYPDF2:
        print("Installing pdfplumber...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
        import pdfplumber
        HAS_PDFPLUMBER = True
    
    if HAS_PDFPLUMBER:
        print("Using pdfplumber...")
        text_by_page = extract_text_pdfplumber(pdf_path)
    elif HAS_PYPDF2:
        from PyPDF2 import PdfReader
        text_by_page = {}
        reader = PdfReader(pdf_path)
        for page_num, page in enumerate(reader.pages, start=1):
            text_by_page[page_num] = page.extract_text() or ""
    else:
        print("ERROR: Could not extract PDF text")
        return
    
    print(f"Extracted text from {len(text_by_page)} pages\n")
    
    findings_functions = {
        1: search_finding_1,
        2: search_finding_2,
        3: search_finding_3,
        4: search_finding_4,
        5: search_finding_5,
        6: search_finding_6,
        7: search_finding_7,
        8: search_finding_8,
        9: search_finding_9,
        10: search_finding_10,
        11: search_finding_11,
        12: search_finding_12,
    }
    
    print("Searching for findings...")
    all_findings = {}
    for finding_num, search_func in findings_functions.items():
        print(f"  Searching finding {finding_num}...")
        matches = search_func(text_by_page)
        all_findings[finding_num] = matches
    
    print("\nSearching for lab reports...")
    lab_reports = search_lab_reports(text_by_page)
    
    # Format output exactly as requested
    print("\n" + "="*80)
    print("RESULTS")
    print("="*80)
    
    for finding_num in sorted(all_findings.keys()):
        matches = all_findings[finding_num]
        print(f"\nFINDING #{finding_num}:")
        if matches:
            # Remove duplicate pages, keep unique
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
        seen_reports = {}
        for page_num, report_type, excerpt in lab_reports:
            # Avoid duplicates
            key = f"{page_num}_{report_type}"
            if key not in seen_reports:
                seen_reports[key] = True
                excerpt_display = excerpt[:300] + "..." if len(excerpt) > 300 else excerpt
                print(f"• Page {page_num} — [file] ({report_type}): \"{excerpt_display}\"")
    else:
        print("NO ADDITIONAL LAB REPORTS FOUND.")

if __name__ == "__main__":
    main()

