#!/usr/bin/env python3
"""
Extract page numbers and quotes supporting 12 specific findings from the discovery PDF.
Also search for additional lab reports.
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

def extract_text_pypdf2(pdf_path: str) -> Dict[int, str]:
    """Extract text from PDF using PyPDF2 as fallback."""
    text_by_page = {}
    reader = PdfReader(pdf_path)
    for page_num, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text()
            text_by_page[page_num] = text or ""
        except:
            text_by_page[page_num] = ""
    return text_by_page

def clean_text(text: str) -> str:
    """Clean and normalize text for searching."""
    return " ".join(text.split())

def find_relevant_excerpt(page_text: str, keywords: List[str], context_chars: int = 300) -> str:
    """Find relevant excerpt around keywords."""
    page_text_lower = page_text.lower()
    for keyword in keywords:
        if keyword.lower() in page_text_lower:
            idx = page_text_lower.find(keyword.lower())
            start = max(0, idx - context_chars // 2)
            end = min(len(page_text), idx + len(keyword) + context_chars // 2)
            excerpt = page_text[start:end].strip()
            # Clean up newlines
            excerpt = " ".join(excerpt.split())
            return excerpt
    return ""

def search_finding_1(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """LightLab is unvalidated: proprietary algorithms, unknown error rates, no peer-reviewed validation."""
    matches = []
    keywords = ["lightlab", "light lab", "validation", "validate", "unvalidated", "proprietary", 
                "algorithm", "error rate", "peer review", "peer-reviewed"]
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if any(kw in text_lower for kw in keywords):
            # Check if it's about LightLab specifically
            if "lightlab" in text_lower or "light lab" in text_lower:
                excerpt = find_relevant_excerpt(text, ["lightlab", "light lab", "validation", "proprietary"])
                if excerpt:
                    matches.append((page_num, excerpt))
    
    return matches

def search_finding_2(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """LightLab cannot legally be used to determine criminality or support probable cause."""
    matches = []
    keywords = ["lightlab", "light lab", "criminality", "criminal", "probable cause", 
                "legally", "legal use", "cannot be used", "not intended", "purpose"]
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if any(kw in text_lower for kw in keywords):
            if "lightlab" in text_lower or "light lab" in text_lower:
                excerpt = find_relevant_excerpt(text, ["lightlab", "light lab", "criminal", "probable cause", "legal"])
                if excerpt:
                    matches.append((page_num, excerpt))
    
    return matches

def search_finding_3(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """LightLab produced chemically impossible results (100% Delta-9 with zero THCA, etc.)."""
    matches = []
    keywords = ["100%", "100 percent", "delta-9", "delta 9", "thca", "thc-a", 
                "zero", "0%", "impossible", "chemically", "100.0%"]
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        # Look for pages with 100% delta-9 and no/zero THCA
        if ("100%" in text or "100.0%" in text) and ("delta-9" in text_lower or "delta 9" in text_lower):
            if "thca" in text_lower or "thc-a" in text_lower:
                # Check if THCA is zero or absent
                thca_match = re.search(r'THCA[:\s]*(\d+\.?\d*)[\s%]*', text, re.IGNORECASE)
                if thca_match:
                    thca_val = float(thca_match.group(1))
                    if thca_val == 0:
                        excerpt = find_relevant_excerpt(text, ["100%", "delta-9", "thca"])
                        if excerpt:
                            matches.append((page_num, excerpt))
                else:
                    # THCA mentioned but might be zero
                    excerpt = find_relevant_excerpt(text, ["100%", "delta-9", "thca"])
                    if excerpt and ("0" in excerpt or "zero" in excerpt.lower() or "none" in excerpt.lower()):
                        matches.append((page_num, excerpt))
    
    return matches

def search_finding_4(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """State GC-MS method converts THCA into Delta-9 during testing."""
    matches = []
    keywords = ["gc-ms", "gcms", "gc/ms", "gas chromatography", "mass spectrometry",
                "convert", "conversion", "thca", "thc-a", "delta-9", "delta 9", "decarboxylation"]
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if any(kw in text_lower for kw in ["gc-ms", "gcms", "gc/ms", "gas chromatography"]):
            if any(kw in text_lower for kw in ["convert", "conversion", "decarboxyl"]):
                if "thca" in text_lower or "thc-a" in text_lower:
                    excerpt = find_relevant_excerpt(text, ["gc-ms", "gcms", "convert", "thca", "delta-9"])
                    if excerpt:
                        matches.append((page_num, excerpt))
    
    return matches

def search_finding_5(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """Approximately 22 tested items out of ~889 evidence entries (extremely low coverage)."""
    matches = []
    keywords = ["22", "twenty-two", "889", "tested", "test", "evidence", "entries", 
                "items", "sample", "coverage"]
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        # Look for pages mentioning both ~22 and ~889, or similar counts
        if "22" in text or "twenty-two" in text_lower:
            if any(kw in text_lower for kw in ["test", "tested", "sample", "analyze"]):
                if any(kw in text_lower for kw in ["889", "800", "900", "evidence", "entries", "items"]):
                    excerpt = find_relevant_excerpt(text, ["22", "889", "tested", "evidence"])
                    if excerpt:
                        matches.append((page_num, excerpt))
        # Also search for ratios or percentages that suggest low coverage
        if re.search(r'\d+\s*out\s*of\s*\d+', text_lower) or re.search(r'\d+\s*/\s*\d+', text):
            if any(kw in text_lower for kw in ["test", "sample", "evidence"]):
                excerpt = find_relevant_excerpt(text, ["out of", "test", "evidence"])
                if excerpt:
                    matches.append((page_num, excerpt))
    
    return matches

def search_finding_6(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """No homogenization of jars/packages; fragments cannot represent the whole."""
    matches = []
    keywords = ["homogeniz", "homogen", "fragment", "whole", "represent", "jar", "package",
                "cannot", "not representative", "partial", "portion"]
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if any(kw in text_lower for kw in keywords):
            excerpt = find_relevant_excerpt(text, ["homogen", "fragment", "represent", "whole"])
            if excerpt:
                matches.append((page_num, excerpt))
    
    return matches

def search_finding_7(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """State Lab disclaimer (page ~743): hemp/marijuana differentiation NOT performed."""
    matches = []
    keywords = ["hemp", "marijuana", "differentiation", "differentiate", "disclaimer",
                "not performed", "not conducted", "not determined"]
    
    # Check page 743 specifically
    if 743 in text_by_page:
        text = text_by_page[743]
        text_lower = text.lower()
        if "hemp" in text_lower or "marijuana" in text_lower:
            excerpt = find_relevant_excerpt(text, ["hemp", "marijuana", "differentiat", "disclaimer"])
            if excerpt:
                matches.append((743, excerpt))
    
    # Also search other pages for similar disclaimers
    for page_num, text in text_by_page.items():
        if page_num == 743:
            continue
        text_lower = text.lower()
        if ("hemp" in text_lower or "marijuana" in text_lower) and \
           ("disclaimer" in text_lower or "not performed" in text_lower or "not conducted" in text_lower):
            excerpt = find_relevant_excerpt(text, ["hemp", "marijuana", "disclaimer", "not"])
            if excerpt:
                matches.append((page_num, excerpt))
    
    return matches

def search_finding_8(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """THCA × 0.88 conversion automatically inflates THC levels."""
    matches = []
    keywords = ["0.88", "0.88", "thca", "thc-a", "0.877", "conversion", "multiply",
                "inflate", "total thc", "thc level"]
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if "0.88" in text or "0.877" in text or ".88" in text:
            if "thca" in text_lower or "thc-a" in text_lower:
                excerpt = find_relevant_excerpt(text, ["0.88", "thca", "conversion", "multiply"])
                if excerpt:
                    matches.append((page_num, excerpt))
    
    return matches

def search_finding_9(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """Felony aggregate weight charging done before establishing marijuana classification."""
    matches = []
    keywords = ["felony", "aggregate", "weight", "charging", "charge", "before",
                "marijuana", "classification", "classify", "establish"]
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if any(kw in text_lower for kw in ["felony", "aggregate"]):
            if any(kw in text_lower for kw in ["weight", "charge", "charging"]):
                if any(kw in text_lower for kw in ["marijuana", "classification", "classify"]):
                    excerpt = find_relevant_excerpt(text, ["felony", "aggregate", "weight", "marijuana"])
                    if excerpt:
                        matches.append((page_num, excerpt))
    
    return matches

def search_finding_10(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """Weights from different stores combined without THC classification for each item."""
    matches = []
    keywords = ["store", "different", "combined", "weight", "thc", "classification",
                "each item", "without", "aggregate"]
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if any(kw in text_lower for kw in ["store", "location"]):
            if any(kw in text_lower for kw in ["combined", "aggregate", "total"]):
                if any(kw in text_lower for kw in ["weight", "thc", "classification"]):
                    excerpt = find_relevant_excerpt(text, ["store", "combined", "weight", "thc"])
                    if excerpt:
                        matches.append((page_num, excerpt))
    
    return matches

def search_finding_11(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """Sampling did not follow SWGDRUG, ASTM, or any statistically valid protocol."""
    matches = []
    keywords = ["swgdrug", "swg-drug", "astm", "statistically", "protocol", "sampling",
                "follow", "method", "procedure", "standard"]
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if any(kw in text_lower for kw in ["swgdrug", "swg-drug", "astm"]):
            excerpt = find_relevant_excerpt(text, ["swgdrug", "astm", "sampling", "protocol"])
            if excerpt:
                matches.append((page_num, excerpt))
        elif "sampling" in text_lower and ("protocol" in text_lower or "procedure" in text_lower):
            if "statistical" in text_lower or "standard" in text_lower:
                excerpt = find_relevant_excerpt(text, ["sampling", "protocol", "statistical"])
                if excerpt:
                    matches.append((page_num, excerpt))
    
    return matches

def search_finding_12(text_by_page: Dict[int, str]) -> List[Tuple[int, str]]:
    """Final expert conclusion: results scientifically and legally unreliable for marijuana classification."""
    matches = []
    keywords = ["expert", "conclusion", "unreliable", "not reliable", "scientifically",
                "legally", "marijuana", "classification", "opinion", "expert opinion"]
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if "expert" in text_lower or "conclusion" in text_lower:
            if any(kw in text_lower for kw in ["unreliable", "not reliable", "scientifically", "legally"]):
                if "marijuana" in text_lower or "classification" in text_lower:
                    excerpt = find_relevant_excerpt(text, ["expert", "conclusion", "unreliable", "marijuana"])
                    if excerpt:
                        matches.append((page_num, excerpt))
    
    return matches

def search_lab_reports(text_by_page: Dict[int, str]) -> List[Tuple[int, str, str]]:
    """Search for additional lab reports, COAs, supplemental analyses."""
    lab_reports = []
    keywords = ["lab report", "laboratory report", "certificate of analysis", "coa",
                "supplemental", "revised", "final report", "test report", "analysis report",
                "forensic report", "analytical report"]
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        # Look for report headers or titles
        if any(kw in text_lower for kw in keywords):
            # Try to extract report title/header
            lines = text.split('\n')[:10]  # First 10 lines often contain headers
            header = " ".join([line.strip() for line in lines if line.strip()][:3])
            
            # Determine report type
            report_type = "Lab Report"
            if "certificate" in text_lower or "coa" in text_lower:
                report_type = "COA"
            elif "supplemental" in text_lower:
                report_type = "Supplemental Report"
            elif "revised" in text_lower:
                report_type = "Revised Report"
            
            excerpt = find_relevant_excerpt(text, keywords, context_chars=200)
            lab_reports.append((page_num, report_type, excerpt or header[:300]))
    
    # Remove duplicates (same page appearing multiple times)
    seen_pages = set()
    unique_reports = []
    for page_num, report_type, excerpt in lab_reports:
        if page_num not in seen_pages:
            seen_pages.add(page_num)
            unique_reports.append((page_num, report_type, excerpt))
    
    return unique_reports

def main():
    global HAS_PDFPLUMBER, HAS_PYPDF2
    pdf_path = PDF_PATH
    
    if not Path(pdf_path).exists():
        print(f"ERROR: PDF file not found: {pdf_path}")
        return
    
    print(f"Extracting text from PDF...")
    print(f"File size: {Path(pdf_path).stat().st_size / (1024*1024):.1f} MB")
    
    # Install pdfplumber if needed
    if not HAS_PDFPLUMBER and not HAS_PYPDF2:
        print("Installing pdfplumber...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
        import pdfplumber
        HAS_PDFPLUMBER = True
    
    # Extract text
    if HAS_PDFPLUMBER:
        print("Using pdfplumber...")
        text_by_page = extract_text_pdfplumber(pdf_path)
    elif HAS_PYPDF2:
        print("Using PyPDF2...")
        text_by_page = extract_text_pypdf2(pdf_path)
    else:
        print("ERROR: Could not extract PDF text")
        return
    
    print(f"Extracted text from {len(text_by_page)} pages\n")
    
    # Search each finding
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
    
    print("Searching for findings...")
    all_findings = {}
    for finding_num, search_func in findings_functions.items():
        print(f"  Searching finding {finding_num}...")
        matches = search_func(text_by_page)
        all_findings[finding_num] = matches
    
    print("\nSearching for lab reports...")
    lab_reports = search_lab_reports(text_by_page)
    
    # Format output
    print("\n" + "="*80)
    print("RESULTS")
    print("="*80)
    
    for finding_num in sorted(all_findings.keys()):
        matches = all_findings[finding_num]
        print(f"\nFINDING #{finding_num}:")
        if matches:
            # Remove duplicates and limit to reasonable number
            seen_excerpts = set()
            for page_num, excerpt in matches:
                if page_num not in seen_excerpts:
                    seen_excerpts.add(page_num)
                    # Truncate excerpt if too long
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

