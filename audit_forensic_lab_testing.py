#!/usr/bin/env python3
"""
Forensic Laboratory Testing Audit Script
Extracts all COAs, lab reports, sample IDs, and testing information from discovery PDFs.
"""

import sys
import re
from pathlib import Path
from collections import defaultdict
from datetime import datetime

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

# Fallback: try pypdf (newer version of PyPDF2)
if not HAS_PYPDF2:
    try:
        import pypdf
        PyPDF2 = pypdf
        HAS_PYPDF2 = True
    except ImportError:
        pass

def extract_text_from_pdf_pypdf2(pdf_path):
    """Extract text from PDF using PyPDF2/pypdf."""
    text_by_page = {}
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            total_pages = len(pdf_reader.pages)
            print(f"Total pages: {total_pages}")
            
            for page_num in range(total_pages):
                try:
                    page = pdf_reader.pages[page_num]
                    text = page.extract_text()
                    text_by_page[page_num + 1] = text  # 1-indexed
                    if (page_num + 1) % 50 == 0:
                        print(f"Processed page {page_num + 1}/{total_pages}")
                except Exception as e:
                    print(f"Error extracting page {page_num + 1}: {e}")
                    text_by_page[page_num + 1] = ""
    except Exception as e:
        print(f"Error reading PDF: {e}")
    return text_by_page

def extract_text_from_pdf_pdfplumber(pdf_path):
    """Extract text from PDF using pdfplumber (better for tables)."""
    text_by_page = {}
    try:
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            print(f"Total pages: {total_pages}")
            
            for page_num, page in enumerate(pdf.pages):
                try:
                    text = page.extract_text()
                    text_by_page[page_num + 1] = text or ""  # 1-indexed
                    if (page_num + 1) % 50 == 0:
                        print(f"Processed page {page_num + 1}/{total_pages}")
                except Exception as e:
                    print(f"Error extracting page {page_num + 1}: {e}")
                    text_by_page[page_num + 1] = ""
    except Exception as e:
        print(f"Error reading PDF: {e}")
    return text_by_page

def find_coa_keywords(text):
    """Find COA-related keywords in text."""
    patterns = {
        'coa': r'\b(?:COA|Certificate of Analysis|certificate of analysis)\b',
        'lab_report': r'\b(?:laboratory report|lab report|forensic lab|forensic laboratory)\b',
        'chemistry_report': r'\b(?:chemistry report|chemical analysis)\b',
        'forensic_results': r'\b(?:forensic lab results|forensic testing|lab results)\b',
    }
    found = {}
    for key, pattern in patterns.items():
        matches = re.finditer(pattern, text, re.IGNORECASE)
        found[key] = list(matches)
    return found

def extract_sample_ids(text):
    """Extract sample IDs, item numbers, exhibit numbers."""
    # Common patterns for sample/item IDs
    patterns = [
        r'\b(?:Sample|Item|Exhibit|Evidence|Specimen)[\s#:]*([A-Z0-9\-]+)',
        r'\b([A-Z]{1,3}[- ]?\d{2,6}[A-Z]?[- ]?\d{0,4})\b',  # Alphanumeric IDs
        r'\b(?:ID|I\.D\.|Id)[\s#:]*([A-Z0-9\-]+)',
        r'\b(?:Lab|Case)[\s#:]*([A-Z0-9\-]+)',
        r'\b([0-9]{2,6}[- ][0-9]{2,6}[- ][0-9]{2,6})\b',  # Date-like but could be IDs
    ]
    
    sample_ids = set()
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            id_val = match.group(1) if match.groups() else match.group(0)
            # Filter out obvious non-IDs (dates, common words, etc.)
            if len(id_val) >= 2 and not re.match(r'^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$', id_val):
                sample_ids.add(id_val.strip())
    
    return sample_ids

def find_testing_tables(text):
    """Identify tables that list subsamples or test runs."""
    # Look for table-like structures with multiple rows of data
    table_indicators = [
        r'Subsample|Sub-sample|Test Run|Replicate|Duplicate',
        r'Run\s+#|Sample\s+#|Item\s+#',
        r'\d+\s+\d+\.\d+\s+\d+\.\d+',  # Multiple numbers in rows (could be table data)
    ]
    
    found = []
    for pattern in table_indicators:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            # Get context around the match
            start = max(0, match.start() - 200)
            end = min(len(text), match.end() + 200)
            context = text[start:end]
            found.append({
                'pattern': pattern,
                'context': context,
                'position': match.start()
            })
    
    return found

def check_composite_individual(text):
    """Check if testing was on individual samples or composite."""
    composite_indicators = [
        r'\bcomposite\b',
        r'\bhomogenized\b',
        r'\bcombined\s+sample\b',
        r'\bpooled\s+sample\b',
    ]
    
    individual_indicators = [
        r'\bindividual\s+sample\b',
        r'\bseparate\s+sample\b',
        r'\beach\s+sample\b',
    ]
    
    is_composite = any(re.search(pattern, text, re.IGNORECASE) for pattern in composite_indicators)
    is_individual = any(re.search(pattern, text, re.IGNORECASE) for pattern in individual_indicators)
    
    return {
        'composite': is_composite,
        'individual': is_individual,
        'unclear': not (is_composite or is_individual)
    }

def check_sampling_protocol(text):
    """Check for documented sampling protocol or homogenization procedure."""
    protocol_indicators = [
        r'\bsampling\s+protocol\b',
        r'\bhomogenization\s+procedure\b',
        r'\bsample\s+preparation\b',
        r'\bmethod\s+of\s+sampling\b',
        r'\bsample\s+collection\s+method\b',
    ]
    
    found = []
    for pattern in protocol_indicators:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            # Get context
            start = max(0, match.start() - 300)
            end = min(len(text), match.end() + 300)
            context = text[start:end]
            found.append({
                'term': match.group(0),
                'context': context
            })
    
    return found

def count_samples_tested(text):
    """Try to count number of samples tested."""
    # Look for patterns like "X samples tested" or lists of sample numbers
    count_patterns = [
        r'(\d+)\s+(?:samples?|items?|specimens?)\s+(?:tested|analyzed|examined)',
        r'(?:tested|analyzed|examined)\s+(\d+)\s+(?:samples?|items?|specimens?)',
        r'total[:\s]+(\d+)\s+(?:samples?|items?|specimens?)',
    ]
    
    counts = []
    for pattern in count_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            try:
                count = int(match.group(1))
                counts.append(count)
            except:
                pass
    
    return counts

def audit_pdf(pdf_path):
    """Main audit function."""
    print(f"Starting audit of: {pdf_path}")
    print("=" * 80)
    
    # Extract text
    if HAS_PDFPLUMBER:
        print("Using pdfplumber for text extraction...")
        text_by_page = extract_text_from_pdf_pdfplumber(pdf_path)
    elif HAS_PYPDF2:
        print("Using PyPDF2/pypdf for text extraction...")
        text_by_page = extract_text_from_pdf_pypdf2(pdf_path)
    else:
        print("ERROR: No PDF library available. Please install pdfplumber or PyPDF2/pypdf")
        print("Install with: pip install pdfplumber")
        return None
    
    # Data structures for findings
    coa_pages = []  # Pages with COAs
    lab_report_pages = []  # Pages with lab reports
    all_sample_ids = set()
    sample_id_locations = defaultdict(list)  # ID -> list of (page, context)
    testing_tables = []
    composite_info = []
    sampling_protocols = []
    sample_counts = []
    
    print("\nAnalyzing pages for forensic testing documents...")
    print("=" * 80)
    
    # Analyze each page
    for page_num, text in text_by_page.items():
        if not text or len(text.strip()) < 50:  # Skip mostly empty pages
            continue
        
        # Find COA keywords
        keywords = find_coa_keywords(text)
        has_coa = any(keywords.values())
        
        if has_coa:
            coa_pages.append(page_num)
            print(f"Found COA/lab report indicators on page {page_num}")
        
        # Extract sample IDs
        page_sample_ids = extract_sample_ids(text)
        for sample_id in page_sample_ids:
            all_sample_ids.add(sample_id)
            # Get context around the ID
            id_pos = text.find(sample_id)
            if id_pos >= 0:
                start = max(0, id_pos - 150)
                end = min(len(text), id_pos + len(sample_id) + 150)
                context = text[start:end]
                sample_id_locations[sample_id].append({
                    'page': page_num,
                    'context': context
                })
        
        # Find testing tables
        tables = find_testing_tables(text)
        if tables:
            testing_tables.append({
                'page': page_num,
                'tables': tables
            })
        
        # Check for composite/individual
        composite_check = check_composite_individual(text)
        if composite_check['composite'] or composite_check['individual']:
            composite_info.append({
                'page': page_num,
                'type': 'composite' if composite_check['composite'] else 'individual',
                'unclear': composite_check['unclear']
            })
        
        # Check for sampling protocols
        protocols = check_sampling_protocol(text)
        if protocols:
            sampling_protocols.append({
                'page': page_num,
                'protocols': protocols
            })
        
        # Count samples
        counts = count_samples_tested(text)
        if counts:
            sample_counts.append({
                'page': page_num,
                'counts': counts
            })
    
    # Generate report
    print("\n" + "=" * 80)
    print("GENERATING AUDIT REPORT")
    print("=" * 80)
    
    report = generate_report(
        pdf_path,
        coa_pages,
        all_sample_ids,
        sample_id_locations,
        testing_tables,
        composite_info,
        sampling_protocols,
        sample_counts,
        text_by_page
    )
    
    return report

def generate_report(pdf_path, coa_pages, all_sample_ids, sample_id_locations, 
                   testing_tables, composite_info, sampling_protocols, 
                   sample_counts, text_by_page):
    """Generate comprehensive audit report."""
    
    report_lines = []
    report_lines.append("=" * 80)
    report_lines.append("FORENSIC LABORATORY TESTING AUDIT REPORT")
    report_lines.append("=" * 80)
    report_lines.append(f"Source File: {pdf_path}")
    report_lines.append(f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_lines.append("")
    
    # Final Summary Section
    report_lines.append("=" * 80)
    report_lines.append("FINAL SUMMARY")
    report_lines.append("=" * 80)
    report_lines.append("")
    
    # Total samples tested
    unique_sample_ids = len(all_sample_ids)
    report_lines.append(f"Total Unique Sample/Item IDs Found: {unique_sample_ids}")
    
    # Total pages with COAs
    unique_coa_pages = sorted(set(coa_pages))
    report_lines.append(f"Total Pages with COA/Lab Report Indicators: {len(unique_coa_pages)}")
    report_lines.append(f"Page Numbers: {', '.join(map(str, unique_coa_pages))}")
    report_lines.append("")
    
    # Sample counts from text
    all_counts = []
    for item in sample_counts:
        all_counts.extend(item['counts'])
    if all_counts:
        report_lines.append(f"Sample Counts Mentioned in Text: {all_counts}")
        report_lines.append(f"Maximum Count Mentioned: {max(all_counts) if all_counts else 'N/A'}")
        report_lines.append("")
    
    # Composite vs Individual
    composite_pages = [item['page'] for item in composite_info if item['type'] == 'composite']
    individual_pages = [item['page'] for item in composite_info if item['type'] == 'individual']
    report_lines.append(f"Pages Mentioning Composite Testing: {len(composite_pages)}")
    if composite_pages:
        report_lines.append(f"  Page Numbers: {', '.join(map(str, composite_pages))}")
    report_lines.append(f"Pages Mentioning Individual Testing: {len(individual_pages)}")
    if individual_pages:
        report_lines.append(f"  Page Numbers: {', '.join(map(str, individual_pages))}")
    report_lines.append("")
    
    # Sampling protocols
    protocol_pages = sorted(set([item['page'] for item in sampling_protocols]))
    report_lines.append(f"Pages with Sampling Protocol Documentation: {len(protocol_pages)}")
    if protocol_pages:
        report_lines.append(f"  Page Numbers: {', '.join(map(str, protocol_pages))}")
    report_lines.append("")
    
    # Testing tables
    table_pages = sorted(set([item['page'] for item in testing_tables]))
    report_lines.append(f"Pages with Testing Tables/Subsamples: {len(table_pages)}")
    if table_pages:
        report_lines.append(f"  Page Numbers: {', '.join(map(str, table_pages))}")
    report_lines.append("")
    
    # Detailed Findings Section
    report_lines.append("=" * 80)
    report_lines.append("DETAILED FINDINGS")
    report_lines.append("=" * 80)
    report_lines.append("")
    
    # COA Pages Details
    report_lines.append("COA/LAB REPORT PAGES:")
    report_lines.append("-" * 80)
    for page in unique_coa_pages:
        report_lines.append(f"  Page {page}: Contains COA/laboratory report indicators")
        # Try to extract a snippet
        text = text_by_page.get(page, "")
        if text:
            # Find first occurrence of COA keyword
            coa_match = re.search(r'(?:COA|Certificate of Analysis|certificate of analysis|laboratory report)', 
                                 text, re.IGNORECASE)
            if coa_match:
                start = max(0, coa_match.start() - 100)
                end = min(len(text), coa_match.end() + 200)
                snippet = text[start:end].replace('\n', ' ').strip()
                report_lines.append(f"    Context: ...{snippet}...")
    report_lines.append("")
    
    # Sample IDs
    report_lines.append("EXTRACTED SAMPLE/ITEM IDs:")
    report_lines.append("-" * 80)
    sorted_ids = sorted(all_sample_ids, key=lambda x: (len(x), x))
    for sample_id in sorted_ids:
        locations = sample_id_locations[sample_id]
        pages = sorted(set([loc['page'] for loc in locations]))
        report_lines.append(f"  {sample_id}:")
        report_lines.append(f"    Found on pages: {', '.join(map(str, pages))}")
        report_lines.append(f"    Total occurrences: {len(locations)}")
    report_lines.append("")
    
    # Composite/Individual Testing
    if composite_info:
        report_lines.append("COMPOSITE vs INDIVIDUAL TESTING:")
        report_lines.append("-" * 80)
        for item in composite_info:
            report_lines.append(f"  Page {item['page']}: {item['type'].upper()} testing indicated")
    report_lines.append("")
    
    # Sampling Protocols
    if sampling_protocols:
        report_lines.append("SAMPLING PROTOCOL DOCUMENTATION:")
        report_lines.append("-" * 80)
        for item in sampling_protocols:
            report_lines.append(f"  Page {item['page']}:")
            for protocol in item['protocols']:
                report_lines.append(f"    Found: {protocol['term']}")
                context = protocol['context'].replace('\n', ' ').strip()[:200]
                report_lines.append(f"    Context: ...{context}...")
    report_lines.append("")
    
    # Testing Tables
    if testing_tables:
        report_lines.append("TESTING TABLES/SUBSAMPLES:")
        report_lines.append("-" * 80)
        for item in testing_tables:
            report_lines.append(f"  Page {item['page']}: Contains testing table indicators")
    report_lines.append("")
    
    # File Names and Page Numbers
    report_lines.append("=" * 80)
    report_lines.append("FILE NAMES + PAGE NUMBERS")
    report_lines.append("=" * 80)
    report_lines.append(f"Source File: {Path(pdf_path).name}")
    report_lines.append(f"Total Pages in PDF: {len(text_by_page)}")
    report_lines.append("")
    report_lines.append("Pages with COA/Lab Reports:")
    for page in unique_coa_pages:
        report_lines.append(f"  {Path(pdf_path).name} - Page {page}")
    report_lines.append("")
    
    # Additional Analysis
    report_lines.append("=" * 80)
    report_lines.append("ADDITIONAL ANALYSIS")
    report_lines.append("=" * 80)
    report_lines.append("")
    
    # Check if testing represents all seized material
    all_seized_patterns = [
        r'\ball\s+seized\s+material\b',
        r'\ball\s+samples\s+tested\b',
        r'\bcomplete\s+testing\b',
        r'\bfull\s+inventory\b',
    ]
    
    subset_patterns = [
        r'\bsubset\b',
        r'\brepresentative\s+sample\b',
        r'\bselected\s+samples\b',
        r'\bpartial\s+testing\b',
    ]
    
    all_text = ' '.join(text_by_page.values())
    all_seized_mentions = sum(1 for pattern in all_seized_patterns 
                             if re.search(pattern, all_text, re.IGNORECASE))
    subset_mentions = sum(1 for pattern in subset_patterns 
                         if re.search(pattern, all_text, re.IGNORECASE))
    
    report_lines.append(f"Indications of Testing All Seized Material: {all_seized_mentions} mentions")
    report_lines.append(f"Indications of Subset/Representative Testing: {subset_mentions} mentions")
    report_lines.append("")
    
    # Non-representative sampling indicators
    non_rep_patterns = [
        r'\bnon-representative\b',
        r'\binsufficient\s+sampling\b',
        r'\binadequate\s+sample\b',
        r'\bsampling\s+error\b',
    ]
    
    non_rep_mentions = sum(1 for pattern in non_rep_patterns 
                          if re.search(pattern, all_text, re.IGNORECASE))
    report_lines.append(f"Indications of Non-Representative/Insufficient Sampling: {non_rep_mentions} mentions")
    report_lines.append("")
    
    report_lines.append("=" * 80)
    report_lines.append("END OF REPORT")
    report_lines.append("=" * 80)
    
    return '\n'.join(report_lines)

def main():
    pdf_path = r"C:\Users\simmo\Downloads\Copy of Discovery attachments Babars combined 840 pages_RedactedB (1) (1).pdf"
    
    if not Path(pdf_path).exists():
        print(f"ERROR: PDF file not found: {pdf_path}")
        print("Please check the file path.")
        return
    
    report = audit_pdf(pdf_path)
    
    if report:
        # Save report
        output_file = "FORENSIC_LAB_AUDIT_REPORT.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print("\n" + "=" * 80)
        print(f"Audit complete! Report saved to: {output_file}")
        print("=" * 80)
        
        # Also print summary to console
        print("\nSUMMARY:")
        print("-" * 80)
        lines = report.split('\n')
        in_summary = False
        for line in lines:
            if "FINAL SUMMARY" in line:
                in_summary = True
            if in_summary and "DETAILED FINDINGS" in line:
                break
            if in_summary:
                print(line)

if __name__ == "__main__":
    main()
















