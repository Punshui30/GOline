"""Rule engine for analyzing case documents."""

import re
from typing import List

from .models import Rule, RuleMatch


class RuleEngine:
    """Engine that applies rules to text and generates matches."""
    
    def __init__(self, rules: List[Rule]):
        """
        Initialize the rule engine with a list of rules.
        
        Args:
            rules: List of Rule objects to apply.
        """
        self.rules = rules
    
    def analyze(self, text: str) -> List[RuleMatch]:
        """
        Analyze text against all rules and return matches.
        
        Args:
            text: The text to analyze (case-insensitive matching).
        
        Returns:
            List of RuleMatch objects for rules that matched.
        """
        text_lower = text.lower()
        matches = []
        
        for rule in self.rules:
            match = self._check_rule(rule, text, text_lower)
            if match:
                matches.append(match)
        
        return matches
    
    def _check_rule(self, rule: Rule, text: str, text_lower: str) -> RuleMatch | None:
        """
        Check if a rule matches the text.
        
        Args:
            rule: The rule to check.
            text: Original text (for excerpt extraction).
            text_lower: Lowercase text (for matching).
        
        Returns:
            RuleMatch if the rule matches, None otherwise.
        """
        # Check keywords_any (at least one must appear)
        if rule.keywords_any:
            any_found = False
            first_match_index = None
            first_match_keyword = None
            
            for keyword in rule.keywords_any:
                keyword_lower = keyword.lower()
                index = text_lower.find(keyword_lower)
                if index != -1:
                    any_found = True
                    if first_match_index is None or index < first_match_index:
                        first_match_index = index
                        first_match_keyword = keyword
            
            if not any_found:
                return None
        else:
            first_match_index = 0
            first_match_keyword = None
        
        # Check keywords_all (all must appear)
        if rule.keywords_all:
            for keyword in rule.keywords_all:
                if keyword.lower() not in text_lower:
                    return None
        
        # Check keywords_not (none should appear)
        if rule.keywords_not:
            for keyword in rule.keywords_not:
                if keyword.lower() in text_lower:
                    return None
        
        # Special handling for R5_subset_only: check for "only X of Y" patterns
        if rule.id == "R5_subset_only":
            # Look for patterns like "only 5 of 10" or "only [number] of [number]"
            subset_pattern = r'only\s+(\d+)\s+of\s+(\d+)'
            if not re.search(subset_pattern, text_lower):
                # If no explicit pattern, still match if "only" appears in context
                # but this is already covered by keywords_any
                pass
        
        # Rule matched - extract excerpts
        excerpts = self._extract_excerpts(text, text_lower, first_match_index, 
                                         first_match_keyword, rule)
        
        return RuleMatch(
            rule_id=rule.id,
            label=rule.label,
            severity=rule.severity,
            flags=rule.flags,
            explanation=rule.explanation,
            excerpts=excerpts
        )
    
    def _extract_excerpts(self, text: str, text_lower: str, match_index: int,
                         keyword: str | None, rule: Rule) -> List[str]:
        """
        Extract short excerpts around keyword matches.
        
        Args:
            text: Original text.
            text_lower: Lowercase text.
            match_index: Index of first match.
            keyword: The keyword that matched (if any).
            rule: The rule being matched.
        
        Returns:
            List of excerpt strings (up to 3 excerpts, ~200 chars each).
        """
        excerpts = []
        excerpt_length = 200
        
        # Find all occurrences of keywords for this rule
        keyword_indices = []
        search_keywords = rule.keywords_any if rule.keywords_any else [""]
        
        for kw in search_keywords[:3]:  # Limit to first 3 keywords
            if not kw:
                continue
            kw_lower = kw.lower()
            start = 0
            while True:
                index = text_lower.find(kw_lower, start)
                if index == -1:
                    break
                keyword_indices.append(index)
                start = index + 1
                if len(keyword_indices) >= 3:  # Limit to 3 matches
                    break
        
        # If no keyword indices found, use the match_index
        if not keyword_indices:
            keyword_indices = [match_index]
        
        # Extract excerpts around each match
        for idx in keyword_indices[:3]:  # Max 3 excerpts
            start = max(0, idx - excerpt_length // 2)
            end = min(len(text), idx + excerpt_length // 2)
            excerpt = text[start:end]
            
            # Clean up excerpt (remove leading/trailing whitespace)
            excerpt = excerpt.strip()
            if excerpt:
                excerpts.append(excerpt)
        
        return excerpts[:3]  # Return at most 3 excerpts
    
    @staticmethod
    def compute_score(matches: List[RuleMatch]) -> int:
        """
        Compute total score from a list of matches.
        
        Args:
            matches: List of RuleMatch objects.
        
        Returns:
            Sum of all match severities.
        """
        return sum(match.severity for match in matches)

