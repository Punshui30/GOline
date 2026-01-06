#!/usr/bin/env python3
"""
Enhanced Forensic Laboratory Testing Audit Script
Extracts all COAs, lab reports, sample IDs, and testing information from discovery PDFs.
Uses pdfplumber for better table extraction and improved pattern matching.
"""

import sys
import re
from pathlib import Path
from collections import defaultdict
from datetime import datetime

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    print("ERROR: pdfplumber not installed. Install with: pip install pdfplumber")
    sys.exit(1)

# Common words to exclude from sample IDs
COMMON_WORDS = {
    'as', 'is', 'to', 'of', 'in', 'on', 'at', 'it', 'be', 'we', 'or', 'an', 'if', 'no',
    'id', 'ii', 'in', 'if', 'nu', 'of', 'oj', 'si', 'wo', 'as', 'cl', 'ed', 'el', 'en',
    'fl', 'fn', 'is', 'it', 'li', 'll', 'of', 'om', 'or', 'ta', 'ti', 'to', 'all', 'and',
    'law', 'num', 'ori', 'pro', 'qty', 'sig', 'sil', 'thc', 'use', 'won', 'wor', 'acc',
    'and', 'eat', 'hem', 'the', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
    'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man',
    'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put',
    'say', 'she', 'too', 'use'
}

def extract_text_and_tables_from_pdf(pdf_path):
    """Extract text and tables from PDF using pdfplumber."""
    text_by_page = {}
    tables_by_page = {}
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            print(f"Total pages: {total_pages}")
            
            for page_num, page in enumerate(pdf.pages):
                try:
                    # Extract text
                    text = page.extract_text()
                    text_by_page[page_num + 1] = text or ""  # 1-indexed
                    
                    # Extract tables
                    tables = page.extract_tables()
                    if tables:
                        tables_by_page[page_num + 1] = tables
                    
                    if (page_num + 1) % 50 == 0:
                        print(f"Processed page {page_num + 1}/{total_pages}")
                except Exception as e:
                    print(f"Error extracting page {page_num + 1}: {e}")
                    text_by_page[page_num + 1] = ""
                    tables_by_page[page_num + 1] = []
    except Exception as e:
        print(f"Error reading PDF: {e}")
    
    return text_by_page, tables_by_page

def find_coa_keywords_enhanced(text):
    """Find COA-related keywords with more flexible patterns."""
    patterns = {
        'coa': r'\b(?:COA|Certificate of Analysis|certificate of analysis|C\.O\.A\.|C of A)\b',
        'lab_report': r'\b(?:laboratory report|lab report|forensic lab|forensic laboratory|lab analysis|laboratory analysis)\b',
        'chemistry_report': r'\b(?:chemistry report|chemical analysis|chemical testing)\b',
        'forensic_results': r'\b(?:forensic lab results|forensic testing|lab results|test results|analysis results)\b',
        'test_report': r'\b(?:test report|testing report|analytical report)\b',
        'lab_cert': r'\b(?:lab certificate|laboratory certificate)\b',
    }
    found = {}
    for key, pattern in patterns.items():
        matches = re.finditer(pattern, text, re.IGNORECASE)
        found[key] = list(matches)
    return found

def extract_sample_ids_enhanced(text):
    """Extract sample IDs with better filtering."""
    # More specific patterns for sample/item IDs
    patterns = [
        # Pattern: "Sample 123" or "Item 456" or "Exhibit A-1"
        r'\b(?:Sample|Item|Exhibit|Evidence|Specimen|Case)[\s#:]*([A-Z0-9][A-Z0-9\-]{1,15})\b',
        # Pattern: Alphanumeric IDs like "A123", "B-456", "C12-34"
        r'\b([A-Z]{1,2}[- ]?\d{2,6}[A-Z]?[- ]?\d{0,4})\b',
        # Pattern: "ID: ABC123" or "Lab ID: 456"
        r'\b(?:ID|I\.D\.|Lab ID|Sample ID|Item ID)[\s#:]*([A-Z0-9][A-Z0-9\-]{2,15})\b',
        # Pattern: Numeric IDs with dashes (but not dates)
        r'\b(\d{3,6}[- ]\d{2,6}[- ]?\d{0,4})\b',
        # Pattern: Evidence numbers like "E-12345"
        r'\b([E][- ]?\d{3,6})\b',
    ]
    
    sample_ids = set()
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            id_val = match.group(1) if match.groups() else match.group(0)
            id_val = id_val.strip().upper()
            
            # Filter out:
            # - Dates (MM/DD/YYYY or DD/MM/YYYY)
            if re.match(r'^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$', id_val):
                continue
            # - Common words
            if id_val.lower() in COMMON_WORDS:
                continue
            # - Too short (less than 2 chars) or too long (more than 20 chars)
            if len(id_val) < 2 or len(id_val) > 20:
                continue
            # - Only numbers (likely not an ID)
            if re.match(r'^\d+$', id_val) and len(id_val) < 3:
                continue
            # - Common abbreviations that aren't IDs
            if id_val in ['ID', 'II', 'IN', 'OF', 'NO', 'TO', 'AS', 'IS', 'IT', 'OF']:
                continue
            
            sample_ids.add(id_val)
    
    return sample_ids

def extract_sample_ids_from_tables(tables):
    """Extract sample IDs from PDF tables."""
    sample_ids = set()
    
    for table in tables:
        if not table:
            continue
        
        # Look for sample/item columns
        for row in table:
            if not row:
                continue
            
            for cell in row:
                if not cell:
                    continue
                
                cell_text = str(cell).strip()
                
                # Check if cell contains sample ID patterns
                patterns = [
                    r'\b([A-Z]{1,2}[- ]?\d{2,6}[A-Z]?[- ]?\d{0,4})\b',
                    r'\b(\d{3,6}[- ]\d{2,6})\b',
                    r'\b([E][- ]?\d{3,6})\b',
                ]
                
                for pattern in patterns:
                    matches = re.finditer(pattern, cell_text, re.IGNORECASE)
                    for match in matches:
                        id_val = match.group(1).strip().upper()
                        if len(id_val) >= 2 and len(id_val) <= 20:
                            if id_val.lower() not in COMMON_WORDS:
                                sample_ids.add(id_val)
    
    return sample_ids

def analyze_tables_for_testing(tables):
    """Analyze tables for testing data."""
    testing_info = {
        'has_subsamples': False,
        'has_test_runs': False,
        'sample_count': 0,
        'table_data': []
    }
    
    for table in tables:
        if not table:
            continue
        
        table_text = ' '.join([' '.join([str(cell) for cell in row if cell]) for row in table])
        
        # Check for subsample indicators
        if re.search(r'subsample|sub-sample|replicate|duplicate', table_text, re.IGNORECASE):
            testing_info['has_subsamples'] = True
        
        # Check for test run indicators
        if re.search(r'test run|run\s*#|run number', table_text, re.IGNORECASE):
            testing_info['has_test_runs'] = True
        
        # Try to count samples in table
        # Look for rows that might be samples
        sample_rows = 0
        for row in table:
            if not row:
                continue
            # If row has multiple columns with data, might be a sample row
            data_cells = [cell for cell in row if cell and str(cell).strip()]
            if len(data_cells) >= 2:
                # Check if it looks like a data row (not a header)
                row_text = ' '.join([str(cell) for cell in data_cells]).lower()
                if not re.search(r'sample|item|exhibit|test|run|result', row_text):
                    sample_rows += 1
        
        if sample_rows > 0:
            testing_info['sample_count'] = max(testing_info['sample_count'], sample_rows)
        
        testing_info['table_data'].append({
            'rows': len(table),
            'cols': len(table[0]) if table else 0,
            'text': table_text[:500]  # First 500 chars
        })
    
    return testing_info

def check_composite_individual_enhanced(text):
    """Enhanced check for composite vs individual testing."""
    composite_indicators = [
        r'\bcomposite\s+(?:sample|specimen|test)\b',
        r'\bhomogenized\s+(?:sample|material)\b',
        r'\bcombined\s+(?:sample|samples)\b',
        r'\bpooled\s+(?:sample|samples)\b',
        r'\brepresentative\s+sample\b',
    ]
    
    individual_indicators = [
        r'\bindividual\s+(?:sample|samples|specimen)\b',
        r'\bseparate\s+(?:sample|samples)\b',
        r'\beach\s+(?:sample|item)\b',
        r'\bdiscrete\s+(?:sample|samples)\b',
    ]
    
    is_composite = any(re.search(pattern, text, re.IGNORECASE) for pattern in composite_indicators)
    is_individual = any(re.search(pattern, text, re.IGNORECASE) for pattern in individual_indicators)
    
    return {
        'composite': is_composite,
        'individual': is_individual,
        'unclear': not (is_composite or is_individual)
    }

def check_sampling_protocol_enhanced(text):
    """Enhanced check for sampling protocols."""
    protocol_indicators = [
        r'\bsampling\s+protocol\b',
        r'\bhomogenization\s+(?:procedure|method|protocol)\b',
        r'\bsample\s+preparation\b',
        r'\bmethod\s+of\s+sampling\b',
        r'\bsample\s+collection\s+method\b',
        r'\bsample\s+handling\s+procedure\b',
        r'\bpreparation\s+method\b',
    ]
    
    found = []
    for pattern in protocol_indicators:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            start = max(0, match.start() - 300)
            end = min(len(text), match.end() + 300)
            context = text[start:end]
            found.append({
                'term': match.group(0),
                'context': context.replace('\n', ' ').strip()
            })
    
    return found

def count_samples_tested_enhanced(text):
    """Enhanced sample counting."""
    count_patterns = [
        r'(\d+)\s+(?:samples?|items?|specimens?)\s+(?:tested|analyzed|examined|submitted)',
        r'(?:tested|analyzed|examined|submitted)\s+(\d+)\s+(?:samples?|items?|specimens?)',
        r'total[:\s]+(\d+)\s+(?:samples?|items?|specimens?)',
        r'(\d+)\s+(?:samples?|items?)\s+received',
        r'received\s+(\d+)\s+(?:samples?|items?)',
    ]
    
    counts = []
    for pattern in count_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            try:
                count = int(match.group(1))
                if 1 <= count <= 10000:  # Reasonable range
                    counts.append(count)
            except:
                pass
    
    return counts

def audit_pdf_enhanced(pdf_path):
    """Enhanced main audit function."""
    print(f"Starting enhanced audit of: {pdf_path}")
    print("=" * 80)
    
    # Extract text and tables
    print("Extracting text and tables from PDF...")
    text_by_page, tables_by_page = extract_text_and_tables_from_pdf(pdf_path)
    
    # Data structures for findings
    coa_pages = []
    lab_report_pages = []
    all_sample_ids = set()
    sample_id_locations = defaultdict(list)
    testing_tables = []
    composite_info = []
    sampling_protocols = []
    sample_counts = []
    table_sample_ids = set()
    
    print("\nAnalyzing pages for forensic testing documents...")
    print("=" * 80)
    
    # Analyze each page
    for page_num in sorted(text_by_page.keys()):
        text = text_by_page[page_num]
        tables = tables_by_page.get(page_num, [])
        
        if not text or len(text.strip()) < 50:
            # Even if no text, check tables
            if tables:
                table_ids = extract_sample_ids_from_tables(tables)
                table_sample_ids.update(table_ids)
                table_info = analyze_tables_for_testing(tables)
                if table_info['has_subsamples'] or table_info['has_test_runs'] or table_info['sample_count'] > 0:
                    testing_tables.append({
                        'page': page_num,
                        'info': table_info
                    })
            continue
        
        # Find COA keywords
        keywords = find_coa_keywords_enhanced(text)
        has_coa = any(keywords.values())
        
        if has_coa:
            coa_pages.append(page_num)
            print(f"Found COA/lab report indicators on page {page_num}")
        
        # Extract sample IDs from text
        page_sample_ids = extract_sample_ids_enhanced(text)
        for sample_id in page_sample_ids:
            all_sample_ids.add(sample_id)
            id_pos = text.find(sample_id)
            if id_pos >= 0:
                start = max(0, id_pos - 150)
                end = min(len(text), id_pos + len(sample_id) + 150)
                context = text[start:end].replace('\n', ' ').strip()
                sample_id_locations[sample_id].append({
                    'page': page_num,
                    'context': context
                })
        
        # Extract sample IDs from tables
        if tables:
            table_ids = extract_sample_ids_from_tables(tables)
            table_sample_ids.update(table_ids)
            for sample_id in table_ids:
                all_sample_ids.add(sample_id)
                sample_id_locations[sample_id].append({
                    'page': page_num,
                    'context': f'[Found in table on page {page_num}]'
                })
            
            # Analyze tables for testing data
            table_info = analyze_tables_for_testing(tables)
            if table_info['has_subsamples'] or table_info['has_test_runs'] or table_info['sample_count'] > 0:
                testing_tables.append({
                    'page': page_num,
                    'info': table_info
                })
        
        # Check for composite/individual
        composite_check = check_composite_individual_enhanced(text)
        if composite_check['composite'] or composite_check['individual']:
            composite_info.append({
                'page': page_num,
                'type': 'composite' if composite_check['composite'] else 'individual',
                'unclear': composite_check['unclear']
            })
        
        # Check for sampling protocols
        protocols = check_sampling_protocol_enhanced(text)
        if protocols:
            sampling_protocols.append({
                'page': page_num,
                'protocols': protocols
            })
        
        # Count samples
        counts = count_samples_tested_enhanced(text)
        if counts:
            sample_counts.append({
                'page': page_num,
                'counts': counts
            })
    
    # Generate report
    print("\n" + "=" * 80)
    print("GENERATING ENHANCED AUDIT REPORT")
    print("=" * 80)
    
    report = generate_enhanced_report(
        pdf_path,
        coa_pages,
        all_sample_ids,
        sample_id_locations,
        testing_tables,
        composite_info,
        sampling_protocols,
        sample_counts,
        text_by_page,
        tables_by_page
    )
    
    return report

def generate_enhanced_report(pdf_path, coa_pages, all_sample_ids, sample_id_locations,
                            testing_tables, composite_info, sampling_protocols,
                            sample_counts, text_by_page, tables_by_page):
    """Generate comprehensive enhanced audit report."""
    
    report_lines = []
    report_lines.append("=" * 80)
    report_lines.append("FORENSIC LABORATORY TESTING AUDIT REPORT (ENHANCED)")
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
    if unique_coa_pages:
        report_lines.append(f"Page Numbers: {', '.join(map(str, unique_coa_pages))}")
    report_lines.append("")
    
    # Sample counts from text
    all_counts = []
    for item in sample_counts:
        all_counts.extend(item['counts'])
    if all_counts:
        report_lines.append(f"Sample Counts Mentioned in Text: {sorted(set(all_counts))}")
        report_lines.append(f"Maximum Count Mentioned: {max(all_counts) if all_counts else 'N/A'}")
        report_lines.append("")
    
    # Testing tables summary
    table_pages = sorted(set([item['page'] for item in testing_tables]))
    report_lines.append(f"Pages with Testing Tables/Subsamples: {len(table_pages)}")
    if table_pages:
        report_lines.append(f"  Page Numbers: {', '.join(map(str, table_pages))}")
        
        # Count samples from tables
        total_table_samples = sum(item['info'].get('sample_count', 0) for item in testing_tables)
        if total_table_samples > 0:
            report_lines.append(f"  Estimated Samples in Tables: {total_table_samples}")
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
    
    # Detailed Findings Section
    report_lines.append("=" * 80)
    report_lines.append("DETAILED FINDINGS")
    report_lines.append("=" * 80)
    report_lines.append("")
    
    # COA Pages Details
    report_lines.append("COA/LAB REPORT PAGES:")
    report_lines.append("-" * 80)
    if unique_coa_pages:
        for page in unique_coa_pages:
            report_lines.append(f"  Page {page}: Contains COA/laboratory report indicators")
            text = text_by_page.get(page, "")
            if text:
                coa_match = re.search(r'(?:COA|Certificate of Analysis|certificate of analysis|laboratory report|lab report)', 
                                     text, re.IGNORECASE)
                if coa_match:
                    start = max(0, coa_match.start() - 100)
                    end = min(len(text), coa_match.end() + 200)
                    snippet = text[start:end].replace('\n', ' ').strip()
                    report_lines.append(f"    Context: ...{snippet}...")
    else:
        report_lines.append("  No pages found with explicit COA/lab report keywords.")
        report_lines.append("  Note: Testing data may be present without these specific terms.")
    report_lines.append("")
    
    # Sample IDs - show top ones
    report_lines.append("EXTRACTED SAMPLE/ITEM IDs (First 200):")
    report_lines.append("-" * 80)
    sorted_ids = sorted(all_sample_ids, key=lambda x: (len(x), x))
    for sample_id in sorted_ids[:200]:
        locations = sample_id_locations[sample_id]
        pages = sorted(set([loc['page'] for loc in locations]))
        report_lines.append(f"  {sample_id}: Found on pages {', '.join(map(str, pages[:10]))}" + 
                          (f" (and {len(pages)-10} more)" if len(pages) > 10 else ""))
    
    if len(sorted_ids) > 200:
        report_lines.append(f"  ... and {len(sorted_ids) - 200} more sample IDs")
    report_lines.append("")
    
    # Testing Tables Details
    if testing_tables:
        report_lines.append("TESTING TABLES/SUBSAMPLES:")
        report_lines.append("-" * 80)
        for item in testing_tables[:20]:  # First 20
            report_lines.append(f"  Page {item['page']}:")
            info = item['info']
            if info.get('has_subsamples'):
                report_lines.append("    - Contains subsamples")
            if info.get('has_test_runs'):
                report_lines.append("    - Contains test runs")
            if info.get('sample_count', 0) > 0:
                report_lines.append(f"    - Estimated {info['sample_count']} samples in table")
        
        if len(testing_tables) > 20:
            report_lines.append(f"  ... and {len(testing_tables) - 20} more pages with tables")
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
        for item in sampling_protocols[:10]:  # First 10
            report_lines.append(f"  Page {item['page']}:")
            for protocol in item['protocols']:
                report_lines.append(f"    Found: {protocol['term']}")
                context = protocol['context'][:200]
                report_lines.append(f"    Context: ...{context}...")
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
    report_lines.append("Pages with Testing Tables:")
    for page in table_pages:
        report_lines.append(f"  {Path(pdf_path).name} - Page {page}")
    report_lines.append("")
    
    # Additional Analysis
    report_lines.append("=" * 80)
    report_lines.append("ADDITIONAL ANALYSIS")
    report_lines.append("=" * 80)
    report_lines.append("")
    
    # Check if testing represents all seized material
    all_text = ' '.join(text_by_page.values())
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
    
    # Complete sample ID list
    report_lines.append("=" * 80)
    report_lines.append("COMPLETE SAMPLE ID LIST")
    report_lines.append("=" * 80)
    report_lines.append("")
    for sample_id in sorted(all_sample_ids, key=lambda x: (len(x), x)):
        locations = sample_id_locations[sample_id]
        pages = sorted(set([loc['page'] for loc in locations]))
        report_lines.append(f"{sample_id} (pages: {', '.join(map(str, pages))})")
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
    
    report = audit_pdf_enhanced(pdf_path)
    
    if report:
        # Save report
        output_file = "FORENSIC_LAB_AUDIT_REPORT_ENHANCED.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print("\n" + "=" * 80)
        print(f"Enhanced audit complete! Report saved to: {output_file}")
        print("=" * 80)
        
        # Print summary to console
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
















