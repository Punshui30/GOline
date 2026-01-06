import sys
import re
from pathlib import Path

try:
    import PyPDF2
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

def extract_text_pypdf2(pdf_path):
    """Extract text using PyPDF2"""
    text_by_page = {}
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page_num, page in enumerate(pdf_reader.pages, start=1):
            try:
                text = page.extract_text()
                text_by_page[page_num] = text
            except:
                text_by_page[page_num] = ""
    return text_by_page

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

def search_findings(text_by_page):
    """Search for evidence supporting each finding"""
    
    findings = {
        1: {
            "keywords": ["LightLab", "unvalidated", "validation", "proprietary", "algorithm", "error rate", "peer review", "peer-reviewed"],
            "title": "LightLab is unvalidated: proprietary algorithms, unknown error rates, no peer-reviewed validation."
        },
        2: {
            "keywords": ["LightLab", "criminal", "criminality", "probable cause", "determine", "legally"],
            "title": "LightLab cannot legally be used to determine criminality or support probable cause."
        },
        3: {
            "keywords": ["chemically impossible", "100% Delta-9", "zero THCA", "Delta-9", "THCA", "100%"],
            "title": "LightLab produced chemically impossible results (100% Delta-9 with zero THCA, etc.)."
        },
        4: {
            "keywords": ["GC-MS", "THCA", "Delta-9", "convert", "conversion", "during testing"],
            "title": "State GC-MS method converts THCA into Delta-9 during testing."
        },
        5: {
            "keywords": ["22", "889", "tested", "evidence", "coverage", "entries"],
            "title": "Approximately 22 tested items out of ~889 evidence entries (extremely low coverage)."
        },
        6: {
            "keywords": ["homogen", "homogenization", "fragment", "represent", "whole", "jar", "package"],
            "title": "No homogenization of jars/packages; fragments cannot represent the whole."
        },
        7: {
            "keywords": ["disclaimer", "hemp", "marijuana", "differentiation", "NOT performed", "743"],
            "title": "State Lab disclaimer (page ~743): hemp/marijuana differentiation NOT performed."
        },
        8: {
            "keywords": ["THCA", "0.88", "0.877", "conversion", "inflate", "THC", "multiply"],
            "title": "THCA × 0.88 conversion automatically inflates THC levels."
        },
        9: {
            "keywords": ["felony", "aggregate", "weight", "charging", "marijuana", "classification"],
            "title": "Felony aggregate weight charging done before establishing marijuana classification."
        },
        10: {
            "keywords": ["weight", "store", "combined", "THC", "classification", "each item"],
            "title": "Weights from different stores combined without THC classification for each item."
        },
        11: {
            "keywords": ["SWGDRUG", "ASTM", "sampling", "protocol", "statistically valid", "statistical"],
            "title": "Sampling did not follow SWGDRUG, ASTM, or any statistically valid protocol."
        },
        12: {
            "keywords": ["expert", "conclusion", "scientifically", "legally", "unreliable", "marijuana", "classification"],
            "title": "Final expert conclusion: results scientifically and legally unreliable for marijuana classification."
        }
    }
    
    results = {}
    
    for finding_num, finding in findings.items():
        matches = []
        for page_num, text in text_by_page.items():
            if not text:
                continue
            
            text_lower = text.lower()
            # Check for multiple keyword matches
            keyword_matches = sum(1 for kw in finding["keywords"] if kw.lower() in text_lower)
            
            if keyword_matches >= 2 or any(kw.lower() in text_lower for kw in finding["keywords"] if kw.lower() in ["unvalidated", "disclaimer", "not performed", "chemically impossible"]):
                # Extract context around matches
                lines = text.split('\n')
                relevant_lines = []
                for i, line in enumerate(lines):
                    line_lower = line.lower()
                    if any(kw.lower() in line_lower for kw in finding["keywords"]):
                        # Get context (2 lines before and after)
                        start = max(0, i - 2)
                        end = min(len(lines), i + 3)
                        context = '\n'.join(lines[start:end])
                        if context.strip():
                            relevant_lines.append(context.strip())
                
                if relevant_lines:
                    # Get a representative excerpt
                    excerpt = relevant_lines[0][:500] if relevant_lines else text[:500]
                    matches.append({
                        "page": page_num,
                        "excerpt": excerpt
                    })
        
        results[finding_num] = {
            "title": finding["title"],
            "matches": matches[:10]  # Limit to top 10 matches per finding
        }
    
    return results

def search_lab_reports(text_by_page):
    """Search for lab reports, COAs, supplemental analyses"""
    lab_report_keywords = [
        "lab report", "laboratory report", "certificate of analysis", "COA", 
        "supplemental", "revised", "forensic", "analysis report", "test results",
        "laboratory findings", "analytical report", "forensic report"
    ]
    
    lab_report_pages = []
    
    for page_num, text in text_by_page.items():
        if not text:
            continue
        
        text_lower = text.lower()
        matches = [kw for kw in lab_report_keywords if kw in text_lower]
        
        if matches:
            # Check if this looks like a report header/title
            lines = text.split('\n')[:20]  # First 20 lines
            header_text = '\n'.join(lines).lower()
            
            # Extract potential report title/identifier
            title = ""
            for line in lines[:10]:
                if any(keyword in line.lower() for keyword in ["report", "certificate", "analysis", "laboratory"]):
                    title = line.strip()
                    break
            
            lab_report_pages.append({
                "page": page_num,
                "keywords_found": matches,
                "title": title[:200] if title else "",
                "excerpt": text[:500]
            })
    
    return lab_report_pages

def main():
    pdf_path = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
    
    print(f"Extracting text from PDF...")
    print(f"File size: {Path(pdf_path).stat().st_size / (1024*1024):.1f} MB")
    
    # Try pdfplumber first (better text extraction), then PyPDF2
    if HAS_PDFPLUMBER:
        print("Using pdfplumber...")
        text_by_page = extract_text_pdfplumber(pdf_path)
    elif HAS_PYPDF2:
        print("Using PyPDF2...")
        text_by_page = extract_text_pypdf2(pdf_path)
    else:
        print("ERROR: Neither PyPDF2 nor pdfplumber is installed.")
        print("Installing pdfplumber...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber"])
        import pdfplumber
        text_by_page = extract_text_pdfplumber(pdf_path)
    
    print(f"Extracted text from {len(text_by_page)} pages")
    
    print("\nSearching for findings...")
    findings_results = search_findings(text_by_page)
    
    print("\nSearching for lab reports...")
    lab_reports = search_lab_reports(text_by_page)
    
    # Output results
    print("\n" + "="*80)
    print("RESULTS")
    print("="*80)
    
    for finding_num in sorted(findings_results.keys()):
        result = findings_results[finding_num]
        print(f"\nFINDING #{finding_num}:")
        print(f"{result['title']}")
        if result['matches']:
            for match in result['matches']:
                print(f"• Page {match['page']} — [file]: \"{match['excerpt'][:300]}...\"")
        else:
            print("NO SUPPORTING PAGES FOUND.")
    
    print("\n" + "="*80)
    print("ADDITIONAL LAB REPORTS FOUND:")
    print("="*80)
    
    if lab_reports:
        for report in lab_reports[:20]:  # Limit to 20 reports
            print(f"\n• Page {report['page']} — [file]: \"{report['excerpt'][:300]}...\"")
            print(f"  Keywords: {', '.join(report['keywords_found'])}")
    else:
        print("No additional lab reports found.")

if __name__ == "__main__":
    main()

