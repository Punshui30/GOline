"""Streamlit web UI for Bad Science Case Finder."""

import io
import sys
from io import BytesIO
from pathlib import Path

import pandas as pd
import streamlit as st

# Add the parent directory to the path so we can import the package
sys.path.insert(0, str(Path(__file__).parent))

from bad_science_case_finder.engine import RuleEngine
from bad_science_case_finder.models import CaseResult
from bad_science_case_finder.rules import load_rules
from bad_science_case_finder.talking_points import generate_talking_points
from bad_science_case_finder.webfetch.crawler import SimpleCrawler, fetch_from_url_list

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False


# Page configuration
st.set_page_config(
    page_title="Bad Science Case Finder",
    page_icon="🔬",
    layout="wide"
)

# Title and description
st.title("🔬 Bad Science Case Finder")
st.markdown("""
This tool analyzes cannabis/hemp/THCA legal case documents to flag problematic scientific practices, including:
- **Identity failures**: Labs that don't properly determine hemp vs marijuana
- **Invalid sampling**: Random/non-quantitative sampling, missing homogenization
- **Method misuse**: GC-MS, presumptive tests, or unvalidated devices like LightLab
- **Enforcement-manufactured illegality**: THCA flower criminalized by post-seizure testing
""")


@st.cache_data
def load_rules_cached(rules_config_path: str = None):
    """Load rules with caching."""
    try:
        # If no path provided, load_rules will look in the package directory first
        if rules_config_path is None:
            return load_rules()
        return load_rules(rules_config_path)
    except Exception as e:
        st.error(f"Error loading rules: {e}")
        return None


def extract_text_from_uploaded_file(uploaded_file) -> str:
    """
    Extract text from an uploaded file (PDF or TXT).
    
    Args:
        uploaded_file: Streamlit UploadedFile object.
    
    Returns:
        Extracted text as string.
    """
    if uploaded_file.name.lower().endswith('.txt'):
        try:
            return uploaded_file.read().decode('utf-8')
        except UnicodeDecodeError:
            return uploaded_file.read().decode('latin-1')
    
    elif uploaded_file.name.lower().endswith('.pdf'):
        if not PDFPLUMBER_AVAILABLE:
            raise ImportError("pdfplumber is required for PDF files")
        
        pdf_bytes = uploaded_file.read()
        pdf_file = BytesIO(pdf_bytes)
        
        text_parts = []
        with pdfplumber.open(pdf_file) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        
        return '\n\n'.join(text_parts)
    
    else:
        raise ValueError(f"Unsupported file type: {uploaded_file.name}")


def results_to_dataframe(results: list[CaseResult]) -> pd.DataFrame:
    """
    Convert a list of CaseResult objects to a pandas DataFrame.
    
    Args:
        results: List of CaseResult objects.
    
    Returns:
        DataFrame with columns: case_id, total_score, matched_rule_ids, 
        matched_rule_labels, flags.
    """
    rows = []
    for result in results:
        matched_rule_ids = ';'.join(m.rule_id for m in result.matches)
        matched_rule_labels = ';'.join(m.label for m in result.matches)
        
        # Collect all unique flags
        all_flags = set()
        for match in result.matches:
            all_flags.update(match.flags)
        flags_str = ';'.join(sorted(all_flags))
        
        rows.append({
            'case_id': result.case_id,
            'total_score': result.total_score,
            'matched_rule_ids': matched_rule_ids,
            'matched_rule_labels': matched_rule_labels,
            'flags': flags_str,
        })
    
    df = pd.DataFrame(rows)
    # Sort by total_score descending
    if not df.empty:
        df = df.sort_values('total_score', ascending=False)
    return df


def results_to_csv_bytes(results: list[CaseResult]) -> bytes:
    """
    Convert results to CSV bytes for download.
    
    Args:
        results: List of CaseResult objects.
    
    Returns:
        CSV content as bytes.
    """
    import csv
    import json
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'case_id',
        'total_score',
        'matched_rule_ids',
        'matched_rule_labels',
        'flags',
        'details_json'
    ])
    
    # Write rows
    for result in results:
        matched_rule_ids = ';'.join(m.rule_id for m in result.matches)
        matched_rule_labels = ';'.join(m.label for m in result.matches)
        
        # Collect all unique flags
        all_flags = set()
        for match in result.matches:
            all_flags.update(match.flags)
        flags_str = ';'.join(sorted(all_flags))
        
        # Build details JSON
        details = []
        for match in result.matches:
            details.append({
                'rule_id': match.rule_id,
                'label': match.label,
                'severity': match.severity,
                'flags': match.flags,
                'explanation': match.explanation,
                'excerpts': match.excerpts
            })
        details_json = json.dumps(details, ensure_ascii=False)
        
        writer.writerow([
            result.case_id,
            result.total_score,
            matched_rule_ids,
            matched_rule_labels,
            flags_str,
            details_json
        ])
    
    return output.getvalue().encode('utf-8')


def sanitize_url_for_case_id(url: str) -> str:
    """Create a sanitized case_id from a URL."""
    import re
    from urllib.parse import urlparse
    
    parsed = urlparse(url)
    path = parsed.path.strip('/')
    path = re.sub(r'[^\w\-_.]', '_', path)
    path = re.sub(r'_+', '_', path)
    
    if path:
        parts = path.split('/')
        if parts and '.' in parts[-1]:
            return parts[-1].rsplit('.', 1)[0]
        return path
    
    return parsed.netloc.replace('.', '_')


# Sidebar for mode selection
st.sidebar.title("Mode Selection")
mode = st.sidebar.radio(
    "Choose analysis mode:",
    [
        "Analyze uploaded files",
        "Generate Talking Points",
        "Fetch specific URLs"
    ],
    index=0
)

# Load rules (cached)
rules = load_rules_cached()
if rules is None:
    st.error("Failed to load rules. Please check your rules_config.json file.")
    st.stop()

engine = RuleEngine(rules)

# Mode 1: Analyze uploaded files
if mode == "Analyze uploaded files":
    st.header("📁 Analyze Uploaded Files")
    st.markdown("Upload your own case PDFs/TXTs and I'll flag bad science issues.")
    
    uploaded_files = st.file_uploader(
        "Upload case files (.pdf or .txt)",
        type=["pdf", "txt"],
        accept_multiple_files=True
    )
    
    if uploaded_files and st.button("Run analysis", type="primary"):
        results = []
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        for idx, uploaded_file in enumerate(uploaded_files):
            status_text.text(f"Processing {uploaded_file.name}...")
            progress_bar.progress((idx + 1) / len(uploaded_files))
            
            try:
                text = extract_text_from_uploaded_file(uploaded_file)
                matches = engine.analyze(text)
                total_score = RuleEngine.compute_score(matches)
                
                result = CaseResult(
                    case_id=uploaded_file.name,
                    total_score=total_score,
                    matches=matches
                )
                results.append(result)
            except Exception as e:
                st.warning(f"Error processing {uploaded_file.name}: {e}")
                continue
        
        progress_bar.empty()
        status_text.empty()
        
        if results:
            st.success(f"✅ Analyzed {len(results)} file(s)")
            
            # Display summary table
            df = results_to_dataframe(results)
            st.subheader("Summary Results")
            st.dataframe(df, use_container_width=True)
            
            # Download button
            csv_bytes = results_to_csv_bytes(results)
            st.download_button(
                label="Download full results as CSV",
                data=csv_bytes,
                file_name="bad_science_results.csv",
                mime="text/csv"
            )
            
            # Initialize talking points state if not present
            if "stored_talking_points" not in st.session_state:
                st.session_state["stored_talking_points"] = {}
            
            # Detailed view for each file
            st.subheader("Detailed Results")
            for result in results:
                with st.expander(f"📄 {result.case_id} (Score: {result.total_score})"):
                    if result.matches:
                        # Add talking points button
                        if st.button(f"Generate Talking Points", key=f"tp_{result.case_id}"):
                            talking_points = generate_talking_points(result, rules)
                            st.session_state["stored_talking_points"][result.case_id] = talking_points
                            st.rerun()
                        
                        # Display talking points if they exist in session state
                        if result.case_id in st.session_state.get("stored_talking_points", {}):
                            talking_points = st.session_state["stored_talking_points"][result.case_id]
                            st.markdown("---")
                            st.markdown("## 📝 Talking Points")
                            st.markdown(talking_points)
                            
                            # Download button for talking points
                            st.download_button(
                                label="Download Talking Points as .txt",
                                data=talking_points.encode('utf-8'),
                                file_name=f"{result.case_id}_talking_points.txt",
                                mime="text/plain",
                                key=f"dl_tp_{result.case_id}"
                            )
                        
                        for match in result.matches:
                            st.markdown(f"**{match.label}** (Severity: {match.severity})")
                            st.markdown(f"*{match.explanation}*")
                            st.markdown(f"**Flags:** {', '.join(match.flags)}")
                            
                            if match.excerpts:
                                st.markdown("**Excerpts:**")
                                for excerpt in match.excerpts:
                                    st.text(excerpt[:500] + "..." if len(excerpt) > 500 else excerpt)
                            st.divider()
                    else:
                        st.info("No bad science indicators found.")
        else:
            st.warning("No files were successfully processed.")

# Mode 2: Generate Talking Points
elif mode == "Generate Talking Points":
    st.header("📝 Generate Talking Points")
    st.markdown("Upload a single case file to generate attorney-ready talking points.")
    
    uploaded_file = st.file_uploader(
        "Upload case file (.pdf or .txt)",
        type=["pdf", "txt"],
        accept_multiple_files=False
    )
    
    if uploaded_file and st.button("Generate Talking Points", type="primary"):
        with st.spinner("Analyzing case and generating talking points..."):
            try:
                text = extract_text_from_uploaded_file(uploaded_file)
                matches = engine.analyze(text)
                total_score = RuleEngine.compute_score(matches)
                
                result = CaseResult(
                    case_id=uploaded_file.name,
                    total_score=total_score,
                    matches=matches
                )
                
                talking_points = generate_talking_points(result, rules)
                
                st.success("✅ Talking points generated!")
                st.markdown("---")
                st.markdown(talking_points)
                
                # Download button
                st.download_button(
                    label="Download Talking Points as .txt",
                    data=talking_points.encode('utf-8'),
                    file_name=f"{uploaded_file.name}_talking_points.txt",
                    mime="text/plain"
                )
                
            except Exception as e:
                st.error(f"Error processing file: {e}")

# Mode 3: Fetch specific URLs
elif mode == "Fetch specific URLs":
    st.header("🔗 Fetch Specific URLs")
    st.markdown("Paste specific case URLs to fetch and analyze.")
    
    # Initialize session_state if not present
    if "fetch_results" not in st.session_state:
        st.session_state["fetch_results"] = []
    
    urls_text = st.text_area(
        "Paste one URL per line (HTML or PDF):",
        height=200,
        placeholder="https://example.com/case1.pdf\nhttps://example.com/case2.html"
    )
    
    if st.button("Run fetch and analysis", type="primary"):
        if not urls_text or not urls_text.strip():
            st.error("Please provide at least one URL.")
        else:
            # Parse URLs
            urls = [
                line.strip()
                for line in urls_text.strip().split('\n')
                if line.strip() and not line.strip().startswith('#')
            ]
            
            if not urls:
                st.error("No valid URLs found.")
            else:
                st.info(f"Fetching {len(urls)} URL(s)...")
                
                with st.spinner("Fetching and analyzing..."):
                    try:
                        documents = fetch_from_url_list(urls)
                        
                        if not documents:
                            st.warning("No documents were fetched. Check the URLs and try again.")
                        else:
                            st.info(f"Fetched {len(documents)} document(s)")
                            
                            results = []
                            progress_bar = st.progress(0)
                            
                            for idx, doc in enumerate(documents):
                                progress_bar.progress((idx + 1) / len(documents))
                                
                                try:
                                    matches = engine.analyze(doc.text)
                                    total_score = RuleEngine.compute_score(matches)
                                    
                                    case_id = sanitize_url_for_case_id(doc.url)
                                    
                                    result = CaseResult(
                                        case_id=case_id,
                                        total_score=total_score,
                                        matches=matches
                                    )
                                    results.append(result)
                                except Exception as e:
                                    st.warning(f"Error analyzing {doc.url}: {e}")
                                    continue
                            
                            progress_bar.empty()
                            
                            if results:
                                # Store results in session_state for later use
                                fetch_results = []
                                for idx, (doc, result) in enumerate(zip(documents, results)):
                                    fetch_results.append({
                                        "case_id": result.case_id,
                                        "url": doc.url,
                                        "text": doc.text,
                                        "case_result": result,
                                    })
                                st.session_state["fetch_results"] = fetch_results
                                
                                st.success(f"✅ Analyzed {len(results)} document(s)")
                                
                                # Display summary table
                                df = results_to_dataframe(results)
                                st.subheader("Summary Results")
                                st.dataframe(df, use_container_width=True)
                                
                                # Download button
                                csv_bytes = results_to_csv_bytes(results)
                                st.download_button(
                                    label="Download full results as CSV",
                                    data=csv_bytes,
                                    file_name="bad_science_results.csv",
                                    mime="text/csv"
                                )
                                
                                # Initialize talking points state if not present
                                if "stored_talking_points" not in st.session_state:
                                    st.session_state["stored_talking_points"] = {}
                                
                                # Detailed view
                                st.subheader("Detailed Results")
                                for result in results:
                                    with st.expander(f"🌐 {result.case_id} (Score: {result.total_score})"):
                                        if result.matches:
                                            # Add talking points button
                                            if st.button(f"Generate Talking Points", key=f"tp_urls_{result.case_id}"):
                                                talking_points = generate_talking_points(result, rules)
                                                st.session_state["stored_talking_points"][result.case_id] = talking_points
                                                st.rerun()
                                            
                                            # Display talking points if they exist in session state
                                            if result.case_id in st.session_state.get("stored_talking_points", {}):
                                                talking_points = st.session_state["stored_talking_points"][result.case_id]
                                                st.markdown("---")
                                                st.markdown("## 📝 Talking Points")
                                                st.markdown(talking_points)
                                                
                                                # Download button for talking points
                                                st.download_button(
                                                    label="Download Talking Points as .txt",
                                                    data=talking_points.encode('utf-8'),
                                                    file_name=f"{result.case_id}_talking_points.txt",
                                                    mime="text/plain",
                                                    key=f"dl_tp_urls_{result.case_id}"
                                                )
                                            
                                            st.markdown("---")
                                            st.markdown("### Rule Matches")
                                            for match in result.matches:
                                                st.markdown(f"**{match.label}** (Severity: {match.severity})")
                                                st.markdown(f"*{match.explanation}*")
                                                st.markdown(f"**Flags:** {', '.join(match.flags)}")
                                                
                                                if match.excerpts:
                                                    st.markdown("**Excerpts:**")
                                                    for excerpt in match.excerpts:
                                                        st.text(excerpt[:500] + "..." if len(excerpt) > 500 else excerpt)
                                                st.divider()
                                        else:
                                            st.info("No bad science indicators found.")
                            else:
                                st.warning("No documents were successfully analyzed.")
                    
                    except Exception as e:
                        st.error(f"Error during fetching: {e}")
    
    # Display stored results if available (from previous fetch)
    if st.session_state.get("fetch_results"):
        st.markdown("---")
        st.subheader("📋 Previously Fetched Results")
        st.info(f"You have {len(st.session_state['fetch_results'])} case(s) stored from a previous fetch.")
        
        # Initialize talking points state if not present
        if "stored_talking_points" not in st.session_state:
            st.session_state["stored_talking_points"] = {}
        
        stored_results = [item["case_result"] for item in st.session_state["fetch_results"]]
        
        # Display summary table
        df = results_to_dataframe(stored_results)
        st.dataframe(df, use_container_width=True)
        
        # Detailed view with talking points
        st.subheader("Detailed Results")
        for fetch_item in st.session_state["fetch_results"]:
            result = fetch_item["case_result"]
            with st.expander(f"🌐 {result.case_id} (Score: {result.total_score})"):
                if result.matches:
                    # Add talking points button
                    if st.button(f"Generate Talking Points", key=f"tp_stored_{result.case_id}"):
                        talking_points = generate_talking_points(result, rules)
                        st.session_state["stored_talking_points"][result.case_id] = talking_points
                        st.rerun()
                    
                    # Display talking points if they exist in session state
                    if result.case_id in st.session_state.get("stored_talking_points", {}):
                        talking_points = st.session_state["stored_talking_points"][result.case_id]
                        st.markdown("---")
                        st.markdown("## 📝 Talking Points")
                        st.markdown(talking_points)
                        
                        # Download button for talking points
                        st.download_button(
                            label="Download Talking Points as .txt",
                            data=talking_points.encode('utf-8'),
                            file_name=f"{result.case_id}_talking_points.txt",
                            mime="text/plain",
                            key=f"dl_tp_stored_{result.case_id}"
                        )
                    
                    st.markdown("---")
                    st.markdown("### Rule Matches")
                    for match in result.matches:
                        st.markdown(f"**{match.label}** (Severity: {match.severity})")
                        st.markdown(f"*{match.explanation}*")
                        st.markdown(f"**Flags:** {', '.join(match.flags)}")
                        
                        if match.excerpts:
                            st.markdown("**Excerpts:**")
                            for excerpt in match.excerpts:
                                st.text(excerpt[:500] + "..." if len(excerpt) > 500 else excerpt)
                        st.divider()
                else:
                    st.info("No bad science indicators found.")
        
        # Clear stored results button
        if st.button("Clear Stored Results"):
            st.session_state["fetch_results"] = []
            st.session_state["stored_talking_points"] = {}
            st.rerun()

# Footer
st.divider()
st.markdown("""
<small>
**Note:** This tool respects robots.txt when crawling. It only accesses publicly available content 
and does not attempt to bypass CAPTCHAs, logins, or paywalls.
</small>
""", unsafe_allow_html=True)

