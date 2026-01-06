"""CLI entrypoint for crawling and analyzing case documents from the web."""

import argparse
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

from .engine import RuleEngine
from .models import CaseResult
from .output_utils import write_results_to_csv
from .rules import load_rules
from .webfetch import SimpleCrawler, fetch_from_url_list


def sanitize_case_id(url: str) -> str:
    """
    Create a sanitized case_id from a URL.
    
    Args:
        url: URL to sanitize.
    
    Returns:
        Sanitized string suitable for use as a case_id.
    """
    parsed = urlparse(url)
    # Use path as base, remove leading/trailing slashes
    path = parsed.path.strip('/')
    # Replace slashes and other problematic chars with underscores
    path = re.sub(r'[^\w\-_.]', '_', path)
    # Remove multiple consecutive underscores
    path = re.sub(r'_+', '_', path)
    # Use filename if available, otherwise use path
    if path:
        # Take last component if it looks like a filename
        parts = path.split('/')
        if parts and '.' in parts[-1]:
            return parts[-1].rsplit('.', 1)[0]
        return path
    # Fallback to hostname
    return parsed.netloc.replace('.', '_')


def main():
    """Main CLI entrypoint."""
    parser = argparse.ArgumentParser(
        description="Crawl and analyze case documents from public web URLs."
    )
    
    # Create mutually exclusive group for modes
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument(
        '--start-url',
        help='Starting URL for crawling (Mode 1: crawl from index page)'
    )
    mode_group.add_argument(
        '--urls-file',
        help='Path to text file with URLs, one per line (Mode 2: fetch specific URLs)'
    )
    
    parser.add_argument(
        '--url-pattern',
        help='Substring to filter URLs when crawling (only used with --start-url)'
    )
    parser.add_argument(
        '--max-pages',
        type=int,
        default=50,
        help='Maximum number of pages to fetch (default: 50, only used with --start-url)'
    )
    parser.add_argument(
        '--output-file',
        required=True,
        help='Output CSV file path'
    )
    parser.add_argument(
        '--rules-config',
        default='rules_config.json',
        help='Path to rules configuration JSON file (default: rules_config.json)'
    )
    parser.add_argument(
        '--delay',
        type=float,
        default=0.5,
        help='Delay between requests in seconds (default: 0.5)'
    )
    
    args = parser.parse_args()
    
    # Load rules
    try:
        rules = load_rules(args.rules_config)
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except ValueError as e:
        print(f"Error loading rules: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Initialize engine
    engine = RuleEngine(rules)
    
    # Fetch documents based on mode
    documents = []
    
    if args.start_url:
        # Mode 1: Crawl from start URL
        print(f"Crawling from: {args.start_url}", file=sys.stderr)
        if args.url_pattern:
            print(f"Filtering URLs containing: {args.url_pattern}", file=sys.stderr)
        
        crawler = SimpleCrawler(
            max_pages=args.max_pages,
            delay_seconds=args.delay
        )
        
        documents = crawler.crawl_from_start(
            args.start_url,
            url_pattern_substring=args.url_pattern
        )
    
    elif args.urls_file:
        # Mode 2: Fetch from URL list
        urls_path = Path(args.urls_file)
        if not urls_path.exists():
            print(f"Error: URLs file does not exist: {args.urls_file}", file=sys.stderr)
            sys.exit(1)
        
        print(f"Reading URLs from: {args.urls_file}", file=sys.stderr)
        with open(urls_path, 'r', encoding='utf-8') as f:
            urls = [line.strip() for line in f if line.strip() and not line.strip().startswith('#')]
        
        if not urls:
            print(f"Error: No URLs found in {args.urls_file}", file=sys.stderr)
            sys.exit(1)
        
        print(f"Found {len(urls)} URLs to fetch", file=sys.stderr)
        documents = fetch_from_url_list(urls)
    
    if not documents:
        print("Warning: No documents were successfully fetched.", file=sys.stderr)
        sys.exit(0)
    
    # Analyze each document
    results = []
    for doc in documents:
        try:
            case_id = sanitize_case_id(doc.url)
            print(f"Analyzing: {case_id}", file=sys.stderr)
            
            matches = engine.analyze(doc.text)
            total_score = RuleEngine.compute_score(matches)
            
            result = CaseResult(
                case_id=case_id,
                total_score=total_score,
                matches=matches
            )
            results.append(result)
        except Exception as e:
            print(f"Error analyzing {doc.url}: {e}", file=sys.stderr)
            continue
    
    # Write CSV output
    write_results_to_csv(results, args.output_file)


if __name__ == '__main__':
    main()
















