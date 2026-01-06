#!/usr/bin/env python3
"""
Comprehensive cannabis evidence audit and talking points extraction
"""

import sys
import re
import csv
from pathlib import Path
from typing import Dict, List, Tuple, Set
from collections import defaultdict

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

# Cannabis-related keywords
CANNABIS_KEYWORDS = [
    "cannabis", "marijuana", "thc", "thca", "thc-a", "delta-9", "delta 9",
    "pre-roll", "preroll", "pre roll", "joint", "edible", "gummy", "gummies",
    "green plant material", "plant material", "jar", "jars", "loose",
    "bulk cannabis", "thc oil", "cartridge", "cart", "vape", "flower",
    "bud", "trim", "hash", "concentrate", "wax", "shatter", "dab"
]

# Store/location names
STORES = [
    "smoke star", "tobacco town", "smoke & glass shop", "smoke and glass shop",
    "best choice grocery", "convenience city", "all in one", "all-in-one",
    "smoke city"
]

def is_cannabis_related(text: str) -> bool:
    """Check if text mentions cannabis-related items."""
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in CANNABIS_KEYWORDS)

def extract_store_location(text: str) -> str:
    """Extract store location from text."""
    text_lower = text.lower()
    for store in STORES:
        if store in text_lower:
            # Return properly formatted store name
            if "smoke star" in text_lower:
                return "Smoke Star"
            elif "tobacco town" in text_lower:
                return "Tobacco Town"
            elif "smoke & glass shop" in text_lower or "smoke and glass shop" in text_lower:
                return "Smoke & Glass Shop"
            elif "best choice grocery" in text_lower:
                return "Best Choice Grocery"
            elif "convenience city" in text_lower:
                return "Convenience City"
            elif "all in one" in text_lower or "all-in-one" in text_lower:
                return "All In One"
            elif "smoke city" in text_lower:
                return "Smoke City"
    return "Unknown"

def extract_weight(text: str) -> str:
    """Extract weight from text."""
    # Look for weight patterns
    weight_patterns = [
        r'(\d+\.?\d*)\s*g(?:rams?|g)',
        r'(\d+\.?\d*)\s*grams?',
        r'weight[:\s]*(\d+\.?\d*)',
        r'(\d+\.?\d*)\s*(?:g|grams)',
    ]
    for pattern in weight_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1) + "g"
    return ""

def extract_item_number(text: str) -> str:
    """Extract item number from text."""
    # Look for item number patterns
    patterns = [
        r'item[:\s#]*(\d+)',
        r'#\s*(\d+)',
        r'item\s*#?\s*(\d+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    return ""

def is_forensic_lab_report(text: str) -> bool:
    """Check if text is a forensic lab report (MDSP or NMS)."""
    text_lower = text.lower()
    # Check for lab report indicators
    has_lab_indicators = any(term in text_lower for term in [
        "maryland state police", "mdsp", "nms labs", "forensic sciences",
        "controlled dangerous substance analysis", "gc/ms", "gc-ms",
        "gas chromatography", "mass spectrometry", "microscopic analysis"
    ])
    
    # Must have actual test results, not just chain of custody
    has_test_results = any(term in text_lower for term in [
        "confirmed", "delta-9-thc", "cannabis confirmed", "tested",
        "result", "analysis", "microscopic", "gc/ms", "gc-ms"
    ])
    
    return has_lab_indicators and has_test_results

def extract_tested_items_from_lab_reports(text_by_page: Dict[int, str]) -> List[Dict]:
    """Extract items that were actually tested in forensic labs."""
    tested_items = []
    
    for page_num, text in text_by_page.items():
        if not is_forensic_lab_report(text):
            continue
        
        text_lower = text.lower()
        
        # Check for actual test methods
        has_gcms = "gc/ms" in text_lower or "gc-ms" in text_lower or "gas chromatography" in text_lower
        has_microscopic = "microscopic" in text_lower
        has_cannabinoid = "cannabinoid" in text_lower or "delta-9" in text_lower
        has_weight_vol = "weight" in text_lower or "volume" in text_lower or "determination" in text_lower
        has_confirmed = "confirmed" in text_lower and "cannabis" in text_lower
        
        if not (has_gcms or has_microscopic or has_cannabinoid or has_confirmed):
            continue
        
        # Extract lab report details
        lines = text.split('\n')
        description = ""
        weight = ""
        item_num = ""
        
        # Try to extract item details
        for i, line in enumerate(lines):
            if is_cannabis_related(line):
                description = line.strip()[:200]
                weight = extract_weight(line)
                item_num = extract_item_number(line)
                break
        
        if not description:
            # Look for cannabis confirmed patterns
            cannabis_match = re.search(r'cannabis.*confirmed', text, re.IGNORECASE)
            if cannabis_match:
                # Get context around the match
                start = max(0, text.lower().find(cannabis_match.group(0).lower()) - 100)
                end = min(len(text), start + 300)
                description = text[start:end].strip()
        
        tested_items.append({
            'page': page_num,
            'item_number': item_num,
            'description': description[:200] if description else "Cannabis (from lab report)",
            'weight': weight,
            'lab': "MDSP" if "maryland state police" in text_lower or "mdsp" in text_lower else "NMS",
            'methods': {
                'gcms': has_gcms,
                'microscopic': has_microscopic,
                'cannabinoid': has_cannabinoid,
                'weight_vol': has_weight_vol,
                'confirmed': has_confirmed
            }
        })
    
    return tested_items

def extract_evidence_items(text_by_page: Dict[int, str]) -> List[Dict]:
    """Extract all cannabis evidence items from inventory pages."""
    evidence_items = []
    
    # Look for evidence inventory pages
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Check if this looks like an evidence inventory page
        is_inventory = any(term in text_lower for term in [
            "evidence inventory", "property record", "evidence record",
            "seized", "property/evidence", "harford county sheriff"
        ])
        
        if not is_inventory:
            continue
        
        # Split into lines and look for cannabis items
        lines = text.split('\n')
        current_item = None
        
        for line in lines:
            line_lower = line.lower()
            
            # Check if this line mentions cannabis
            if is_cannabis_related(line):
                item_num = extract_item_number(line)
                weight = extract_weight(line)
                description = line.strip()
                store = extract_store_location(text)  # Check surrounding context
                
                if description and len(description) > 10:  # Valid description
                    evidence_items.append({
                        'page': page_num,
                        'item_number': item_num,
                        'description': description[:300],
                        'weight': weight,
                        'store': store
                    })
        
        # Also check for cannabis in tables/formatted sections
        # Look for patterns like "Item #X: Description"
        item_pattern = r'(?:item|#)\s*(\d+)[:\s]+([^\n]{20,300})'
        matches = re.finditer(item_pattern, text, re.IGNORECASE)
        for match in matches:
            item_num, desc = match.groups()
            if is_cannabis_related(desc):
                weight = extract_weight(desc)
                store = extract_store_location(text)
                evidence_items.append({
                    'page': page_num,
                    'item_number': item_num,
                    'description': desc.strip()[:300],
                    'weight': weight,
                    'store': store
                })
    
    return evidence_items

# Talking points search terms
TALKING_POINTS = {
    1: {
        'title': 'LightLab is not a validated forensic instrument.',
        'terms': ["lightlab", "algorithm", "proprietary", "not validated", "field test", 
                  "not approved", "cannot determine", "screening only", "not forensic", 
                  "instrument limitations"]
    },
    2: {
        'title': 'LightLab cannot be used to determine criminality or probable cause.',
        'terms': ["probable cause", "lightlab", "field test", "used for evaluation", 
                  "screening", "pc", "controlled buy", "officer relied", 
                  "used to determine legality"]
    },
    3: {
        'title': 'LightLab produced chemically impossible THC profiles.',
        'terms': ["100% thc", "zero thca", "0%", "impossible", "unexpected profile", 
                  "inconsistent", "unusual result"]
    },
    4: {
        'title': 'GC-MS method converts THCA into Delta-9 THC.',
        'terms': ["gc-ms", "gas chromatography", "mass spectrometry", "thca", "converts", 
                  "thermal", "heat", "decarboxylation", "d9 created"]
    },
    5: {
        'title': 'Only 22 items tested out of ~889 evidence entries.',
        'terms': ["total evidence entries", "889", "entries", "items seized", "only tested", 
                  "five sample items", "submitted for analysis", "lab received", "sent to mdsp"]
    },
    6: {
        'title': 'No homogenization before testing.',
        'terms': ["homogenized", "mixed", "representative", "jar", "fragment", 
                  "sample not representative", "jar not mixed", "non-uniform", "bud fragment"]
    },
    7: {
        'title': 'State Lab disclaimer: never performed hemp/marijuana differentiation.',
        'terms': ["differentiation", "hemp", "marijuana", "classification not performed", 
                  "not requested", "does not perform unless requested", "note: this lab does not"]
    },
    8: {
        'title': 'THCA × 0.88 formula inflates THC.',
        'terms': ["0.88", "thca", "conversion", "total thc", "formula", "calculation", 
                  "inflates", "converted", "reporting method"]
    },
    9: {
        'title': 'Aggregate weight charging done in the wrong legal sequence.',
        'terms': ["aggregate", "weight", "combined", "total weight", "marijuana classification", 
                  "charged", "sequence", "without classification first"]
    },
    10: {
        'title': 'Weights from different stores combined without THC classification.',
        'terms': ["combined weight", "multiple locations", "store", "smoke star", "tobacco town", 
                  "best choice", "weights added", "no testing", "no classification"]
    },
    11: {
        'title': 'Sampling did not follow SWGDRUG or ASTM standards.',
        'terms': ["swgdrug", "astm", "sampling", "protocol", "representative sample", 
                  "no sampling plan", "grab sample", "non-statistical"]
    },
    12: {
        'title': 'Final conclusion: evidence cannot classify material as marijuana.',
        'terms': ["cannot determine", "insufficient", "not reliable", "inconclusive", 
                  "not marijuana", "no basis", "no classification", "cannot conclude"]
    }
}

def search_talking_point(text_by_page: Dict[int, str], point_num: int) -> List[Dict]:
    """Search for a specific talking point."""
    point = TALKING_POINTS[point_num]
    results = []
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Check if any search term appears
        matches = []
        for term in point['terms']:
            if term.lower() in text_lower:
                matches.append(term)
        
        if matches:
            # Extract relevant excerpt
            # Find the first match and get context
            first_match = matches[0].lower()
            idx = text_lower.find(first_match)
            if idx != -1:
                start = max(0, idx - 200)
                end = min(len(text), idx + len(first_match) + 300)
                excerpt = text[start:end].strip()
                excerpt = " ".join(excerpt.split())  # Normalize whitespace
                
                results.append({
                    'page': page_num,
                    'quote': excerpt[:400],
                    'matched_terms': matches
                })
    
    return results

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
    
    # TASK 1: Extract cannabis evidence items
    print("Extracting cannabis evidence items...")
    evidence_items = extract_evidence_items(text_by_page)
    print(f"Found {len(evidence_items)} cannabis evidence items")
    
    # TASK 2: Extract tested items from lab reports
    print("Extracting forensic lab test results...")
    tested_items = extract_tested_items_from_lab_reports(text_by_page)
    print(f"Found {len(tested_items)} items tested in forensic labs")
    
    # TASK 3: Generate CSV for evidence audit
    csv_output = []
    csv_output.append(["Type", "Page", "Item_Number", "Description", "Weight", "Store", "Lab_Methods"])
    
    # Add all seized items
    for item in evidence_items:
        csv_output.append([
            "SEIZED",
            item['page'],
            item['item_number'],
            item['description'],
            item['weight'],
            item['store'],
            ""
        ])
    
    # Add tested items
    for item in tested_items:
        methods = []
        if item['methods']['gcms']:
            methods.append("GC/MS")
        if item['methods']['microscopic']:
            methods.append("Microscopic")
        if item['methods']['cannabinoid']:
            methods.append("Cannabinoid")
        if item['methods']['weight_vol']:
            methods.append("Weight/Vol")
        if item['methods']['confirmed']:
            methods.append("Confirmed")
        
        csv_output.append([
            "TESTED",
            item['page'],
            item['item_number'],
            item['description'],
            item['weight'],
            "",
            "; ".join(methods)
        ])
    
    # Calculate statistics
    total_seized = len(evidence_items)
    total_tested = len(tested_items)
    pct_tested = (total_tested / total_seized * 100) if total_seized > 0 else 0
    pct_untested = 100 - pct_tested
    
    # Statistics by store
    store_stats = defaultdict(lambda: {'seized': 0, 'tested': 0})
    for item in evidence_items:
        store = item['store'] if item['store'] != "Unknown" else "Other/Unknown"
        store_stats[store]['seized'] += 1
    
    # Write CSV
    csv_path = Path("C:/Users/simmo/Desktop/cannabis_evidence_audit.csv")
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(csv_output)
        
        # Add statistics section
        writer.writerow([])
        writer.writerow(["STATISTICS"])
        writer.writerow(["Total Cannabis Items Seized", total_seized])
        writer.writerow(["Total Items Tested in Forensic Labs", total_tested])
        writer.writerow(["Percentage Tested", f"{pct_tested:.2f}%"])
        writer.writerow(["Percentage Untested", f"{pct_untested:.2f}%"])
        writer.writerow([])
        writer.writerow(["BY LOCATION"])
        writer.writerow(["Store", "Items Seized", "Items Tested", "Never Tested"])
        for store, stats in sorted(store_stats.items()):
            tested_count = stats.get('tested', 0)
            seized_count = stats['seized']
            never_tested = seized_count - tested_count
            writer.writerow([store, seized_count, tested_count, never_tested])
    
    print(f"\nCSV saved to: {csv_path}")
    
    # TASK 4: Search for talking points
    print("\nSearching for talking points...")
    
    talking_points_output = []
    
    for point_num in sorted(TALKING_POINTS.keys()):
        point = TALKING_POINTS[point_num]
        print(f"  Searching talking point {point_num}...")
        results = search_talking_point(text_by_page, point_num)
        
        talking_points_output.append(f"\nTALKING POINT {point_num}:")
        talking_points_output.append(point['title'])
        talking_points_output.append("")
        
        if results:
            for result in results:
                why_clause = f"(matches: {', '.join(result['matched_terms'][:3])})"
                talking_points_output.append(
                    f"- Page {result['page']} — [file.pdf] \"{result['quote']}\" {why_clause}"
                )
        else:
            talking_points_output.append("NO DIRECT PAGE SUPPORT FOUND.")
        
        talking_points_output.append("")
    
    # Write talking points
    tp_path = Path("C:/Users/simmo/Desktop/talking_points_evidence.txt")
    with open(tp_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(talking_points_output))
    
    print(f"Talking points saved to: {tp_path}")
    print("\nAnalysis complete!")

if __name__ == "__main__":
    main()















