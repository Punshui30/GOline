"""CLI entrypoint for analyzing case documents."""

import argparse
import sys
from pathlib import Path

from .engine import RuleEngine
from .file_loader import load_text_from_file
from .models import CaseResult
from .output_utils import write_results_to_csv
from .rules import load_rules


def main():
    """Main CLI entrypoint."""
    parser = argparse.ArgumentParser(
        description="Analyze case documents for bad science indicators in cannabis/hemp/THCA cases."
    )
    parser.add_argument(
        '--input-dir',
        required=True,
        help='Directory containing case documents (.txt or .pdf files)'
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
    
    # Find all case files
    input_dir = Path(args.input_dir)
    if not input_dir.exists():
        print(f"Error: Input directory does not exist: {args.input_dir}", file=sys.stderr)
        sys.exit(1)
    
    case_files = []
    for ext in ['.txt', '.pdf']:
        case_files.extend(input_dir.rglob(f'*{ext}'))
    
    if not case_files:
        print(f"Warning: No .txt or .pdf files found in {args.input_dir}", file=sys.stderr)
    
    # Process each case
    results = []
    for case_file in case_files:
        try:
            print(f"Processing: {case_file.name}", file=sys.stderr)
            text = load_text_from_file(str(case_file))
            matches = engine.analyze(text)
            
            total_score = RuleEngine.compute_score(matches)
            
            result = CaseResult(
                case_id=case_file.stem,  # Filename without extension
                total_score=total_score,
                matches=matches
            )
            results.append(result)
        except Exception as e:
            print(f"Error processing {case_file.name}: {e}", file=sys.stderr)
            continue
    
    # Write CSV output
    write_results_to_csv(results, args.output_file)


if __name__ == '__main__':
    main()

