import sys
import re
from pathlib import Path
from collections import defaultdict

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False
    try:
        import PyPDF2
        HAS_PYPDF2 = True
    except ImportError:
        HAS_PYPDF2 = False

def extract_text_pdfplumber(pdf_path):
    """Extract text using pdfplumber"""
    text_by_page = {}
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            try:
                text = page.extract_text()
                text_by_page[page_num] = text or ""
            except:
                text_by_page[page_num] = ""
    return text_by_page

def search_finding_1(text_by_page):
    """LightLab is unvalidated: proprietary algorithms, unknown error rates, no peer-reviewed validation."""
    matches = []
    keywords = ["LightLab", "Light Lab", "lightlab"]
    validation_keywords = ["unvalidated", "validation", "validate", "validated", "proprietary", "algorithm", "error rate", "peer review", "peer-reviewed", "peer reviewed"]
    
    for page_num, text in text_by_page.items():
        if not text:
            continue
        text_lower = text.lower()
        if any(kw.lower() in text_lower for kw in keywords):
            if any(vk in text_lower for vk in validation_keywords):
                # Extract relevant sentences
                sentences = re.split(r'[.!?]+', text)
                relevant = []
                for sent in sentences:
                    sent_lower = sent.lower()
                    if any(kw.lower() in sent_lower for kw in keywords) and any(vk in sent_lower for vk in validation_keywords):
                        relevant.append(sent.strip())
                if relevant:
                    matches.append({
                        "page": page_num,
                        "excerpt": " ".join(relevant[:3])[:500]
                    })
    return matches

def search_finding_2(text_by_page):
    """LightLab cannot legally be used to determine criminality or support probable cause."""
    matches = []
    for page_num, text in text_by_page.items():
        if not text:
            continue
        text_lower = text.lower()
        if "lightlab" in text_lower or "light lab" in text_lower:
            if any(term in text_lower for term in ["legal", "legally", "criminal", "probable cause", "determine"]):
                # Get context
                lines = text.split('\n')
                relevant_lines = []
                for i, line in enumerate(lines):
                    if "lightlab" in line.lower() or "light lab" in line.lower():
                        start = max(0, i - 3)
                        end = min(len(lines), i + 4)
                        context = '\n'.join(lines[start:end])
                        relevant_lines.append(context.strip())
                if relevant_lines:
                    matches.append({
                        "page": page_num,
                        "excerpt": relevant_lines[0][:500]
                    })
    return matches

def search_finding_3(text_by_page):
    """LightLab produced chemically impossible results (100% Delta-9 with zero THCA, etc.)."""
    matches = []
    for page_num, text in text_by_page.items():
        if not text:
            continue
        # Look for patterns like "100%", "Delta-9", "zero THCA", "0% THCA"
        if re.search(r'100\s*%\s*(delta[- ]?9|Delta[- ]?9)', text, re.IGNORECASE):
            if "thca" in text.lower() or "thc-a" in text.lower():
                matches.append({
                    "page": page_num,
                    "excerpt": text[:500]
                })
        elif re.search(r'(zero|0\s*%)\s*(thca|thc[- ]?a)', text, re.IGNORECASE):
            if "delta-9" in text.lower() or "delta 9" in text.lower():
                matches.append({
                    "page": page_num,
                    "excerpt": text[:500]
                })
    return matches

def search_finding_4(text_by_page):
    """State GC-MS method converts THCA into Delta-9 during testing."""
    matches = []
    for page_num, text in text_by_page.items():
        if not text:
            continue
        text_lower = text.lower()
        if ("gc-ms" in text_lower or "gc/ms" in text_lower or "gas chromatography" in text_lower) and "thca" in text_lower:
            if any(term in text_lower for term in ["convert", "conversion", "into", "delta-9", "delta 9"]):
                matches.append({
                    "page": page_num,
                    "excerpt": text[:500]
                })
    return matches

def search_finding_5(text_by_page):
    """Approximately 22 tested items out of ~889 evidence entries (extremely low coverage)."""
    matches = []
    for page_num, text in text_by_page.items():
        if not text:
            continue
        # Look for numbers like 22, 889, or ratios
        if re.search(r'\b22\b', text):
            if re.search(r'\b88[0-9]\b', text) or "889" in text:
                matches.append({
                    "page": page_num,
                    "excerpt": text[:500]
                })
        # Also look for "tested" near large numbers
        if "tested" in text.lower() and (re.search(r'\b88[0-9]\b', text) or "889" in text):
            matches.append({
                "page": page_num,
                "excerpt": text[:500]
            })
    return matches

def search_finding_6(text_by_page):
    """No homogenization of jars/packages; fragments cannot represent the whole."""
    matches = []
    for page_num, text in text_by_page.items():
        if not text:
            continue
        text_lower = text.lower()
        if any(term in text_lower for term in ["homogen", "fragment", "jar", "package"]):
            if any(term in text_lower for term in ["represent", "whole", "entire", "sample"]):
                matches.append({
                    "page": page_num,
                    "excerpt": text[:500]
                })
    return matches

def search_finding_7(text_by_page):
    """State Lab disclaimer (page ~743): hemp/marijuana differentiation NOT performed."""
    matches = []
    # Specifically check page 743 and nearby pages
    for page_num in [740, 741, 742, 743, 744, 745, 746]:
        if page_num in text_by_page:
            text = text_by_page[page_num]
            text_lower = text.lower()
            if any(term in text_lower for term in ["disclaimer", "hemp", "marijuana", "differentiation"]):
                if any(term in text_lower for term in ["not performed", "not", "no"]):
                    matches.append({
                        "page": page_num,
                        "excerpt": text[:800]
                    })
    # Also search all pages for disclaimer text
    for page_num, text in text_by_page.items():
        if page_num < 740 or page_num > 746:
            continue
        text_lower = text.lower()
        if "disclaimer" in text_lower and "hemp" in text_lower and "marijuana" in text_lower:
            matches.append({
                "page": page_num,
                "excerpt": text[:800]
            })
    return matches

def search_finding_8(text_by_page):
    """THCA × 0.88 conversion automatically inflates THC levels."""
    matches = []
    for page_num, text in text_by_page.items():
        if not text:
            continue
        # Look for 0.88, 0.877, 0.878, or similar conversion factors
        if re.search(r'0\.8[7-9][0-9]?', text) or "0.88" in text or "0.877" in text:
            if "thca" in text.lower() or "thc-a" in text.lower():
                matches.append({
                    "page": page_num,
                    "excerpt": text[:500]
                })
        # Also look for "multiply", "convert", "inflate" with THCA
        text_lower = text.lower()
        if "thca" in text_lower and any(term in text_lower for term in ["multiply", "convert", "conversion", "inflate", "×", "x"]):
            matches.append({
                "page": page_num,
                "excerpt": text[:500]
            })
    return matches

def search_finding_9(text_by_page):
    """Felony aggregate weight charging done before establishing marijuana classification."""
    matches = []
    for page_num, text in text_by_page.items():
        if not text:
            continue
        text_lower = text.lower()
        if any(term in text_lower for term in ["felony", "aggregate", "weight"]):
            if any(term in text_lower for term in ["charge", "charging", "classify", "classification", "marijuana"]):
                matches.append({
                    "page": page_num,
                    "excerpt": text[:500]
                })
    return matches

def search_finding_10(text_by_page):
    """Weights from different stores combined without THC classification for each item."""
    matches = []
    for page_num, text in text_by_page.items():
        if not text:
            continue
        text_lower = text.lower()
        if any(term in text_lower for term in ["store", "location", "combined"]):
            if any(term in text_lower for term in ["weight", "thc", "classification", "each item", "item"]):
                matches.append({
                    "page": page_num,
                    "excerpt": text[:500]
                })
    return matches

def search_finding_11(text_by_page):
    """Sampling did not follow SWGDRUG, ASTM, or any statistically valid protocol."""
    matches = []
    for page_num, text in text_by_page.items():
        if not text:
            continue
        text_lower = text.lower()
        if any(term in text_lower for term in ["swgdrug", "astm", "statistical", "sampling", "protocol"]):
            if any(term in text_lower for term in ["non-statistical", "not", "no"]):
                matches.append({
                    "page": page_num,
                    "excerpt": text[:600]
                })
    return matches

def search_finding_12(text_by_page):
    """Final expert conclusion: results scientifically and legally unreliable for marijuana classification."""
    matches = []
    for page_num, text in text_by_page.items():
        if not text:
            continue
        text_lower = text.lower()
        if any(term in text_lower for term in ["expert", "conclusion", "unreliable", "scientifically", "legally"]):
            if any(term in text_lower for term in ["marijuana", "classification", "result"]):
                matches.append({
                    "page": page_num,
                    "excerpt": text[:500]
                })
    return matches

def search_lab_reports(text_by_page):
    """Search for lab reports, COAs, supplemental analyses"""
    lab_reports = []
    
    report_patterns = [
        (r'lab(oratory)?\s+report', "lab report"),
        (r'certificate\s+of\s+analysis', "COA"),
        (r'\bcoa\b', "COA"),
        (r'supplemental\s+(report|analysis)', "supplemental report"),
        (r'revised\s+(report|analysis)', "revised report"),
        (r'forensic\s+(report|analysis)', "forensic report"),
        (r'results?\s+of\s+analysis', "analysis results"),
    ]
    
    seen_pages = set()
    
    for page_num, text in text_by_page.items():
        if not text or page_num in seen_pages:
            continue
        
        text_lower = text.lower()
        
        for pattern, report_type in report_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                # Extract header/title
                lines = text.split('\n')[:15]
                title = ""
                for line in lines[:10]:
                    line_stripped = line.strip()
                    if len(line_stripped) > 10 and any(keyword in line_stripped.lower() for keyword in ["report", "certificate", "analysis", "laboratory", "results"]):
                        title = line_stripped[:150]
                        break
                
                # Check if this looks like a new report (starts with report header)
                is_report_start = False
                first_lines = '\n'.join(lines[:5]).lower()
                if any(term in first_lines for term in ["report", "certificate", "laboratory", "results of analysis"]):
                    is_report_start = True
                
                lab_reports.append({
                    "page": page_num,
                    "type": report_type,
                    "title": title,
                    "excerpt": text[:600],
                    "is_start": is_report_start
                })
                seen_pages.add(page_num)
                break
    
    return lab_reports

def main():
    global HAS_PDFPLUMBER
    pdf_path = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
    
    print(f"Extracting text from PDF...")
    
    if not HAS_PDFPLUMBER and not HAS_PYPDF2:
        print("Installing pdfplumber...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
        import pdfplumber
        HAS_PDFPLUMBER = True
    
    if HAS_PDFPLUMBER:
        text_by_page = extract_text_pdfplumber(pdf_path)
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
    
    print("="*80)
    print("RESULTS")
    print("="*80)
    
    for finding_num in sorted(findings_functions.keys()):
        print(f"\nFINDING #{finding_num}:")
        matches = findings_functions[finding_num](text_by_page)
        
        if matches:
            # Remove duplicates and limit to reasonable number
            seen = set()
            unique_matches = []
            for match in matches:
                key = (match["page"], match["excerpt"][:100])
                if key not in seen:
                    seen.add(key)
                    unique_matches.append(match)
            
            for match in unique_matches[:8]:  # Limit to 8 per finding
                excerpt = match["excerpt"].replace('\n', ' ').strip()
                # Clean up excerpt
                excerpt = re.sub(r'\s+', ' ', excerpt)
                print(f"• Page {match['page']} — [file]: \"{excerpt[:400]}...\"")
        else:
            print("NO SUPPORTING PAGES FOUND.")
    
    print("\n" + "="*80)
    print("ADDITIONAL LAB REPORTS FOUND:")
    print("="*80)
    
    lab_reports = search_lab_reports(text_by_page)
    
    if lab_reports:
        # Group by type and show distinct reports
        reports_by_type = defaultdict(list)
        for report in lab_reports:
            reports_by_type[report["type"]].append(report)
        
        for report in lab_reports[:25]:  # Show up to 25
            excerpt = report["excerpt"].replace('\n', ' ').strip()
            excerpt = re.sub(r'\s+', ' ', excerpt)
            print(f"\n• Page {report['page']} — [file]: \"{excerpt[:400]}...\"")
            print(f"  Type: {report['type']}")
    else:
        print("No additional lab reports found.")

if __name__ == "__main__":
    main()

