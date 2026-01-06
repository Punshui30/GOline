"""Shared utilities for writing analysis results to CSV."""

import csv
import json
import sys
from pathlib import Path
from typing import List, Set

from .models import CaseResult


def write_results_to_csv(results: List[CaseResult], output_file: str) -> None:
    """
    Write case results to a CSV file.
    
    Args:
        results: List of CaseResult objects.
        output_file: Path to output CSV file.
    """
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
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
            all_flags: Set[str] = set()
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
    
    print(f"\nAnalysis complete. Processed {len(results)} cases.", file=sys.stderr)
    print(f"Results written to: {output_path}", file=sys.stderr)
















