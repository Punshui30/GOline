"""Talking points generator for case results."""

from typing import Dict, List, Optional

from .models import CaseResult, RuleMatch
from .rules import load_rules


# Category priority order
CATEGORY_PRIORITY = {
    "pc_odor": 1,
    "identity": 2,
    "sampling": 3,
    "method_gc_ms": 4,
    "method_total_thc": 5,
    "method_presumptive": 6,
    "method_device": 7,
    "thca_flower": 8,
    "context": 9,
}


def get_category_priority(category: str) -> int:
    """Get priority for a category (lower number = higher priority)."""
    return CATEGORY_PRIORITY.get(category, 99)


def generate_talking_points(case_result: CaseResult, rules: Optional[List] = None) -> str:
    """
    Given a CaseResult (with its list of RuleMatch objects),
    return a formatted, attorney-ready set of talking points.
    
    Talking points are grouped by category and include short
    plain-English explanations for each hit rule.
    
    Args:
        case_result: CaseResult object with matches.
        rules: Optional list of Rule objects to get accurate categories.
               If not provided, will load rules or infer from rule_id.
    
    Returns:
        Formatted Markdown string with talking points.
    """
    if not case_result.matches:
        return "## No Issues Detected\n\nNo bad science indicators were found in this case."
    
    # Load rules if not provided
    if rules is None:
        try:
            rules = load_rules()
        except Exception:
            rules = None
    
    # Create rule_id to category mapping if we have rules
    rule_category_map: Dict[str, str] = {}
    if rules:
        for rule in rules:
            rule_category_map[rule.id] = rule.category
    
    # Group matches by category
    matches_by_category: Dict[str, List[RuleMatch]] = {}
    for match in case_result.matches:
        # Get category from rule if available, otherwise infer
        if match.rule_id in rule_category_map:
            category = rule_category_map[match.rule_id]
        else:
            category = infer_category_from_rule_id(match.rule_id)
        if category not in matches_by_category:
            matches_by_category[category] = []
        matches_by_category[category].append(match)
    
    # Sort categories by priority
    sorted_categories = sorted(
        matches_by_category.keys(),
        key=lambda c: (get_category_priority(c), c)
    )
    
    # Build output
    lines = []
    lines.append(f"# Talking Points for Case: {case_result.case_id}\n")
    lines.append(f"**Total Score:** {case_result.total_score}\n")
    
    for category in sorted_categories:
        matches = matches_by_category[category]
        category_title = format_category_title(category)
        lines.append(f"\n## {category_title}\n")
        
        for match in matches:
            # Add excerpt if available
            if match.excerpts:
                excerpt = match.excerpts[0]
                # Clean up excerpt (remove extra whitespace)
                excerpt = " ".join(excerpt.split())
                if len(excerpt) > 300:
                    excerpt = excerpt[:300] + "..."
                lines.append(f"- **Excerpt:** \"{excerpt}\"")
            
            # Generate talking point based on rule
            talking_point = generate_rule_talking_point(match)
            lines.append(f"- **Talking Point:** {talking_point}")
            lines.append("")
    
    return "\n".join(lines)


def infer_category_from_rule_id(rule_id: str) -> str:
    """Infer category from rule ID."""
    rule_id_lower = rule_id.lower()
    
    if "pc_odor" in rule_id_lower:
        return "pc_odor"
    elif "identity" in rule_id_lower or rule_id_lower.startswith("r1_") or rule_id_lower.startswith("r2_") or rule_id_lower.startswith("r3_"):
        return "identity"
    elif "sampling" in rule_id_lower or rule_id_lower.startswith("r4_") or rule_id_lower.startswith("r5_") or rule_id_lower.startswith("r6_") or rule_id_lower.startswith("r7_"):
        return "sampling"
    elif "gc_ms" in rule_id_lower or rule_id_lower.startswith("r8_"):
        return "method_gc_ms"
    elif "total_thc" in rule_id_lower or rule_id_lower.startswith("r9_"):
        return "method_total_thc"
    elif "presumptive" in rule_id_lower or rule_id_lower.startswith("r10_"):
        return "method_presumptive"
    elif "lightlab" in rule_id_lower or "device" in rule_id_lower or rule_id_lower.startswith("r11_"):
        return "method_device"
    elif "thca" in rule_id_lower or "flower" in rule_id_lower or rule_id_lower.startswith("r12_") or rule_id_lower.startswith("r13_") or rule_id_lower.startswith("r14_") or rule_id_lower.startswith("r15_"):
        return "thca_flower"
    elif "context" in rule_id_lower:
        return "context"
    else:
        return "other"


def format_category_title(category: str) -> str:
    """Format category name for display."""
    title_map = {
        "pc_odor": "Probable Cause / Odor-Based Search",
        "identity": "Identity / Hemp vs Marijuana",
        "sampling": "Sampling",
        "method_gc_ms": "Test Methods / GC-MS",
        "method_total_thc": "Test Methods / Total THC Formula",
        "method_presumptive": "Test Methods / Presumptive Testing",
        "method_device": "Test Methods / Unvalidated Devices",
        "thca_flower": "THCA Flower / Pre-harvest COA",
        "context": "Context",
        "other": "Other Issues",
    }
    return title_map.get(category, category.replace("_", " ").title())


def generate_rule_talking_point(match: RuleMatch) -> str:
    """Generate a talking point for a specific rule match."""
    rule_id = match.rule_id
    
    # Custom talking points for specific rules
    talking_points = {
        "R_PC_ODOR_MJ": "Odor cannot distinguish hemp from illegal marijuana; post-hemp and post-legalization, odor alone is insufficient to establish probable cause.",
        "R1_identity_not_determined": "The state must establish illegal marijuana, not simply plant material. The lab did not determine hemp vs marijuana.",
        "R2_identity_by_odor_or_appearance": "Identity based on odor or appearance alone is unreliable and cannot differentiate hemp from marijuana.",
        "R3_no_quantitative_thc": "Without quantitative THC measurement, the state cannot prove the material exceeds the 0.3% THC threshold for marijuana.",
        "R4_non_quantitative_sampling": "Random or non-quantitative sampling undermines any conclusions about the entire seizure.",
        "R5_subset_only": "Only a subset of items was tested, without a validated sampling plan. Results cannot be extrapolated to untested items.",
        "R6_no_homogenization": "Lack of homogenization makes results unrepresentative when multiple items or composite samples are involved.",
        "R7_aggregate_weight_without_sampling": "Aggregate weight is invalid unless hemp vs marijuana and representativeness are first established.",
        "R8_gc_ms_used": "GC-MS can decarboxylate THCA during analysis, artificially inflating THC measurements.",
        "R9_total_thc_formula": "The total THC formula is predictive, not a direct measurement. It assumes conversion that may not occur.",
        "R10_presumptive_only": "Presumptive tests are not confirmatory and cannot establish identity or quantity.",
        "R11_lightlab_used": "Handheld devices like LightLab are not validated forensic methods and produce unreliable results.",
        "R12_thca_flower_case": "This case involves THCA or hemp flower, where pre-harvest COA compliance controls legality.",
        "R13_preharvest_coa": "Pre-harvest COA is the governing compliance check under hemp rules, not post-seizure testing.",
        "R14_sold_as_hemp": "The material was represented as hemp at sale, supporting a theory of lawful purchase.",
        "R15_enforcement_manufactured_illegality": "The product was lawful hemp at harvest and only deemed illegal due to post-seizure testing choices.",
    }
    
    # Use custom talking point if available, otherwise use explanation
    if rule_id in talking_points:
        return talking_points[rule_id]
    else:
        # Use the explanation from the match, possibly enhanced
        return match.explanation

