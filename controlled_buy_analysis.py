#!/usr/bin/env python3
"""
Comprehensive controlled buy analysis - tracking purchases to evidence to LightLab results
"""

import sys
import re
import csv
from pathlib import Path
from typing import Dict, List, Tuple, Set, Optional
from collections import defaultdict
from dataclasses import dataclass, field

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

PDF_PATH = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
PDF_FILENAME = "Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"

@dataclass
class Purchase:
    page: int
    date: str = ""
    location: str = ""
    brand: str = ""
    strain: str = ""
    product_type: str = ""
    weight: str = ""
    quantity: str = ""
    sku: str = ""
    description: str = ""
    evidence_number: str = ""
    officer: str = ""
    buy_amount: str = ""
    raw_text: str = ""

@dataclass
class LightLabResult:
    page: int
    sample_id: str = ""
    total_thc: str = ""
    delta9_thc: str = ""
    thca: str = ""
    total_cbd: str = ""
    thc_cbd_ratio: str = ""
    high_thc_label: bool = False
    classification: str = ""
    test_date: str = ""
    operator: str = ""
    raw_text: str = ""

@dataclass
class EvidenceSubmission:
    page: int
    evidence_number: str = ""
    item_number: str = ""
    description: str = ""
    submitted_to_lab: bool = False
    lab_name: str = ""
    chain_of_custody: str = ""
    raw_text: str = ""

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

def find_controlled_buys(text_by_page: Dict[int, str]) -> List[Purchase]:
    """Find all controlled buy references."""
    purchases = []
    
    purchase_keywords = [
        "controlled buy", "ci buy", "confidential informant", "confidential source",
        "undercover purchase", "uc buy", "purchase", "bought", "transaction",
        "product purchased", "item purchased", "item obtained", "buy money",
        "pre-recorded currency", "recorded currency"
    ]
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Check if this page mentions a purchase
        has_purchase = any(keyword in text_lower for keyword in purchase_keywords)
        
        if not has_purchase:
            continue
        
        # Extract purchase details
        purchase = Purchase(page=page_num, raw_text=text)
        
        # Extract date
        date_patterns = [
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(March|April|May|June|July|August)\s+\d{1,2}[a-z]{0,2},?\s+\d{4}',
            r'(\d{1,2}\s+(?:March|April|May|June|July|August),?\s+\d{4})'
        ]
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                purchase.date = match.group(0)
                break
        
        # Extract location/store
        stores = ["all in one", "smoke star", "tobacco town", "best choice", 
                  "convenience city", "smoke city", "smoke & glass shop"]
        for store in stores:
            if store in text_lower:
                purchase.location = store.title()
                break
        
        # Extract product descriptions
        product_patterns = [
            r'(\d+\.?\d*)\s*grams?\s+(?:of\s+)?cannabis',
            r'(\d+)\s*pre-?roll',
            r'(\d+)\s*pre-?rolled',
            r'(\d+)\s*(?:grams?|g)\s+flower',
            r'(\d+)\s*gummies?',
            r'(\d+)\s*cart',
            r'(\d+)\s*cartridge'
        ]
        for pattern in product_patterns:
            match = re.search(pattern, text_lower)
            if match:
                purchase.quantity = match.group(1)
                if "gram" in match.group(0) or "flower" in match.group(0):
                    purchase.weight = match.group(1) + "g"
                    purchase.product_type = "Flower"
                elif "roll" in match.group(0):
                    purchase.product_type = "Pre-roll"
                    purchase.quantity = match.group(1)
                elif "gumm" in match.group(0):
                    purchase.product_type = "Gummies"
                elif "cart" in match.group(0):
                    purchase.product_type = "Cartridge"
                break
        
        # Extract brand/strain names
        brand_patterns = [
            r'"(.*?)"',  # Quoted names
            r'labeled\s+"([^"]+)"',
            r'labeled\s+([A-Z][^\s]+(?:\s+[A-Z][^\s]+)*)',
            r'([A-Z][a-z]+\s+(?:THC|THCA|CBD|Flower|Gummies))',
        ]
        for pattern in brand_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                label = match.group(1)
                if len(label) > 3 and len(label) < 50:
                    # Check if it looks like a brand/strain
                    if any(word in label.lower() for word in ["thc", "thca", "cbd", "flower", "strain", "curevana"]):
                        if not purchase.brand:
                            purchase.brand = label
                        elif not purchase.strain:
                            purchase.strain = label
                        break
        
        # Extract buy amount
        amount_match = re.search(r'\$(\d+(?:\.\d{2})?)', text)
        if amount_match:
            purchase.buy_amount = "$" + amount_match.group(1)
        
        # Extract officer name
        officer_patterns = [
            r'Detective\s+([A-Z][a-z]+)',
            r'Det\.\s+([A-Z][a-z]+)',
            r'Officer\s+([A-Z][a-z]+)'
        ]
        for pattern in officer_patterns:
            match = re.search(pattern, text)
            if match:
                purchase.officer = match.group(0)
                break
        
        # Get full description
        lines = text.split('\n')
        for line in lines:
            if any(keyword in line.lower() for keyword in ["cannabis", "marijuana", "purchased", "bought"]):
                purchase.description = line.strip()[:200]
                break
        
        purchases.append(purchase)
    
    return purchases

def find_lightlab_results(text_by_page: Dict[int, str]) -> List[LightLabResult]:
    """Find all LightLab test results."""
    results = []
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Check for LightLab indicators
        if not ("lightlab" in text_lower or "light lab" in text_lower):
            continue
        
        # Check if it has actual test results (not just mentions)
        has_results = any(term in text_lower for term in [
            "total thc", "delta-9", "thca", "thc:", "cbd", "ratio", "high thc"
        ])
        
        if not has_results:
            continue
        
        result = LightLabResult(page=page_num, raw_text=text)
        
        # Extract sample ID
        sample_match = re.search(r'(?:sample|test)[\s#:]*([A-Z0-9\-]+)', text, re.IGNORECASE)
        if sample_match:
            result.sample_id = sample_match.group(1)
        
        # Extract Total THC
        thc_patterns = [
            r'total\s+thc[:\s]*(\d+\.?\d*)%?',
            r'thc[:\s]*(\d+\.?\d*)%',
            r'(\d+\.?\d*)%?\s*total\s+thc'
        ]
        for pattern in thc_patterns:
            match = re.search(pattern, text_lower)
            if match:
                result.total_thc = match.group(1) + "%"
                break
        
        # Extract Delta-9 THC
        delta9_patterns = [
            r'delta[- ]?9[- ]?thc[:\s]*(\d+\.?\d*)%?',
            r'delta[- ]?9[:\s]*(\d+\.?\d*)%?'
        ]
        for pattern in delta9_patterns:
            match = re.search(pattern, text_lower)
            if match:
                result.delta9_thc = match.group(1) + "%"
                break
        
        # Extract THCA
        thca_patterns = [
            r'thca[:\s]*(\d+\.?\d*)%?',
            r'thc-a[:\s]*(\d+\.?\d*)%?'
        ]
        for pattern in thca_patterns:
            match = re.search(pattern, text_lower)
            if match:
                result.thca = match.group(1) + "%"
                break
        
        # Extract Total CBD
        cbd_match = re.search(r'(?:total\s+)?cbd[:\s]*(\d+\.?\d*)%?', text_lower)
        if cbd_match:
            result.total_cbd = cbd_match.group(1) + "%"
        
        # Extract THC:CBD ratio
        ratio_match = re.search(r'thc[:\s]*cbd\s+ratio[:\s]*(\d+[:\d]*)', text_lower)
        if ratio_match:
            result.thc_cbd_ratio = ratio_match.group(1)
        
        # Check for "High THC Sample" label
        if "high thc" in text_lower:
            result.high_thc_label = True
        
        # Extract test date
        date_match = re.search(r'test\s+date[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text_lower)
        if date_match:
            result.test_date = date_match.group(1)
        
        results.append(result)
    
    return results

def find_evidence_submissions(text_by_page: Dict[int, str]) -> List[EvidenceSubmission]:
    """Find evidence submission records."""
    submissions = []
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Check for evidence submission indicators
        is_evidence = any(term in text_lower for term in [
            "evidence number", "item number", "submitted", "chain of custody",
            "property record", "evidence record", "msp form", "submitted to lab"
        ])
        
        if not is_evidence:
            continue
        
        submission = EvidenceSubmission(page=page_num, raw_text=text)
        
        # Extract evidence number
        ev_num_patterns = [
            r'evidence\s*(?:number|#)[:\s]*([A-Z0-9\-]+)',
            r'ev[:\s#]*([A-Z0-9\-]+)',
            r'item\s*(?:number|#)[:\s]*(\d+)'
        ]
        for pattern in ev_num_patterns:
            match = re.search(pattern, text_lower)
            if match:
                submission.evidence_number = match.group(1)
                break
        
        # Check if submitted to lab
        if any(term in text_lower for term in ["submitted to lab", "sent to lab", "lab received", "msp lab", "nms lab"]):
            submission.submitted_to_lab = True
            if "mdsp" in text_lower or "maryland state police" in text_lower:
                submission.lab_name = "MDSP"
            elif "nms" in text_lower:
                submission.lab_name = "NMS"
        
        # Extract description
        lines = text.split('\n')
        for line in lines:
            if any(word in line.lower() for word in ["cannabis", "marijuana", "thc", "pre-roll", "flower"]):
                submission.description = line.strip()[:200]
                break
        
        submissions.append(submission)
    
    return submissions

def find_probable_cause_statements(text_by_page: Dict[int, str]) -> Dict[int, str]:
    """Find probable cause statements that reference test results."""
    pc_statements = {}
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Check for probable cause language
        if "probable cause" not in text_lower:
            continue
        
        # Check if it mentions test results
        if not any(term in text_lower for term in ["test", "lightlab", "thc", "result", "analyzed"]):
            continue
        
        # Extract context around probable cause
        pc_idx = text_lower.find("probable cause")
        if pc_idx != -1:
            start = max(0, pc_idx - 200)
            end = min(len(text), pc_idx + 600)
            context = text[start:end].strip()
            pc_statements[page_num] = context
    
    return pc_statements

def analyze_matches(purchases: List[Purchase], lightlab_results: List[LightLabResult], 
                    evidence_submissions: List[EvidenceSubmission], 
                    pc_statements: Dict[int, str]) -> List[Dict]:
    """Match purchases to evidence to LightLab results."""
    matched_data = []
    
    for purchase in purchases:
        match_record = {
            'purchase_page': purchase.page,
            'purchase_date': purchase.date,
            'location': purchase.location,
            'brand_strain_form': f"{purchase.brand} / {purchase.strain} / {purchase.product_type}",
            'weight_quantity': f"{purchase.weight} / {purchase.quantity}",
            'description': purchase.description[:150],
            'evidence_number': purchase.evidence_number,
            'evidence_page': "",
            'lightlab_page': "",
            'lightlab_values': "",
            'pc_statements': "",
            'contradictions': "",
            'missing_data': []
        }
        
        # Try to find matching evidence submission
        for ev in evidence_submissions:
            # Check if descriptions match or pages are close
            if abs(ev.page - purchase.page) <= 5:
                if any(word in ev.description.lower() for word in purchase.description.lower().split()[:3]):
                    match_record['evidence_number'] = ev.evidence_number or ev.item_number
                    match_record['evidence_page'] = str(ev.page)
                    break
        
        # Try to find matching LightLab result
        for result in lightlab_results:
            # Check if pages are close or descriptions match
            if abs(result.page - purchase.page) <= 20:
                values = []
                if result.total_thc:
                    values.append(f"Total THC: {result.total_thc}")
                if result.delta9_thc:
                    values.append(f"Delta-9: {result.delta9_thc}")
                if result.thca:
                    values.append(f"THCA: {result.thca}")
                if result.total_cbd:
                    values.append(f"Total CBD: {result.total_cbd}")
                if result.thc_cbd_ratio:
                    values.append(f"Ratio: {result.thc_cbd_ratio}")
                
                match_record['lightlab_page'] = str(result.page)
                match_record['lightlab_values'] = "; ".join(values)
                
                # Check for contradictions
                contradictions = []
                if result.total_thc and float(result.total_thc.replace("%", "")) == 100:
                    if result.thca == "0%" or not result.thca:
                        contradictions.append("100% THC with zero THCA is chemically impossible")
                
                if contradictions:
                    match_record['contradictions'] = "; ".join(contradictions)
                break
        
        # Check for probable cause statements on nearby pages
        pc_texts = []
        for pc_page, pc_text in pc_statements.items():
            if abs(pc_page - purchase.page) <= 10:
                # Extract relevant sentence
                sentences = re.split(r'[.!?]+', pc_text)
                for sent in sentences:
                    if any(term in sent.lower() for term in ["test", "thc", "lightlab", "marijuana", "illegal"]):
                        pc_texts.append(sent.strip()[:200])
        
        if pc_texts:
            match_record['pc_statements'] = " | ".join(pc_texts[:2])
        
        # Check for missing data
        missing = []
        if not match_record['evidence_number']:
            missing.append("Evidence number not found")
        if not match_record['lightlab_page']:
            missing.append("LightLab result not found")
        if not match_record['pc_statements']:
            missing.append("Probable cause statement not found")
        
        match_record['missing_data'] = "; ".join(missing) if missing else "Complete"
        
        matched_data.append(match_record)
    
    return matched_data

def main():
    global HAS_PDFPLUMBER
    
    pdf_path = PDF_PATH
    
    if not Path(pdf_path).exists():
        print(f"ERROR: PDF file not found: {pdf_path}")
        return
    
    print("Extracting text from PDF...")
    
    if not HAS_PDFPLUMBER:
        print("Installing pdfplumber...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
        import pdfplumber
        HAS_PDFPLUMBER = True
    
    text_by_page = extract_text_pdfplumber(pdf_path)
    print(f"Extracted text from {len(text_by_page)} pages\n")
    
    print("Searching for controlled buys...")
    purchases = find_controlled_buys(text_by_page)
    print(f"Found {len(purchases)} purchase references\n")
    
    print("Searching for LightLab results...")
    lightlab_results = find_lightlab_results(text_by_page)
    print(f"Found {len(lightlab_results)} LightLab result pages\n")
    
    print("Searching for evidence submissions...")
    evidence_submissions = find_evidence_submissions(text_by_page)
    print(f"Found {len(evidence_submissions)} evidence submission pages\n")
    
    print("Searching for probable cause statements...")
    pc_statements = find_probable_cause_statements(text_by_page)
    print(f"Found {len(pc_statements)} probable cause statement pages\n")
    
    print("Matching purchases to evidence to LightLab results...")
    matched_data = analyze_matches(purchases, lightlab_results, evidence_submissions, pc_statements)
    
    # Write CSV table
    csv_path = Path("C:/Users/simmo/Desktop/controlled_buy_analysis_table.csv")
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        if matched_data:
            fieldnames = list(matched_data[0].keys())
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(matched_data)
    
    print(f"\nCSV table saved to: {csv_path}")
    
    # Write narrative summary
    narrative_path = Path("C:/Users/simmo/Desktop/controlled_buy_narrative_summary.txt")
    with open(narrative_path, 'w', encoding='utf-8') as f:
        f.write("CONTROLLED BUY ANALYSIS - NARRATIVE SUMMARY\n")
        f.write("=" * 80 + "\n\n")
        
        for i, record in enumerate(matched_data, 1):
            f.write(f"PURCHASE #{i}\n")
            f.write("-" * 80 + "\n")
            f.write(f"Page: {record['purchase_page']}\n")
            f.write(f"Date: {record['purchase_date']}\n")
            f.write(f"Location: {record['location']}\n")
            f.write(f"Product: {record['brand_strain_form']}\n")
            f.write(f"Weight/Quantity: {record['weight_quantity']}\n")
            f.write(f"Description: {record['description']}\n\n")
            
            f.write("EVIDENCE CHAIN:\n")
            if record['evidence_number']:
                f.write(f"  Evidence Number: {record['evidence_number']} (Page {record['evidence_page']})\n")
            else:
                f.write("  Evidence Number: NOT FOUND\n")
            
            if record['lightlab_page']:
                f.write(f"  LightLab Tested: YES (Page {record['lightlab_page']})\n")
                f.write(f"  LightLab Values: {record['lightlab_values']}\n")
            else:
                f.write("  LightLab Tested: NO RESULT FOUND\n")
            
            f.write(f"\nDATA COMPLETENESS: {record['missing_data']}\n")
            
            if record['contradictions']:
                f.write(f"\nCONTRADICTIONS/ISSUES:\n  {record['contradictions']}\n")
            
            if record['pc_statements']:
                f.write(f"\nPROBABLE CAUSE STATEMENTS:\n  {record['pc_statements']}\n")
            
            f.write("\n" + "=" * 80 + "\n\n")
        
        # Overall summary
        f.write("OVERALL SUMMARY\n")
        f.write("=" * 80 + "\n")
        f.write(f"Total Purchases Documented: {len(matched_data)}\n")
        complete = sum(1 for r in matched_data if r['missing_data'] == "Complete")
        f.write(f"Complete Chains (Purchase→Evidence→LightLab→PC): {complete}\n")
        f.write(f"Incomplete Chains: {len(matched_data) - complete}\n")
    
    print(f"Narrative summary saved to: {narrative_path}")
    print("\nAnalysis complete!")

if __name__ == "__main__":
    main()















