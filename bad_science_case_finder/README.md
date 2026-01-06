# Bad Science Case Finder

A data-driven tool for analyzing legal case documents (appellate opinions, discovery, lab reports) in cannabis/hemp/THCA cases. This tool scans locally-stored documents and scores them using a rule engine to identify problematic scientific practices.

## Overview

This tool is designed to flag cannabis/hemp/THCA-related cases where:

- **Identity (hemp vs marijuana) is not properly determined** - Labs that fail to test for hemp vs marijuana differentiation, rely on appearance/odor only, or omit quantitative THC measurements.

- **Sampling and aggregation are scientifically invalid** - Random or non-quantitative sampling, testing only subsets without proper protocols, lack of homogenization, or using aggregate weight without valid sampling.

- **Methods are misused** - Use of GC-MS (which can decarboxylate THCA), total THC formulas (predictive rather than measured), presumptive-only testing, or unvalidated devices like LightLab.

- **THCA flower that was lawful at harvest is being criminalized** - Cases involving THCA/hemp flower where pre-harvest COA compliance should control, or where enforcement-manufactured illegality is occurring.

## Important Note

The tool supports two modes:
1. **Local file analysis** - Works on locally-stored case documents that you manually download and place in a folder.
2. **Web crawling** - Fetches and analyzes publicly accessible case documents directly from the web (see "Crawling public case pages" section below).

## Installation

1. Install dependencies:

```bash
pip install -r requirements.txt
```

Or using pip directly:

```bash
pip install pdfplumber requests beautifulsoup4 lxml streamlit pandas
```

## Usage

### Basic Command

```bash
python -m bad_science_case_finder.analyze_cases \
  --input-dir /path/to/cases \
  --output-file bad_science_results.csv
```

### Arguments

- `--input-dir` (required): Directory containing case documents (.txt or .pdf files). The tool will recursively search all subdirectories.
- `--output-file` (required): Path to the output CSV file.
- `--rules-config` (optional): Path to rules configuration JSON file. Defaults to `rules_config.json` in the package directory.

### Example

```bash
# Process all cases in the cases/ directory
python -m bad_science_case_finder.analyze_cases \
  --input-dir ./cases \
  --output-file results/bad_science_results.csv
```

## Fetching Specific URLs

The tool can fetch and analyze case documents directly from publicly accessible web URLs. This feature respects `robots.txt` and only accesses publicly available content.

### Fetch a List of Specific URLs

Fetch and analyze a list of specific URLs from a text file:

```bash
python -m bad_science_case_finder.crawl_and_analyze \
  --urls-file urls.txt \
  --output-file web_results.csv
```

**Arguments:**
- `--urls-file` (required): Path to a text file containing URLs, one per line
- `--output-file` (required): Path to output CSV file
- `--delay` (optional, default: 0.5): Delay between requests in seconds
- `--rules-config` (optional): Path to rules configuration JSON file

**URLs file format:**
```
https://example.com/case1.pdf
https://example.com/case2.html
# Comments start with #
https://example.com/case3.pdf
```

### Important Notes on Web Fetching

- **Public access only**: The tool only fetches publicly accessible URLs. It does not attempt to bypass CAPTCHAs, logins, or paywalls.
- **Robots.txt compliance**: The tool respects `robots.txt` files. If a URL is disallowed by `robots.txt`, it will be skipped with a warning.
- **Error handling**: The tool handles errors gracefully - if a request fails, content type is unsupported, or text extraction fails, it prints a warning and continues with the next URL.
- **Rate limiting**: The tool includes a configurable delay between requests to be respectful of web servers.
- **Content size limits**: Very large files (>50MB) are automatically skipped to prevent memory issues.

### Example Case URLs for Batch Analysis

Here are some confirmed working Maryland appellate opinion PDF URLs you can use for batch analysis:

```
https://www.mdcourts.gov/data/opinions/cosa/2025/1568s23.pdf
https://www.mdcourts.gov/data/opinions/cosa/2024/0068s23.pdf
https://www.mdcourts.gov/data/opinions/cosa/2024/0949s23.pdf
https://www.mdcourts.gov/data/opinions/cosa/2024/0289s22.pdf
https://www.mdcourts.gov/data/opinions/cosa/2023/1490s21.pdf
https://www.mdcourts.gov/data/opinions/cosa/2023/1061s21.pdf
https://www.mdcourts.gov/data/opinions/cosa/2023/0478s22.pdf
https://www.mdcourts.gov/data/opinions/coa/2023/1a23m.pdf
https://www.mdcourts.gov/data/opinions/coa/2023/37a22.pdf
https://www.mdcourts.gov/data/opinions/coa/2023/20a22.pdf
```

Copy and paste these URLs into the "Fetch specific URLs" mode in the web app for batch analysis.

## Web UI (Streamlit)

The tool includes a web-based user interface built with Streamlit that provides an easy-to-use browser interface for all analysis modes.

### Starting the Web App

1. Install all requirements (including Streamlit and pandas):

```bash
pip install -r requirements.txt
```

2. Run the Streamlit app:

```bash
streamlit run web_app.py
```

Your browser will automatically open to `http://localhost:8501` (or the next available port).

### Using the Web UI

The web interface provides the following modes accessible via the sidebar:

#### Mode 1: Analyze Uploaded Files

- **Description**: "Upload your own case PDFs/TXTs and I'll flag bad science issues."
- **Usage**: 
  - Click "Upload case files" and select one or more PDF or TXT files
  - Click "Run analysis"
  - View results in an interactive table sorted by severity score
  - Download full results as CSV
  - Expand each file to see detailed rule matches and excerpts

#### Mode 2: Crawl from a Web Page

- **Description**: "Point me at a public opinions index page; I'll crawl and analyze linked cases."
- **Usage**:
  - Enter a starting URL (e.g., `https://somecourt.gov/opinions/`)
  - Optionally specify a URL pattern filter (e.g., "opinion" or "pdf")
  - Set maximum pages to fetch (default: 50)
  - Click "Run crawl and analysis"
  - View results and download CSV

#### Mode 3: Fetch Specific URLs

- **Description**: "Paste specific case URLs to fetch and analyze."
- **Usage**:
  - Paste URLs in the text area (one per line)
  - Click "Run fetch and analysis"
  - View results and download CSV

### Features

- **Interactive Results Table**: Results are automatically sorted by total score (highest first) to highlight the worst cases
- **Detailed Views**: Expandable sections show rule matches, explanations, flags, and text excerpts for each document
- **CSV Download**: Download full results with all details in CSV format
- **Progress Indicators**: Real-time progress bars and status messages during processing
- **Error Handling**: Graceful error handling with warnings for failed URLs or files

### Important Notes

- The Streamlit upload limit is increased to ~5GB (5000MB). This is configured in `.streamlit/config.toml`. **You must restart Streamlit** for this change to take effect. To adjust further, modify `maxUploadSize` in `.streamlit/config.toml` and restart.
- The web app respects `robots.txt` when fetching URLs (via the underlying crawler)
- It only accesses publicly available content and does not attempt to bypass CAPTCHAs, logins, or paywalls
- The app is intended to help identify cannabis/hemp/THCA cases with:
  - Hemp vs marijuana identity failures
  - Sampling/aggregation issues
  - Misuse of GC-MS, presumptive tests, or LightLab
  - THCA flower being criminalized by post-seizure testing

## Output Format

The tool generates a CSV file with the following columns:

- `case_id`: Filename (without extension) for local files, or sanitized URL for web-fetched documents
- `total_score`: Sum of all matched rule severities (1-5 per rule)
- `matched_rule_ids`: Semicolon-separated list of matched rule IDs
- `matched_rule_labels`: Semicolon-separated list of matched rule labels
- `flags`: Semicolon-separated list of all unique flags from matched rules
- `details_json`: JSON string containing detailed information for each match:
  - `rule_id`: Rule identifier
  - `label`: Human-readable rule label
  - `severity`: Severity score (1-5)
  - `flags`: List of flags associated with the rule
  - `explanation`: Explanation of why this rule matters
  - `excerpts`: List of text excerpts (up to 3, ~200 chars each) showing where matches occurred

## Rule Categories

The tool includes 15 initial rules across four categories:

### Identity - Hemp vs Marijuana
- R1: Identity not determined
- R2: Identity based on appearance/odor only
- R3: No quantitative THC measurement

### Sampling
- R4: Non-quantitative / random sampling
- R5: Only subset of items tested
- R6: No homogenization
- R7: Aggregate weight without valid sampling

### Test Methods
- R8: GC-MS used for cannabinoid quantitation
- R9: Total THC formula applied
- R10: Presumptive-only testing
- R11: LightLab device used

### THCA Flower / Pre-harvest COA / Enforcement-Manufactured Illegality
- R12: THCA flower / hemp flower case
- R13: Pre-harvest COA / 30-day rule present
- R14: Product purchased/sold as hemp
- R15: Enforcement-manufactured illegality language

## Extending Rules

To add new rules, edit `rules_config.json` and add a new rule object with the following structure:

```json
{
  "id": "R16_your_rule_id",
  "label": "Your rule label",
  "category": "category_name",
  "severity": 5,
  "keywords_any": ["keyword1", "keyword2"],
  "keywords_all": [],
  "keywords_not": [],
  "flags": ["flag1", "flag2"],
  "explanation": "Explanation of why this rule matters."
}
```

- `keywords_any`: At least one of these keywords must appear (case-insensitive)
- `keywords_all`: All of these keywords must appear (case-insensitive)
- `keywords_not`: None of these keywords should appear (case-insensitive)
- `severity`: Integer from 1-5 indicating the severity of the issue

## Project Structure

```
bad_science_case_finder/
├── __init__.py              # Package initialization
├── models.py                # Dataclasses (Rule, RuleMatch, CaseResult)
├── rules.py                 # Rule loading from JSON
├── rules_config.json        # Rule definitions
├── engine.py                # Rule engine that applies rules to text
├── file_loader.py           # Load .txt and .pdf files
├── output_utils.py          # Shared CSV writing utilities
├── analyze_cases.py         # CLI entrypoint for local files
├── crawl_and_analyze.py     # CLI entrypoint for web crawling
├── webfetch/                # Web fetching package
│   ├── __init__.py
│   └── crawler.py           # Web crawler implementation
├── requirements.txt         # Python dependencies
└── README.md                # This file

web_app.py                   # Streamlit web UI entrypoint (project root)
```

## Requirements

- Python 3.10+
- pdfplumber (for PDF support)
- requests (for web fetching)
- beautifulsoup4 (for HTML parsing)
- lxml (for HTML parsing)
- streamlit (for web UI)
- pandas (for data handling in web UI)

## License

This tool is designed for expert witness work in cannabis/hemp/THCA legal cases.

