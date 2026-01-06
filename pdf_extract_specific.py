import sys
import re
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
    import pdfplumber

def extract_page_range(pdf_path, start_page, end_page):
    """Extract specific page range"""
    text_by_page = {}
    with pdfplumber.open(pdf_path) as pdf:
        for page_num in range(start_page - 1, min(end_page, len(pdf.pages))):
            try:
                page = pdf.pages[page_num]
                text = page.extract_text()
                text_by_page[page_num + 1] = text or ""
            except:
                text_by_page[page_num + 1] = ""
    return text_by_page

def search_all_pages(pdf_path):
    """Extract all pages and search for specific terms"""
    text_by_page = {}
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            try:
                text = page.extract_text()
                text_by_page[page_num] = text or ""
            except:
                text_by_page[page_num] = ""
    return text_by_page

def find_specific_quotes(text_by_page):
    """Find specific quotes for each finding"""
    results = {}
    
    # Finding 1: LightLab validation
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if "lightlab" in text_lower or "light lab" in text_lower:
            if any(term in text_lower for term in ["proprietary", "validation", "validate", "unvalidated", "error", "peer"]):
                if 1 not in results:
                    results[1] = []
                results[1].append((page_num, text[:800]))
    
    # Finding 3: 100% Delta-9 with zero THCA
    for page_num, text in text_by_page.items():
        if re.search(r'100\s*%\s*(delta[- ]?9|Delta[- ]?9)', text, re.IGNORECASE):
            if "thca" in text.lower():
                if 3 not in results:
                    results[3] = []
                results[3].append((page_num, text[:800]))
        # Also check for "zero THCA" or "0% THCA"
        if re.search(r'(zero|0\s*%)\s*(thca|thc[- ]?a)', text, re.IGNORECASE):
            if 3 not in results:
                results[3] = []
            results[3].append((page_num, text[:800]))
    
    # Finding 4: GC-MS conversion
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        if ("gc-ms" in text_lower or "gc/ms" in text_lower) and "thca" in text_lower:
            if any(term in text_lower for term in ["convert", "decarboxyl", "degrade", "into", "delta-9"]):
                if 4 not in results:
                    results[4] = []
                results[4].append((page_num, text[:800]))
    
    # Finding 5: 22 tested items / 889 entries
    for page_num, text in text_by_page.items():
        # Look for "22" and "889" on same page or nearby context
        if "22" in text and "889" in text:
            if 5 not in results:
                results[5] = []
            results[5].append((page_num, text[:800]))
        # Also check for "tested" with numbers
        if "tested" in text.lower():
            if re.search(r'\b(2[0-5]|889|88[0-9])\b', text):
                if 5 not in results:
                    results[5] = []
                results[5].append((page_num, text[:800]))
    
    # Finding 7: Page 743 disclaimer
    for page_num in [740, 741, 742, 743, 744, 745, 746]:
        if page_num in text_by_page:
            text = text_by_page[page_num]
            text_lower = text.lower()
            if "disclaimer" in text_lower or "hemp" in text_lower:
                if "marijuana" in text_lower or "differentiation" in text_lower:
                    if 7 not in results:
                        results[7] = []
                    results[7].append((page_num, text))
    
    # Finding 8: 0.88 conversion
    for page_num, text in text_by_page.items():
        if re.search(r'0\.8[7-9][0-9]?\s*\*?\s*thca', text, re.IGNORECASE) or re.search(r'thca\s*\*?\s*0\.8[7-9][0-9]?', text, re.IGNORECASE):
            if 8 not in results:
                results[8] = []
            results[8].append((page_num, text[:800]))
        # Also look for "0.877" or "0.878" which are common conversion factors
        if re.search(r'0\.87[7-8]', text):
            if "thca" in text.lower() or "thc" in text.lower():
                if 8 not in results:
                    results[8] = []
                results[8].append((page_num, text[:800]))
    
    return results

def find_lab_reports(text_by_page):
    """Find all lab reports"""
    lab_reports = []
    seen_titles = set()
    
    for page_num, text in text_by_page.items():
        if not text:
            continue
        
        text_lower = text.lower()
        
        # Check for report headers
        lines = text.split('\n')
        first_20_lines = '\n'.join(lines[:20]).lower()
        
        # Look for report identifiers
        is_lab_report = False
        report_type = None
        
        if any(pattern in first_20_lines for pattern in ["controlled dangerous substance analysis report", "laboratory examination", "results of analysis"]):
            is_lab_report = True
            report_type = "Lab Analysis Report"
        elif "certificate of analysis" in first_20_lines or "coa" in first_20_lines:
            is_lab_report = True
            report_type = "COA"
        elif "nms labs" in first_20_lines or "forensic" in first_20_lines:
            is_lab_report = True
            report_type = "Forensic Lab Report"
        elif "supplemental" in first_20_lines and any(term in first_20_lines for term in ["report", "analysis"]):
            is_lab_report = True
            report_type = "Supplemental Report"
        elif "revised" in first_20_lines and any(term in first_20_lines for term in ["report", "analysis"]):
            is_lab_report = True
            report_type = "Revised Report"
        
        if is_lab_report:
            # Extract report title/identifier
            title = ""
            for line in lines[:15]:
                line_stripped = line.strip()
                if len(line_stripped) > 15:
                    if any(keyword in line_stripped.lower() for keyword in ["report", "case", "fsd", "lab work order", "analysis"]):
                        title = line_stripped[:200]
                        break
            
            # Create identifier
            report_id = f"{page_num}_{title[:50]}"
            if report_id not in seen_titles:
                seen_titles.add(report_id)
                lab_reports.append({
                    "page": page_num,
                    "type": report_type,
                    "title": title,
                    "excerpt": text[:600]
                })
    
    return lab_reports

def main():
    pdf_path = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
    
    print("Extracting all pages...")
    text_by_page = search_all_pages(pdf_path)
    print(f"Extracted {len(text_by_page)} pages\n")
    
    # Get page 743 specifically for finding 7
    page_743_text = text_by_page.get(743, "")
    
    print("="*80)
    print("DETAILED EXTRACTION - KEY FINDINGS")
    print("="*80)
    
    # Extract specific findings
    specific_results = find_specific_quotes(text_by_page)
    
    # Finding 7 - get full page 743 text
    print("\nFINDING #7: State Lab disclaimer (page ~743)")
    if page_743_text:
        # Clean and show relevant portion
        lines = page_743_text.split('\n')
        # Find disclaimer section
        disclaimer_start = -1
        for i, line in enumerate(lines):
            if "disclaimer" in line.lower() or "hemp" in line.lower():
                disclaimer_start = max(0, i - 5)
                break
        
        if disclaimer_start >= 0:
            excerpt = '\n'.join(lines[disclaimer_start:disclaimer_start+30])
            print(f"• Page 743 — [file]: \"{excerpt}\"")
        else:
            # Show relevant portion
            relevant = page_743_text[page_743_text.lower().find("hemp"):page_743_text.lower().find("hemp")+500] if "hemp" in page_743_text.lower() else page_743_text[:500]
            print(f"• Page 743 — [file]: \"{relevant}\"")
    else:
        print("NO SUPPORTING PAGES FOUND.")
    
    # Show all findings
    findings_functions = {
        1: ("LightLab validation", lambda: specific_results.get(1, [])),
        3: ("100% Delta-9 / zero THCA", lambda: specific_results.get(3, [])),
        4: ("GC-MS conversion", lambda: specific_results.get(4, [])),
        5: ("22 tested / 889 entries", lambda: specific_results.get(5, [])),
        8: ("0.88 conversion", lambda: specific_results.get(8, [])),
    }
    
    for finding_num, (title, get_matches) in findings_functions.items():
        matches = get_matches()
        print(f"\nFINDING #{finding_num}: {title}")
        if matches:
            for page_num, excerpt in matches[:5]:
                clean_excerpt = re.sub(r'\s+', ' ', excerpt.replace('\n', ' ')).strip()
                print(f"• Page {page_num} — [file]: \"{clean_excerpt[:400]}...\"")
        else:
            print("NO SUPPORTING PAGES FOUND.")
    
    # Lab reports
    print("\n" + "="*80)
    print("ADDITIONAL LAB REPORTS FOUND:")
    print("="*80)
    lab_reports = find_lab_reports(text_by_page)
    
    if lab_reports:
        for report in lab_reports:
            clean_excerpt = re.sub(r'\s+', ' ', report["excerpt"].replace('\n', ' ')).strip()
            print(f"\n• Page {report['page']} — [file]: \"{clean_excerpt[:400]}...\"")
            print(f"  Type: {report['type']}")
            if report['title']:
                print(f"  Title: {report['title'][:150]}")
    else:
        print("No additional lab reports found.")

if __name__ == "__main__":
    main()

