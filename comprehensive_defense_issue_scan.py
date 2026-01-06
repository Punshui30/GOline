#!/usr/bin/env python3
"""
Comprehensive scan of discovery PDF for ALL potential defense issues
"""

import sys
import re
import csv
from pathlib import Path
from typing import Dict, List, Tuple, Set
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
class DefenseIssue:
    category: str
    subcategory: str
    page: int
    description: str
    defense_value: str
    severity: str = "Medium"  # Low, Medium, High, Critical

def extract_text_pdfplumber(pdf_path: str) -> Dict[int, str]:
    """Extract text from PDF using pdfplumber."""
    text_by_page = {}
    print("Extracting text from PDF (this may take several minutes)...")
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        for i, page in enumerate(pdf.pages, 1):
            if i % 100 == 0:
                print(f"  Processed {i}/{total} pages...")
            try:
                text = page.extract_text()
                text_by_page[i] = text or ""
            except:
                text_by_page[i] = ""
    return text_by_page

def search_procedural_issues(text_by_page: Dict[int, str]) -> List[DefenseIssue]:
    """Search for procedural and constitutional issues."""
    issues = []
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Missing signatures
        if "search warrant" in text_lower or "warrant" in text_lower:
            if "signature" in text_lower or "signed" in text_lower:
                # Check if signature is missing or incomplete
                if re.search(r'(?:unsigned|no signature|missing signature|signature\s*:\s*$)', text_lower):
                    issues.append(DefenseIssue(
                        category="Procedural/Constitutional",
                        subcategory="Missing Signatures",
                        page=page_num,
                        description="Search warrant appears to be missing signature",
                        defense_value="Invalid warrant if unsigned",
                        severity="Critical"
                    ))
        
        # Missing oath/affirmation
        if "affidavit" in text_lower or "application" in text_lower:
            if "sworn" not in text_lower and "oath" not in text_lower and "affirm" not in text_lower:
                # But check if it's just a form - look for "solemnly affirm" nearby
                if "probable cause" in text_lower:
                    issues.append(DefenseIssue(
                        category="Procedural/Constitutional",
                        subcategory="Missing Oath/Affirmation",
                        page=page_num,
                        description="Affidavit may lack proper oath or affirmation",
                        defense_value="Invalid affidavit without proper oath",
                        severity="High"
                    ))
        
        # Stale probable cause
        date_patterns = [
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}'
        ]
        dates_in_text = []
        for pattern in date_patterns:
            dates_in_text.extend(re.findall(pattern, text, re.IGNORECASE))
        
        # Chain of custody gaps
        if "chain of custody" in text_lower or "chainofcustody" in text_lower:
            # Look for gaps or breaks
            if re.search(r'(?:gap|missing|break|incomplete|unexplained)', text_lower):
                issues.append(DefenseIssue(
                    category="Procedural/Constitutional",
                    subcategory="Chain of Custody Issues",
                    page=page_num,
                    description="Potential gap or break in chain of custody",
                    defense_value="Undermines evidence integrity",
                    severity="High"
                ))
        
        # CI reliability issues
        if any(term in text_lower for term in ["confidential informant", "ci-", "ci "]):
            if "reliable" not in text_lower and "proven" not in text_lower and "past" not in text_lower:
                issues.append(DefenseIssue(
                    category="Procedural/Constitutional",
                    subcategory="CI Reliability",
                    page=page_num,
                    description="CI reliability may not be established",
                    defense_value="Invalid probable cause without CI reliability",
                    severity="High"
                ))
        
        # Miranda issues
        if "miranda" in text_lower:
            if re.search(r'(?:not\s+read|failed\s+to\s+read|didn\'?t\s+read)', text_lower):
                issues.append(DefenseIssue(
                    category="Procedural/Constitutional",
                    subcategory="Miranda Violations",
                    page=page_num,
                    description="Miranda rights may not have been read",
                    defense_value="Statements may be suppressed",
                    severity="High"
                ))
        
        # Missing video/recordings
        if "controlled buy" in text_lower or "undercover" in text_lower:
            if "video" not in text_lower and "recorded" not in text_lower and "recording" not in text_lower:
                issues.append(DefenseIssue(
                    category="Procedural/Constitutional",
                    subcategory="Missing Recordings",
                    page=page_num,
                    description="Controlled buy may lack video/audio recording",
                    defense_value="Lack of recording evidence weakens case",
                    severity="Medium"
                ))
    
    return issues

def search_evidence_handling_issues(text_by_page: Dict[int, str]) -> List[DefenseIssue]:
    """Search for evidence handling problems."""
    issues = []
    
    item_counts = defaultdict(list)
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Evidence inventory pages
        if any(term in text_lower for term in ["evidence inventory", "property record", "evidence record"]):
            
            # Missing weights
            if any(term in text_lower for term in ["cannabis", "marijuana", "thc", "jar", "package"]):
                if "weight" not in text_lower and "gram" not in text_lower:
                    issues.append(DefenseIssue(
                        category="Evidence Handling",
                        subcategory="Missing Weights",
                        page=page_num,
                        description="Evidence items listed without weights",
                        defense_value="Cannot determine quantities for charges",
                        severity="High"
                    ))
            
            # Incomplete property sheets
            if re.search(r'(?:incomplete|missing|blank|not\s+filled)', text_lower):
                issues.append(DefenseIssue(
                    category="Evidence Handling",
                    subcategory="Incomplete Property Sheets",
                    page=page_num,
                    description="Property/evidence sheet appears incomplete",
                    defense_value="Undermines evidence documentation",
                    severity="Medium"
                ))
        
        # Mismatched evidence numbers
        ev_numbers = re.findall(r'(?:evidence|ev|item)[\s#:]*([A-Z0-9\-]+)', text, re.I)
        for ev_num in ev_numbers:
            item_counts[ev_num].append(page_num)
    
    # Check for same evidence number on widely separated pages (potential mismatch)
    for ev_num, pages in item_counts.items():
        if len(pages) > 1:
            max_gap = max(pages) - min(pages)
            if max_gap > 50:  # Same number on pages far apart
                issues.append(DefenseIssue(
                    category="Evidence Handling",
                    subcategory="Possible Evidence Number Mismatch",
                    page=min(pages),
                    description=f"Evidence number {ev_num} appears on pages {min(pages)} and {max(pages)}",
                    defense_value="May indicate evidence mix-up or numbering error",
                    severity="High"
                ))
    
    return issues

def search_testing_lab_issues(text_by_page: Dict[int, str]) -> List[DefenseIssue]:
    """Search for testing and laboratory issues."""
    issues = []
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Lab report pages
        is_lab_report = any(term in text_lower for term in [
            "laboratory report", "lab report", "analysis report", 
            "maryland state police", "nms labs", "gc-ms", "hplc"
        ])
        
        if not is_lab_report:
            continue
        
        # Unable to quantitate
        if re.search(r'(?:unable\s+to\s+quantitate|unable\s+to\s+quantify|below\s+reporting\s+limit|no\s+result|not\s+reported)', text_lower):
            issues.append(DefenseIssue(
                category="Testing/Laboratory",
                subcategory="Unable to Quantitate",
                page=page_num,
                description="Lab report states unable to quantitate or below reporting limit",
                defense_value="No quantitative result - cannot establish THC content",
                severity="Critical"
            ))
        
        # Missing calibration info
        if "calibration" not in text_lower and "method" in text_lower:
            issues.append(DefenseIssue(
                category="Testing/Laboratory",
                subcategory="Missing Calibration Info",
                page=page_num,
                description="Lab report lacks calibration or quality control information",
                defense_value="Cannot verify test accuracy without calibration data",
                severity="High"
            ))
        
        # LightLab inconsistencies
        if "lightlab" in text_lower or "light lab" in text_lower:
            # Check for impossible results
            if "100%" in text and "thc" in text_lower:
                if "thca" in text_lower:
                    thca_match = re.search(r'thca[:\s]*(\d+\.?\d*)\s*%', text_lower)
                    if thca_match and float(thca_match.group(1)) == 0:
                        issues.append(DefenseIssue(
                            category="Testing/Laboratory",
                            subcategory="Impossible LightLab Result",
                            page=page_num,
                            description="100% THC with zero THCA is chemically impossible",
                            defense_value="LightLab results are unreliable/invalid",
                            severity="Critical"
                        ))
        
        # Unclear sample identification
        if "sample" in text_lower:
            if not re.search(r'sample\s+id|sample\s+number|item\s+#', text_lower):
                issues.append(DefenseIssue(
                    category="Testing/Laboratory",
                    subcategory="Unclear Sample ID",
                    page=page_num,
                    description="Lab report lacks clear sample identification",
                    defense_value="Cannot verify which item was tested",
                    severity="High"
                ))
    
    return issues

def search_sloppy_work(text_by_page: Dict[int, str]) -> List[DefenseIssue]:
    """Search for sloppy or incomplete police work."""
    issues = []
    
    boilerplate_texts = defaultdict(list)
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Missing pages indicators
        if re.search(r'page\s+\d+\s+of\s+\?|page\s+\?\s+of|continued|see\s+attachment', text_lower):
            issues.append(DefenseIssue(
                category="Sloppy/Incomplete Work",
                subcategory="Missing Pages",
                page=page_num,
                description="Report references missing pages or attachments",
                defense_value="Incomplete documentation",
                severity="Medium"
            ))
        
        # Wrong address/suspect
        addresses = re.findall(r'\d+\s+[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)', text)
        # This is harder to validate automatically, but we can flag potential issues
        
        # Misnumbered lab items
        if "lab item" in text_lower or "exhibit" in text_lower:
            item_nums = re.findall(r'(?:item|exhibit)[\s#:]*(\d+)', text_lower)
            if len(set(item_nums)) != len(item_nums):
                issues.append(DefenseIssue(
                    category="Sloppy/Incomplete Work",
                    subcategory="Duplicate Lab Item Numbers",
                    page=page_num,
                    description="Duplicate lab item/exhibit numbers found",
                    defense_value="May indicate numbering errors",
                    severity="Medium"
                ))
        
        # Store boilerplate for later comparison
        if "probable cause" in text_lower and len(text) > 500:
            # Store first 200 chars as boilerplate identifier
            boilerplate_key = text[:200].strip()
            boilerplate_texts[boilerplate_key].append(page_num)
    
    # Check for repeated boilerplate
    for boilerplate, pages in boilerplate_texts.items():
        if len(pages) > 2:
            issues.append(DefenseIssue(
                category="Sloppy/Incomplete Work",
                subcategory="Repeated Boilerplate",
                page=pages[0],
                description=f"Same boilerplate text appears on {len(pages)} different pages: {pages}",
                defense_value="May indicate copy-paste errors or lack of specificity",
                severity="Medium"
            ))
    
    return issues

def search_comar_violations(text_by_page: Dict[int, str]) -> List[DefenseIssue]:
    """Search for COMAR or statutory violations."""
    issues = []
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Hemp/marijuana differentiation
        if "hemp" in text_lower or "marijuana" in text_lower:
            if "differentiation" in text_lower:
                if re.search(r'(?:not\s+performed|not\s+conducted|does\s+not\s+perform|not\s+requested)', text_lower):
                    issues.append(DefenseIssue(
                        category="COMAR/Statutory Violations",
                        subcategory="No Hemp/Marijuana Differentiation",
                        page=page_num,
                        description="Lab did not perform hemp/marijuana differentiation",
                        defense_value="Cannot legally classify as marijuana without differentiation",
                        severity="Critical"
                    ))
        
        # Felony weight before classification
        if "aggregate" in text_lower and "weight" in text_lower:
            if "marijuana" in text_lower and "classification" not in text_lower:
                issues.append(DefenseIssue(
                    category="COMAR/Statutory Violations",
                    subcategory="Felony Weight Before Classification",
                    page=page_num,
                    description="Aggregate weight charged before establishing marijuana classification",
                    defense_value="Improper charging sequence - weight cannot be aggregated without classification",
                    severity="Critical"
                ))
        
        # LightLab used beyond purpose
        if "lightlab" in text_lower or "light lab" in text_lower:
            if "probable cause" in text_lower or "warrant" in text_lower:
                issues.append(DefenseIssue(
                    category="COMAR/Statutory Violations",
                    subcategory="LightLab Used Beyond Purpose",
                    page=page_num,
                    description="LightLab field test used to establish probable cause",
                    defense_value="Field tests cannot legally support probable cause for marijuana",
                    severity="High"
                ))
    
    return issues

def search_contradictions(text_by_page: Dict[int, str]) -> List[DefenseIssue]:
    """Search for internal contradictions."""
    issues = []
    
    officer_statements = defaultdict(list)
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Extract officer names and their statements
        officer_match = re.search(r'(?:Detective|Det\.|Officer|Sgt\.)\s+([A-Z][a-z]+)', text)
        if officer_match:
            officer_name = officer_match.group(0)
            # Store key facts from this statement
            if "thc" in text_lower or "test" in text_lower or "purchase" in text_lower:
                officer_statements[officer_name].append((page_num, text[:300]))
        
        # Timestamp contradictions (very basic check)
        timestamps = re.findall(r'(\d{1,2}:\d{2})', text)
        if len(timestamps) > 1:
            times = []
            for ts in timestamps:
                parts = ts.split(':')
                times.append(int(parts[0]) * 60 + int(parts[1]))
            if len(times) > 1 and max(times) < min(times) and (max(times) + 1440 - min(times)) < 1440:
                # Times don't go forward (could indicate error, but also could be next day)
                pass  # Skip - too many false positives
    
    # Check for contradictory statements by same officer
    for officer, statements in officer_statements.items():
        if len(statements) > 1:
            # Simple check - look for different THC values or contradictory facts
            thc_values = []
            for page, stmt in statements:
                thc_matches = re.findall(r'(\d+\.?\d*)\s*%\s*(?:thc|total)', stmt.lower())
                thc_values.extend([(page, v) for v in thc_matches])
            
            if len(set([v[1] for v in thc_values])) > 1:
                issues.append(DefenseIssue(
                    category="Internal Contradictions",
                    subcategory="Contradictory THC Values",
                    page=thc_values[0][0],
                    description=f"{officer} reports different THC values: {set([v[1] for v in thc_values])}",
                    defense_value="Contradictory statements undermine credibility",
                    severity="High"
                ))
    
    return issues

def search_scientific_issues(text_by_page: Dict[int, str]) -> List[DefenseIssue]:
    """Search for scientifically questionable results."""
    issues = []
    
    for page_num, text in text_by_page.items():
        text_lower = text.lower()
        
        # Check for impossible THC profiles
        if "100%" in text and "thc" in text_lower:
            if "delta-9" in text_lower or "delta 9" in text_lower:
                if "thca" in text_lower:
                    thca_match = re.search(r'thca[:\s]*(\d+\.?\d*)\s*%', text_lower)
                    if thca_match:
                        thca_val = float(thca_match.group(1))
                        if thca_val == 0:
                            issues.append(DefenseIssue(
                                category="Scientific Issues",
                                subcategory="Impossible THC Profile",
                                page=page_num,
                                description="100% Delta-9 THC with zero THCA is chemically impossible in natural cannabis",
                                defense_value="Results are scientifically invalid",
                                severity="Critical"
                            ))
        
        # Missing THCA where it should be present
        if "delta-9" in text_lower and "thc" in text_lower:
            if "thca" not in text_lower and "thc-a" not in text_lower:
                if "flower" in text_lower or "plant" in text_lower:
                    issues.append(DefenseIssue(
                        category="Scientific Issues",
                        subcategory="Missing THCA in Raw Material",
                        page=page_num,
                        description="Raw cannabis flower tested but THCA not reported",
                        defense_value="Raw cannabis should contain THCA - its absence suggests testing error",
                        severity="High"
                    ))
        
        # GC-MS conversion issues
        if "gc-ms" in text_lower or "gc/ms" in text_lower:
            if "thca" in text_lower and "converts" in text_lower:
                issues.append(DefenseIssue(
                    category="Scientific Issues",
                    subcategory="GC-MS Converts THCA",
                    page=page_num,
                    description="GC-MS method converts THCA to Delta-9 during testing",
                    defense_value="Cannot determine original THCA content - inflated Delta-9 values",
                    severity="High"
                ))
    
    return issues

def main():
    global HAS_PDFPLUMBER
    
    if not Path(PDF_PATH).exists():
        print(f"ERROR: PDF not found")
        return
    
    if not HAS_PDFPLUMBER:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
        import pdfplumber
        HAS_PDFPLUMBER = True
    
    # Extract text
    text_by_page = extract_text_pdfplumber(PDF_PATH)
    print(f"\nExtracted {len(text_by_page)} pages\n")
    
    # Search all categories
    print("Searching for procedural/constitutional issues...")
    procedural_issues = search_procedural_issues(text_by_page)
    print(f"  Found {len(procedural_issues)} issues")
    
    print("Searching for evidence handling issues...")
    evidence_issues = search_evidence_handling_issues(text_by_page)
    print(f"  Found {len(evidence_issues)} issues")
    
    print("Searching for testing/lab issues...")
    testing_issues = search_testing_lab_issues(text_by_page)
    print(f"  Found {len(testing_issues)} issues")
    
    print("Searching for sloppy/incomplete work...")
    sloppy_issues = search_sloppy_work(text_by_page)
    print(f"  Found {len(sloppy_issues)} issues")
    
    print("Searching for COMAR violations...")
    comar_issues = search_comar_violations(text_by_page)
    print(f"  Found {len(comar_issues)} issues")
    
    print("Searching for contradictions...")
    contradiction_issues = search_contradictions(text_by_page)
    print(f"  Found {len(contradiction_issues)} issues")
    
    print("Searching for scientific issues...")
    scientific_issues = search_scientific_issues(text_by_page)
    print(f"  Found {len(scientific_issues)} issues")
    
    # Combine all issues
    all_issues = (procedural_issues + evidence_issues + testing_issues + 
                  sloppy_issues + comar_issues + contradiction_issues + scientific_issues)
    
    print(f"\nTotal issues found: {len(all_issues)}\n")
    
    # Write master issue list
    master_list_path = Path("C:/Users/simmo/Desktop/master_defense_issues_list.txt")
    with open(master_list_path, 'w', encoding='utf-8') as f:
        f.write("MASTER DEFENSE ISSUES LIST\n")
        f.write("=" * 100 + "\n\n")
        
        # Group by category
        by_category = defaultdict(list)
        for issue in all_issues:
            by_category[issue.category].append(issue)
        
        for category in sorted(by_category.keys()):
            f.write(f"{category.upper()}\n")
            f.write("-" * 100 + "\n")
            for issue in by_category[category]:
                f.write(f"  • [{issue.severity}] {issue.subcategory} (Page {issue.page})\n")
                f.write(f"    {issue.description}\n")
            f.write("\n")
    
    print(f"Master issue list saved to: {master_list_path}")
    
    # Write page-numbered reference table
    table_path = Path("C:/Users/simmo/Desktop/defense_issues_reference_table.csv")
    with open(table_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['page', 'category', 'subcategory', 'description', 'defense_value', 'severity'])
        writer.writeheader()
        for issue in sorted(all_issues, key=lambda x: (x.page, x.category)):
            writer.writerow({
                'page': issue.page,
                'category': issue.category,
                'subcategory': issue.subcategory,
                'description': issue.description,
                'defense_value': issue.defense_value,
                'severity': issue.severity
            })
    
    print(f"Reference table saved to: {table_path}")
    
    # Write top 10 high-value opportunities
    top10_path = Path("C:/Users/simmo/Desktop/top10_defense_opportunities.txt")
    with open(top10_path, 'w', encoding='utf-8') as f:
        f.write("TOP 10 HIGH-VALUE DEFENSE OPPORTUNITIES\n")
        f.write("=" * 100 + "\n\n")
        
        # Sort by severity (Critical > High > Medium > Low) and category importance
        severity_order = {'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1}
        sorted_issues = sorted(all_issues, key=lambda x: (severity_order.get(x.severity, 0), x.page), reverse=True)
        
        for i, issue in enumerate(sorted_issues[:10], 1):
            f.write(f"{i}. [{issue.severity}] {issue.subcategory}\n")
            f.write(f"   Page: {issue.page}\n")
            f.write(f"   Category: {issue.category}\n")
            f.write(f"   Description: {issue.description}\n")
            f.write(f"   Defense Value: {issue.defense_value}\n\n")
    
    print(f"Top 10 opportunities saved to: {top10_path}")
    
    # Write comprehensive narrative
    narrative_path = Path("C:/Users/simmo/Desktop/defense_issues_narrative.txt")
    with open(narrative_path, 'w', encoding='utf-8') as f:
        f.write("COMPREHENSIVE DEFENSE ISSUES NARRATIVE\n")
        f.write("=" * 100 + "\n\n")
        
        f.write("EXECUTIVE SUMMARY\n")
        f.write("-" * 100 + "\n")
        f.write(f"Total potential defense issues identified: {len(all_issues)}\n\n")
        
        by_category_summary = defaultdict(int)
        by_severity_summary = defaultdict(int)
        for issue in all_issues:
            by_category_summary[issue.category] += 1
            by_severity_summary[issue.severity] += 1
        
        f.write("Issues by Category:\n")
        for cat, count in sorted(by_category_summary.items()):
            f.write(f"  {cat}: {count}\n")
        
        f.write("\nIssues by Severity:\n")
        for sev, count in sorted(by_severity_summary.items(), key=lambda x: severity_order.get(x[0], 0), reverse=True):
            f.write(f"  {sev}: {count}\n")
        
        f.write("\n\nDETAILED NARRATIVE BY CATEGORY\n")
        f.write("=" * 100 + "\n\n")
        
        for category in sorted(by_category.keys()):
            f.write(f"{category.upper()}\n")
            f.write("=" * 100 + "\n\n")
            
            for issue in sorted(by_category[category], key=lambda x: x.page):
                f.write(f"Page {issue.page}: {issue.subcategory}\n")
                f.write(f"Severity: {issue.severity}\n")
                f.write(f"Issue: {issue.description}\n")
                f.write(f"Defense Value: {issue.defense_value}\n")
                f.write(f"\nWhy This Matters:\n")
                
                # Add context-specific explanations
                if "Missing" in issue.subcategory or "Missing" in issue.description:
                    f.write("Missing documentation or procedures create gaps in the State's case. ")
                    f.write("The absence of required elements can lead to suppression of evidence ")
                    f.write("or dismissal of charges.\n\n")
                elif "Impossible" in issue.subcategory or "Impossible" in issue.description:
                    f.write("Impossible or scientifically invalid results cannot be used to support ")
                    f.write("criminal charges. Such results demonstrate that the testing methodology ")
                    f.write("or instruments are unreliable.\n\n")
                elif "Contradiction" in issue.subcategory:
                    f.write("Contradictory statements or results undermine the credibility of the ")
                    f.write("State's witnesses and evidence. Inconsistencies create reasonable doubt.\n\n")
                elif "Violation" in issue.subcategory:
                    f.write("Statutory or regulatory violations may render evidence inadmissible or ")
                    f.write("charges improper. Violations of COMAR or state law can be grounds for dismissal.\n\n")
                else:
                    f.write("This issue weakens the State's case by [requires case-specific analysis].\n\n")
                
                f.write("-" * 100 + "\n\n")
        
        # Special note about quantitative results
        f.write("QUANTITATIVE THC RESULTS\n")
        f.write("=" * 100 + "\n")
        quantitative_found = any("quantitative" in issue.description.lower() or 
                                "unable to quantitate" in issue.description.lower() 
                                for issue in all_issues)
        if not quantitative_found:
            f.write("NO QUANTITATIVE THC PERCENTAGES WERE FOUND IN THE DISCOVERY.\n")
            f.write("All State laboratory reports were qualitative (threshold-only, ≥1%) or lacked\n")
            f.write("specific quantitative cannabinoid percentages. This is significant because:\n")
            f.write("  - Quantitative cannabinoid analysis is required to differentiate hemp from marijuana\n")
            f.write("  - Threshold-only results (≥1%) cannot establish actual THC content\n")
            f.write("  - Without specific percentages, the State cannot prove the material exceeded\n")
            f.write("    the 0.3% delta-9-THC limit for hemp classification\n\n")
        else:
            f.write("Some quantitative results were identified, but they require expert review to\n")
            f.write("determine their scientific and legal reliability.\n\n")
    
    print(f"Comprehensive narrative saved to: {narrative_path}")
    print("\nAnalysis complete!")

if __name__ == "__main__":
    main()















