"""Data models for the bad science case finder."""

from dataclasses import dataclass
from typing import List, Dict, Any


@dataclass
class Rule:
    """Represents a rule for detecting bad science in case documents."""
    id: str
    label: str
    category: str
    severity: int  # 1–5
    keywords_any: list[str]
    keywords_all: list[str]
    keywords_not: list[str]
    flags: list[str]
    explanation: str


@dataclass
class RuleMatch:
    """Represents a match of a rule in a case document."""
    rule_id: str
    label: str
    severity: int
    flags: list[str]
    explanation: str
    excerpts: list[str]


@dataclass
class CaseResult:
    """Represents the analysis result for a single case."""
    case_id: str
    total_score: int
    matches: list[RuleMatch]
















