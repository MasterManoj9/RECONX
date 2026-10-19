"""ReconX Deterministic Reconciliation Engine.

Detects discrepancies between eCRF and Central Laboratory datasets
with full auditability, source traceability, and human review states.
"""

from __future__ import annotations

import math
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
from pydantic import BaseModel, Field

# Core required columns for schema validation
REQUIRED_ECRF_COLUMNS = [
    "study_id",
    "site_id",
    "participant_id",
    "visit_name",
    "sample_id",
    "collection_date",
    "analyte_name",
    "reported_value",
    "unit",
]

REQUIRED_LAB_COLUMNS = [
    "study_id",
    "site_id",
    "participant_id",
    "visit_name",
    "sample_id",
    "collection_date",
    "analyte_name",
    "lab_value",
    "unit",
]

# Standard date formats supported for deterministic parsing
DATE_FORMATS = [
    "%Y-%m-%d",
    "%m/%d/%Y",
    "%d/%m/%Y",
    "%Y/%m/%d",
    "%Y-%m-%d %H:%M:%S",
]


class Discrepancy(BaseModel):
    id: str = Field(..., description="Unique finding identifier")
    rule_id: str = Field(..., description="Deterministic rule identifier")
    rule_name: str = Field(..., description="Human-readable rule name")
    category: str = Field(..., description="Classification category")
    priority: str = Field(..., description="Operational review priority: HIGH, MEDIUM, LOW")
    key: Dict[str, str] = Field(..., description="Compound key (study_id, participant_id, sample_id)")
    site_id: Optional[str] = None
    visit_name: Optional[str] = None
    analyte_name: Optional[str] = None
    ecrf_value: Optional[Any] = None
    lab_value: Optional[Any] = None
    ecrf_raw: Optional[Dict[str, Any]] = None
    lab_raw: Optional[Dict[str, Any]] = None
    explanation: str = Field(..., description="Factual evidence describing the detected condition")
    recommended_action: str = Field(..., description="Suggested operational review step")
    status: str = Field(default="OPEN", description="Review status: OPEN, RESOLVED, DISMISSED")
    reviewer_notes: Optional[str] = None
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None


class ReconciliationSummary(BaseModel):
    total_ecrf_records: int
    total_lab_records: int
    matched_records: int
    total_discrepancies: int
    discrepancies_by_rule: Dict[str, int]
    discrepancies_by_priority: Dict[str, int]
    discrepancies_by_category: Dict[str, int]


class ReconciliationResult(BaseModel):
    summary: ReconciliationSummary
    discrepancies: List[Discrepancy]


def _clean_str(val: Any) -> str:
    if val is None or pd.isna(val):
        return ""
    return str(val).strip()


def _is_empty(val: Any) -> bool:
    if val is None:
        return True
    if pd.isna(val):
        return True
    s = str(val).strip()
    return s == "" or s.lower() == "nan" or s.lower() == "null" or s.lower() == "none"


def _parse_date(date_str: Any) -> Optional[datetime]:
    if _is_empty(date_str):
        return None
    s = str(date_str).strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


def validate_dataframe(df: pd.DataFrame, source_name: str, required_columns: List[str]) -> Tuple[bool, List[str]]:
    """Validate DataFrame structure, non-emptiness, and required headers."""
    errors: List[str] = []
    if df is None or df.empty:
        errors.append(f"{source_name} file is empty.")
        return False, errors

    missing_cols = [c for c in required_columns if c not in df.columns]
    if missing_cols:
        errors.append(f"{source_name} is missing required columns: {', '.join(missing_cols)}")
        return False, errors

    return True, errors


def reconcile(
    ecrf_df: pd.DataFrame,
    lab_df: pd.DataFrame,
    numeric_tolerance: float = 0.001,
) -> ReconciliationResult:
    """Execute deterministic clinical reconciliation rules between eCRF and Central Lab datasets."""
    # Defensive copies with normalized column headers
    ecrf = ecrf_df.copy()
    lab = lab_df.copy()
    ecrf.columns = [str(c).strip().lower() for c in ecrf.columns]
    lab.columns = [str(c).strip().lower() for c in lab.columns]

    valid_ecrf, ecrf_errors = validate_dataframe(ecrf, "eCRF", REQUIRED_ECRF_COLUMNS)
    valid_lab, lab_errors = validate_dataframe(lab, "Central Lab", REQUIRED_LAB_COLUMNS)

    if not valid_ecrf or not valid_lab:
        all_errors = ecrf_errors + lab_errors
        raise ValueError(f"Validation failed: {'; '.join(all_errors)}")

    findings: List[Discrepancy] = []
    finding_counter = 1

    def next_id() -> str:
        nonlocal finding_counter
        fid = f"DISC-{finding_counter:04d}"
        finding_counter += 1
        return fid

    # Helper to construct compound key
    def make_key(row: pd.Series) -> Tuple[str, str, str]:
        return (
            _clean_str(row.get("study_id")),
            _clean_str(row.get("participant_id")),
            _clean_str(row.get("sample_id")),
        )

    # 1. Check for Duplicate Identifiers within each source
    ecrf_keys = [_clean_str(r.get("study_id")) + "::" + _clean_str(r.get("participant_id")) + "::" + _clean_str(r.get("sample_id")) for _, r in ecrf.iterrows()]
    lab_keys = [_clean_str(r.get("study_id")) + "::" + _clean_str(r.get("participant_id")) + "::" + _clean_str(r.get("sample_id")) for _, r in lab.iterrows()]

    ecrf_key_counts = pd.Series(ecrf_keys).value_counts()
    for key_str, count in ecrf_key_counts[ecrf_key_counts > 1].items():
        parts = key_str.split("::")
        key_dict = {"study_id": parts[0], "participant_id": parts[1], "sample_id": parts[2]}
        matching_rows = ecrf[
            (ecrf["study_id"].astype(str).str.strip() == parts[0])
            & (ecrf["participant_id"].astype(str).str.strip() == parts[1])
            & (ecrf["sample_id"].astype(str).str.strip() == parts[2])
        ]
        first_row = matching_rows.iloc[0].to_dict()
        findings.append(
            Discrepancy(
                id=next_id(),
                rule_id="RULE-DUP-ECRF",
                rule_name="Duplicate eCRF Identifier",
                category="Identifier Integrity",
                priority="HIGH",
                key=key_dict,
                site_id=str(first_row.get("site_id", "")),
                visit_name=str(first_row.get("visit_name", "")),
                analyte_name=str(first_row.get("analyte_name", "")),
                ecrf_value=f"{count} duplicate entries",
                lab_value=None,
                ecrf_raw=first_row,
                lab_raw=None,
                explanation=f"Compound key (Study: {parts[0]}, Participant: {parts[1]}, Sample: {parts[2]}) appears {count} times in eCRF records.",
                recommended_action="Inspect source eCRF entries with clinical data manager to verify repeat collection or eliminate duplicate submission.",
            )
        )

    lab_key_counts = pd.Series(lab_keys).value_counts()
    for key_str, count in lab_key_counts[lab_key_counts > 1].items():
        parts = key_str.split("::")
        key_dict = {"study_id": parts[0], "participant_id": parts[1], "sample_id": parts[2]}
        matching_rows = lab[
            (lab["study_id"].astype(str).str.strip() == parts[0])
            & (lab["participant_id"].astype(str).str.strip() == parts[1])
            & (lab["sample_id"].astype(str).str.strip() == parts[2])
        ]
        first_row = matching_rows.iloc[0].to_dict()
        findings.append(
            Discrepancy(
                id=next_id(),
                rule_id="RULE-DUP-LAB",
                rule_name="Duplicate Lab Identifier",
                category="Identifier Integrity",
                priority="HIGH",
                key=key_dict,
                site_id=str(first_row.get("site_id", "")),
                visit_name=str(first_row.get("visit_name", "")),
                analyte_name=str(first_row.get("analyte_name", "")),
                ecrf_value=None,
                lab_value=f"{count} duplicate entries",
                ecrf_raw=None,
                lab_raw=first_row,
                explanation=f"Compound key (Study: {parts[0]}, Participant: {parts[1]}, Sample: {parts[2]}) appears {count} times in Central Laboratory records.",
                recommended_action="Query Central Laboratory to clarify repeated accessioning or aliquot numbering.",
            )
        )

    # 2. Build index mappings for 1:1 cross-comparison (taking first occurrence for key)
    ecrf_dict: Dict[Tuple[str, str, str], Dict[str, Any]] = {}
    for _, row in ecrf.iterrows():
        k = make_key(row)
        if k not in ecrf_dict:
            ecrf_dict[k] = row.to_dict()

    lab_dict: Dict[Tuple[str, str, str], Dict[str, Any]] = {}
    for _, row in lab.iterrows():
        k = make_key(row)
        if k not in lab_dict:
            lab_dict[k] = row.to_dict()

    all_keys = set(ecrf_dict.keys()).union(set(lab_dict.keys()))
    matched_count = 0

    for key_tuple in sorted(all_keys):
        key_dict = {"study_id": key_tuple[0], "participant_id": key_tuple[1], "sample_id": key_tuple[2]}
        in_ecrf = key_tuple in ecrf_dict
        in_lab = key_tuple in lab_dict

        # Missing in Lab
        if in_ecrf and not in_lab:
            erow = ecrf_dict[key_tuple]
            findings.append(
                Discrepancy(
                    id=next_id(),
                    rule_id="RULE-MISSING-LAB",
                    rule_name="Missing in Central Lab",
                    category="Record Completeness",
                    priority="HIGH",
                    key=key_dict,
                    site_id=str(erow.get("site_id", "")),
                    visit_name=str(erow.get("visit_name", "")),
                    analyte_name=str(erow.get("analyte_name", "")),
                    ecrf_value=str(erow.get("reported_value", "")),
                    lab_value=None,
                    ecrf_raw=erow,
                    lab_raw=None,
                    explanation=f"Sample '{key_tuple[2]}' recorded in eCRF for participant '{key_tuple[1]}' has no matching accession record in Central Lab.",
                    recommended_action="Confirm sample shipment receipt with central laboratory manifest or verify if sample was collected.",
                )
            )
            continue

        # Missing in eCRF
        if in_lab and not in_ecrf:
            lrow = lab_dict[key_tuple]
            findings.append(
                Discrepancy(
                    id=next_id(),
                    rule_id="RULE-MISSING-ECRF",
                    rule_name="Missing in eCRF",
                    category="Record Completeness",
                    priority="HIGH",
                    key=key_dict,
                    site_id=str(lrow.get("site_id", "")),
                    visit_name=str(lrow.get("visit_name", "")),
                    analyte_name=str(lrow.get("analyte_name", "")),
                    ecrf_value=None,
                    lab_value=str(lrow.get("lab_value", "")),
                    ecrf_raw=None,
                    lab_raw=lrow,
                    explanation=f"Sample '{key_tuple[2]}' exists in Central Lab report, but no corresponding entry was found in eCRF.",
                    recommended_action="Investigate whether site clinical coordinator missed logging the sample collection in eCRF.",
                )
            )
            continue

        # Present in both -> Compare field-level integrity
        matched_count += 1
        erow = ecrf_dict[key_tuple]
        lrow = lab_dict[key_tuple]

        ecrf_date_raw = erow.get("collection_date")
        lab_date_raw = lrow.get("collection_date")
        ecrf_dt = _parse_date(ecrf_date_raw)
        lab_dt = _parse_date(lab_date_raw)

        # Date validation check
        if not _is_empty(ecrf_date_raw) and ecrf_dt is None:
            findings.append(
                Discrepancy(
                    id=next_id(),
                    rule_id="RULE-INVALID-DATE",
                    rule_name="Invalid eCRF Collection Date",
                    category="Data Quality",
                    priority="MEDIUM",
                    key=key_dict,
                    site_id=str(erow.get("site_id", "")),
                    visit_name=str(erow.get("visit_name", "")),
                    analyte_name=str(erow.get("analyte_name", "")),
                    ecrf_value=str(ecrf_date_raw),
                    lab_value=str(lab_date_raw),
                    ecrf_raw=erow,
                    lab_raw=lrow,
                    explanation=f"eCRF collection date '{ecrf_date_raw}' does not conform to standard ISO/clinical date formats.",
                    recommended_action="Request site correction of malformed collection timestamp.",
                )
            )
        elif not _is_empty(lab_date_raw) and lab_dt is None:
            findings.append(
                Discrepancy(
                    id=next_id(),
                    rule_id="RULE-INVALID-DATE",
                    rule_name="Invalid Lab Collection Date",
                    category="Data Quality",
                    priority="MEDIUM",
                    key=key_dict,
                    site_id=str(lrow.get("site_id", "")),
                    visit_name=str(lrow.get("visit_name", "")),
                    analyte_name=str(lrow.get("analyte_name", "")),
                    ecrf_value=str(ecrf_date_raw),
                    lab_value=str(lab_date_raw),
                    ecrf_raw=erow,
                    lab_raw=lrow,
                    explanation=f"Central Lab collection date '{lab_date_raw}' is invalid or cannot be parsed.",
                    recommended_action="Query Central Lab for corrected accession timestamp.",
                )
            )
        elif ecrf_dt and lab_dt and ecrf_dt.date() != lab_dt.date():
            # Date mismatch
            findings.append(
                Discrepancy(
                    id=next_id(),
                    rule_id="RULE-DATE-MISMATCH",
                    rule_name="Collection Date Mismatch",
                    category="Protocol Adherence",
                    priority="MEDIUM",
                    key=key_dict,
                    site_id=str(erow.get("site_id", "")),
                    visit_name=str(erow.get("visit_name", "")),
                    analyte_name=str(erow.get("analyte_name", "")),
                    ecrf_value=str(ecrf_date_raw),
                    lab_value=str(lab_date_raw),
                    ecrf_raw=erow,
                    lab_raw=lrow,
                    explanation=f"eCRF date '{ecrf_dt.date()}' differs from Central Lab date '{lab_dt.date()}'.",
                    recommended_action="Cross-reference tube barcode time and laboratory intake requisition.",
                )
            )

        # Analyte name match
        ecrf_analyte = _clean_str(erow.get("analyte_name"))
        lab_analyte = _clean_str(lrow.get("analyte_name"))
        if ecrf_analyte.lower() != lab_analyte.lower():
            findings.append(
                Discrepancy(
                    id=next_id(),
                    rule_id="RULE-ANALYTE-MISMATCH",
                    rule_name="Analyte Name Mismatch",
                    category="Analyte Concordance",
                    priority="HIGH",
                    key=key_dict,
                    site_id=str(erow.get("site_id", "")),
                    visit_name=str(erow.get("visit_name", "")),
                    analyte_name=f"{ecrf_analyte} vs {lab_analyte}",
                    ecrf_value=ecrf_analyte,
                    lab_value=lab_analyte,
                    ecrf_raw=erow,
                    lab_raw=lrow,
                    explanation=f"Analyte names diverge: eCRF has '{ecrf_analyte}' while Central Lab reports '{lab_analyte}'.",
                    recommended_action="Verify test requisition order code to ensure correct test panel mapping.",
                )
            )

        # Missing values check
        ecrf_val_raw = erow.get("reported_value")
        lab_val_raw = lrow.get("lab_value")
        ecrf_missing = _is_empty(ecrf_val_raw)
        lab_missing = _is_empty(lab_val_raw)

        if ecrf_missing and not lab_missing:
            findings.append(
                Discrepancy(
                    id=next_id(),
                    rule_id="RULE-MISSING-VALUE",
                    rule_name="Missing eCRF Value",
                    category="Data Completeness",
                    priority="MEDIUM",
                    key=key_dict,
                    site_id=str(erow.get("site_id", "")),
                    visit_name=str(erow.get("visit_name", "")),
                    analyte_name=ecrf_analyte,
                    ecrf_value="[EMPTY]",
                    lab_value=str(lab_val_raw),
                    ecrf_raw=erow,
                    lab_raw=lrow,
                    explanation=f"eCRF reported value is blank/null while Lab recorded '{lab_val_raw}'.",
                    recommended_action="Request site coordinator to transcribe result from lab report to eCRF.",
                )
            )
        elif lab_missing and not ecrf_missing:
            findings.append(
                Discrepancy(
                    id=next_id(),
                    rule_id="RULE-MISSING-VALUE",
                    rule_name="Missing Lab Value",
                    category="Data Completeness",
                    priority="HIGH",
                    key=key_dict,
                    site_id=str(erow.get("site_id", "")),
                    visit_name=str(erow.get("visit_name", "")),
                    analyte_name=ecrf_analyte,
                    ecrf_value=str(ecrf_val_raw),
                    lab_value="[EMPTY]",
                    ecrf_raw=erow,
                    lab_raw=lrow,
                    explanation=f"Central Lab result is empty/pending while eCRF has '{ecrf_val_raw}'.",
                    recommended_action="Confirm if sample analysis is pending, hemolyzed, or cancelled by the lab.",
                )
            )

        # Unit mismatch
        ecrf_unit = _clean_str(erow.get("unit"))
        lab_unit = _clean_str(lrow.get("unit"))
        if ecrf_unit.lower() != lab_unit.lower() and not _is_empty(ecrf_unit) and not _is_empty(lab_unit):
            findings.append(
                Discrepancy(
                    id=next_id(),
                    rule_id="RULE-UNIT-MISMATCH",
                    rule_name="Unit of Measure Mismatch",
                    category="Analyte Concordance",
                    priority="HIGH",
                    key=key_dict,
                    site_id=str(erow.get("site_id", "")),
                    visit_name=str(erow.get("visit_name", "")),
                    analyte_name=ecrf_analyte,
                    ecrf_value=ecrf_unit,
                    lab_value=lab_unit,
                    ecrf_raw=erow,
                    lab_raw=lrow,
                    explanation=f"Unit divergence detected: eCRF is '{ecrf_unit}' vs Central Lab '{lab_unit}'. Direct comparison may lead to clinical misinterpretation.",
                    recommended_action="Harmonize reporting unit or apply validated clinical unit conversion factor.",
                )
            )

        # Numeric value discrepancy
        if not ecrf_missing and not lab_missing and ecrf_unit.lower() == lab_unit.lower():
            try:
                num_ecrf = float(ecrf_val_raw)
                num_lab = float(lab_val_raw)
                delta = abs(num_ecrf - num_lab)
                if delta > numeric_tolerance:
                    findings.append(
                        Discrepancy(
                            id=next_id(),
                            rule_id="RULE-VALUE-MISMATCH",
                            rule_name="Numeric Value Difference",
                            category="Value Consistency",
                            priority="HIGH" if delta > 1.0 else "MEDIUM",
                            key=key_dict,
                            site_id=str(erow.get("site_id", "")),
                            visit_name=str(erow.get("visit_name", "")),
                            analyte_name=ecrf_analyte,
                            ecrf_value=str(num_ecrf),
                            lab_value=str(num_lab),
                            ecrf_raw=erow,
                            lab_raw=lrow,
                            explanation=f"Value discrepancy: eCRF '{num_ecrf}' vs Lab '{num_lab}' (absolute difference: {delta:.4f} {ecrf_unit}).",
                            recommended_action="Audit source transcript and re-verify primary instrument export.",
                        )
                    )
            except (ValueError, TypeError):
                # Non-numeric comparison fallback
                str_ecrf = _clean_str(ecrf_val_raw)
                str_lab = _clean_str(lab_val_raw)
                if str_ecrf != str_lab:
                    findings.append(
                        Discrepancy(
                            id=next_id(),
                            rule_id="RULE-VALUE-MISMATCH",
                            rule_name="Text Value Mismatch",
                            category="Value Consistency",
                            priority="MEDIUM",
                            key=key_dict,
                            site_id=str(erow.get("site_id", "")),
                            visit_name=str(erow.get("visit_name", "")),
                            analyte_name=ecrf_analyte,
                            ecrf_value=str_ecrf,
                            lab_value=str_lab,
                            ecrf_raw=erow,
                            lab_raw=lrow,
                            explanation=f"Recorded textual values do not match: eCRF '{str_ecrf}' vs Lab '{str_lab}'.",
                            recommended_action="Inspect qualitative result notation across sources.",
                        )
                    )

    # Compile Summary
    by_rule: Dict[str, int] = {}
    by_priority: Dict[str, int] = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    by_category: Dict[str, int] = {}

    for f in findings:
        by_rule[f.rule_id] = by_rule.get(f.rule_id, 0) + 1
        by_priority[f.priority] = by_priority.get(f.priority, 0) + 1
        by_category[f.category] = by_category.get(f.category, 0) + 1

    summary = ReconciliationSummary(
        total_ecrf_records=len(ecrf),
        total_lab_records=len(lab),
        matched_records=matched_count,
        total_discrepancies=len(findings),
        discrepancies_by_rule=by_rule,
        discrepancies_by_priority=by_priority,
        discrepancies_by_category=by_category,
    )

    return ReconciliationResult(summary=summary, discrepancies=findings)
