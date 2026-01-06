"""Rule loading functionality."""

import json
from pathlib import Path
from typing import List

from .models import Rule


def load_rules(path: str = "rules_config.json") -> List[Rule]:
    """
    Load rules from a JSON configuration file.
    
    Args:
        path: Path to the JSON configuration file. If relative, searches
              in the package directory first, then current directory.
    
    Returns:
        List of Rule objects.
    
    Raises:
        FileNotFoundError: If the rules file cannot be found.
        ValueError: If the JSON is invalid or missing required fields.
    """
    # Try package directory first
    package_dir = Path(__file__).parent
    rules_path = package_dir / path
    
    if not rules_path.exists():
        # Try as absolute path or current directory
        rules_path = Path(path)
        if not rules_path.exists():
            raise FileNotFoundError(f"Rules file not found: {path}")
    
    with open(rules_path, 'r', encoding='utf-8') as f:
        rules_data = json.load(f)
    
    rules = []
    for rule_data in rules_data:
        # Validate required fields
        required_fields = ['id', 'label', 'category', 'severity', 
                          'keywords_any', 'keywords_all', 'keywords_not',
                          'flags', 'explanation']
        for field in required_fields:
            if field not in rule_data:
                raise ValueError(f"Rule missing required field: {field}")
        
        rule = Rule(
            id=rule_data['id'],
            label=rule_data['label'],
            category=rule_data['category'],
            severity=rule_data['severity'],
            keywords_any=rule_data['keywords_any'],
            keywords_all=rule_data['keywords_all'],
            keywords_not=rule_data['keywords_not'],
            flags=rule_data['flags'],
            explanation=rule_data['explanation']
        )
        rules.append(rule)
    
    return rules
















