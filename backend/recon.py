"""ReconX Deterministic Reconciliation Engine.

Detects discrepancies between eCRF and Central Laboratory clinical datasets
with deterministic rules, full auditability, explicit evidence, and human review status.
"""

from __future__ import annotations

import datetime
from typing import Any, Dict, List, Optional, Tuple, Union
import pandas as pd
from pydantic import BaseModel, Field

# Core required fields per Phase 1 specification
REQUIRED_FIELDS = [
    "study_id",
    "participant_id",
    "sample_id",
    "collection_date",
    "analyte",
    "result_value",
    "unit",
]

# Supported explicit date formats
SUPPORTED_DATE_FORMATS = [
    "%Y-%m-%d",
    "%m/%d/%Y",
    "%d/%m/%Y",
    "%Y/%m/%d",
    "%Y-%m-%d %H:%M:%S",
]

DEFAULT_NUMERIC_TOLERANCE = 0.001


class Finding(BaseModel):
    finding_id: str = Field(..., description="Unique finding identifier")
    discrepancy_type: str = Field(..., description="Standard discrepancy category")
    study_id: Optional[str] = None
    participant_id: Optional[str] = None
    sample_id: Optional[str] = None
    severity: str = Field(..., description="Operational review priority: HIGH, MEDIUM, LOW")
    description: str = Field(..., description="Clear explanation of the detected condition")
    ecrf_evidence: Optional[Dict[str, Any]] = Field(None, description="Source eCRF values and row index")
    lab_evidence: Optional[Dict[str, Any]] = Field(None, description="Source Lab values and row index")
    rule_triggered: str = Field(..., description="Deterministic rule ID and name")
    suggested_investigation_step: str = Field(..., description="Actionable recommendation for human reviewer")
    review_status: str = Field(default="Needs Review", description="Human review status")


# Backwards compatibility alias for Discrepancy
Discrepancy = Finding


class ReconciliationSummary(BaseModel):
    total_ecrf_records: int
    total_lab_records: int
    matched_records: int
    total_discrepancies: int
    discrepancies_by_category: Dict[str, int]
    discrepancies_by_priority: Dict[str, int]
    discrepancies_by_rule: Dict[str, int]


class ReconciliationResult(BaseModel):
    summary: ReconciliationSummary
    discrepancies: List[Finding]
    reconciliation_metadata: Dict[str, Any] = Field(default_factory=dict)
    source_row_counts: Dict[str, int] = Field(default_factory=dict)


def _is_empty_or_na(val: Any) -> bool:
    if val is None:
        return True
    if pd.isna(val):
        return True
    s = str(val).strip()
    return s == "" or s.lower() in ("nan", "null", "none")


def _clean_str(val: Any) -> str:
    if _is_empty_or_na(val):
        return ""
    return str(val).strip()


def _parse_date(date_val: Any) -> Tuple[Optional[datetime.date], bool]:
    """Parse date explicitly. Returns (parsed_date, is_invalid_flag)."""
    if _is_empty_or_na(date_val):
        return None, False  # Empty/missing is handled by missing value rule or flagged separately
    s = str(date_val).strip()
    for fmt in SUPPORTED_DATE_FORMATS:
        try:
            return datetime.datetime.strptime(s, fmt).date(), False
        except ValueError:
            continue
    return None, True  # Malformed date


def _parse_numeric(val: Any) -> Tuple[Optional[float], bool]:
    """Parse float explicitly. Returns (parsed_float, is_invalid_flag)."""
    if _is_empty_or_na(val):
        return None, False
    s = str(val).strip().replace(",", "")
    try:
        return float(s), False
    except ValueError:
        return None, True


def validate_dataframe(
    df: pd.DataFrame, source_name: str, required_columns: Optional[List[str]] = None
) -> Tuple[bool, List[str]]:
    """Validate DataFrame structure, non-emptiness, and required headers."""
    if required_columns is None:
        required_columns = REQUIRED_FIELDS

    errors: List[str] = []
    if df is None or df.empty:
        errors.append(f"{source_name} file is empty.")
        return False, errors

    lower_cols = [str(c).strip().lower() for c in df.columns]
    missing_cols = [c for c in required_columns if c.lower() not in lower_cols]
    if missing_cols:
        errors.append(f"{source_name} is missing required columns: {', '.join(missing_cols)}")
        return False, errors

    return True, errors


def reconcile_data(
    ecrf_df: pd.DataFrame,
    lab_df: pd.DataFrame,
    numeric_tolerance: float = DEFAULT_NUMERIC_TOLERANCE,
) -> Dict[str, Any]:
    """Execute deterministic clinical reconciliation rules between eCRF and Central Lab datasets.

    Returns a JSON-serializable dictionary per Phase 1 specification.
    """
    # Verify inputs are not mutated
    ecrf = ecrf_df.copy()
    lab = lab_df.copy()

    # Normalize column names for matching (handling alias columns if passed)
    ecrf_col_map = {str(c).strip().lower(): c for c in ecrf.columns}
    lab_col_map = {str(c).strip().lower(): c for c in lab.columns}

    # Column aliases to support both Phase 1 and legacy headers
    def get_val(row: pd.Series, *field_candidates: str) -> Any:
        for f in field_candidates:
            if f in row:
                return row[f]
            # case-insensitive check
            for orig_col in row.index:
                if str(orig_col).strip().lower() == f.lower():
                    return row[orig_col]
        return None

    # Schema validation
    valid_ecrf, ecrf_errs = validate_dataframe(ecrf, "eCRF")
    valid_lab, lab_errs = validate_dataframe(lab, "Central Lab")

    # If missing required columns, check if legacy columns exist (e.g. reported_value / lab_value)
    if not valid_ecrf:
        # Check if analyte_name and reported_value exist
        if "analyte_name" in ecrf_col_map and "reported_value" in ecrf_col_map:
            valid_ecrf = True
            ecrf_errs = []
    if not valid_lab:
        if "analyte_name" in lab_col_map and "lab_value" in lab_col_map:
            valid_lab = True
            lab_errs = []

    if not valid_ecrf or not valid_lab:
        raise ValueError(f"Validation error: {'; '.join(ecrf_errs + lab_errs)}")

    findings: List[Finding] = []
    finding_idx = 1

    def make_finding_id() -> str:
        nonlocal finding_idx
        fid = f"DISC-{finding_idx:04d}"
        finding_idx += 1
        return fid

    # 1. Row-level inspection for MISSING_IDENTIFIER and INVALID_DATE
    def process_source_row_integrity(
        df: pd.DataFrame, source_name: str, value_col_name: str
    ) -> List[Tuple[int, Optional[Tuple[str, str, str]], Dict[str, Any]]]:
        valid_keyed_rows: List[Tuple[int, Optional[Tuple[str, str, str]], Dict[str, Any]]] = []

        for row_idx, row in df.iterrows():
            source_row_num = int(row_idx) + 1  # 1-indexed row number
            s_id = get_val(row, "study_id")
            p_id = get_val(row, "participant_id")
            smp_id = get_val(row, "sample_id")
            c_date = get_val(row, "collection_date")
            analyte = get_val(row, "analyte", "analyte_name")
            val = get_val(row, "result_value", value_col_name)
            unit = get_val(row, "unit")

            evidence_dict = {
                "source": source_name,
                "row_number": source_row_num,
                "study_id": s_id,
                "participant_id": p_id,
                "sample_id": smp_id,
                "collection_date": c_date,
                "analyte": analyte,
                "value": val,
                "unit": unit,
            }

            # Check for MISSING_IDENTIFIER
            missing_ids = []
            if _is_empty_or_na(s_id):
                missing_ids.append("study_id")
            if _is_empty_or_na(p_id):
                missing_ids.append("participant_id")
            if _is_empty_or_na(smp_id):
                missing_ids.append("sample_id")

            if missing_ids:
                findings.append(
                    Finding(
                        finding_id=make_finding_id(),
                        discrepancy_type="MISSING_IDENTIFIER",
                        study_id=_clean_str(s_id) or None,
                        participant_id=_clean_str(p_id) or None,
                        sample_id=_clean_str(smp_id) or None,
                        severity="HIGH",
                        description=f"{source_name} record at row {source_row_num} is missing required identifier(s): {', '.join(missing_ids)}.",
                        ecrf_evidence=evidence_dict if source_name == "eCRF" else None,
                        lab_evidence=evidence_dict if source_name == "Central Lab" else None,
                        rule_triggered="RULE-MISSING-IDENTIFIER",
                        suggested_investigation_step=f"Audit source {source_name} log to populate mandatory identifiers.",
                    )
                )
                valid_keyed_rows.append((source_row_num, None, evidence_dict))
                continue

            # Check for INVALID_DATE
            parsed_dt, is_bad_dt = _parse_date(c_date)
            if is_bad_dt:
                findings.append(
                    Finding(
                        finding_id=make_finding_id(),
                        discrepancy_type="INVALID_DATE",
                        study_id=_clean_str(s_id),
                        participant_id=_clean_str(p_id),
                        sample_id=_clean_str(smp_id),
                        severity="MEDIUM",
                        description=f"{source_name} record at row {source_row_num} contains unparseable collection date '{c_date}'.",
                        ecrf_evidence=evidence_dict if source_name == "eCRF" else None,
                        lab_evidence=evidence_dict if source_name == "Central Lab" else None,
                        rule_triggered="RULE-INVALID-DATE",
                        suggested_investigation_step="Correct date formatting to standard ISO YYYY-MM-DD.",
                    )
                )

            # Check for INVALID_NUMERIC_VALUE when non-empty
            if not _is_empty_or_na(val):
                _, is_bad_num = _parse_numeric(val)
                if is_bad_num:
                    findings.append(
                        Finding(
                            finding_id=make_finding_id(),
                            discrepancy_type="INVALID_NUMERIC_VALUE",
                            study_id=_clean_str(s_id),
                            participant_id=_clean_str(p_id),
                            sample_id=_clean_str(smp_id),
                            severity="HIGH",
                            description=f"{source_name} record at row {source_row_num} contains non-numeric result value '{val}'.",
                            ecrf_evidence=evidence_dict if source_name == "eCRF" else None,
                            lab_evidence=evidence_dict if source_name == "Central Lab" else None,
                            rule_triggered="RULE-INVALID-NUMERIC-VALUE",
                            suggested_investigation_step="Inspect laboratory instrument transcript for data transcription errors.",
                        )
                    )

            compound_key = (_clean_str(s_id), _clean_str(p_id), _clean_str(smp_id))
            valid_keyed_rows.append((source_row_num, compound_key, evidence_dict))

        return valid_keyed_rows

    ecrf_processed = process_source_row_integrity(ecrf, "eCRF", "reported_value")
    lab_processed = process_source_row_integrity(lab, "Central Lab", "lab_value")

    # 2. Duplicate Key Detection
    ecrf_key_map: Dict[Tuple[str, str, str], List[Tuple[int, Dict[str, Any]]]] = {}
    for r_num, k, ev in ecrf_processed:
        if k:
            ecrf_key_map.setdefault(k, []).append((r_num, ev))

    lab_key_map: Dict[Tuple[str, str, str], List[Tuple[int, Dict[str, Any]]]] = {}
    for r_num, k, ev in lab_processed:
        if k:
            lab_key_map.setdefault(k, []).append((r_num, ev))

    for k, entries in ecrf_key_map.items():
        if len(entries) > 1:
            rows_str = ", ".join(str(e[0]) for e in entries)
            findings.append(
                Finding(
                    finding_id=make_finding_id(),
                    discrepancy_type="DUPLICATE_KEY",
                    study_id=k[0],
                    participant_id=k[1],
                    sample_id=k[2],
                    severity="HIGH",
                    description=f"Duplicate compound key (Study: {k[0]}, Participant: {k[1]}, Sample: {k[2]}) found in eCRF at rows [{rows_str}].",
                    ecrf_evidence=entries[0][1],
                    lab_evidence=None,
                    rule_triggered="RULE-DUPLICATE-KEY",
                    suggested_investigation_step="Review site data entry logs to identify and remove duplicated record.",
                )
            )

    for k, entries in lab_key_map.items():
        if len(entries) > 1:
            rows_str = ", ".join(str(e[0]) for e in entries)
            findings.append(
                Finding(
                    finding_id=make_finding_id(),
                    discrepancy_type="DUPLICATE_KEY",
                    study_id=k[0],
                    participant_id=k[1],
                    sample_id=k[2],
                    severity="HIGH",
                    description=f"Duplicate compound key (Study: {k[0]}, Participant: {k[1]}, Sample: {k[2]}) found in Central Lab at rows [{rows_str}].",
                    ecrf_evidence=None,
                    lab_evidence=entries[0][1],
                    rule_triggered="RULE-DUPLICATE-KEY",
                    suggested_investigation_step="Clarify multiple aliquots or re-accessioning with central laboratory.",
                )
            )

    # 3. Cross-Source Matching & Record Presence
    all_keys = set(ecrf_key_map.keys()).union(set(lab_key_map.keys()))
    matched_count = 0

    for k in sorted(all_keys):
        in_ecrf = k in ecrf_key_map
        in_lab = k in lab_key_map

        if in_ecrf and not in_lab:
            ev = ecrf_key_map[k][0][1]
            findings.append(
                Finding(
                    finding_id=make_finding_id(),
                    discrepancy_type="MISSING_LAB_RECORD",
                    study_id=k[0],
                    participant_id=k[1],
                    sample_id=k[2],
                    severity="HIGH",
                    description=f"Sample '{k[2]}' recorded in eCRF (row {ev['row_number']}) is absent in Central Lab records.",
                    ecrf_evidence=ev,
                    lab_evidence=None,
                    rule_triggered="RULE-MISSING-LAB-RECORD",
                    suggested_investigation_step="Verify sample receipt in Central Lab accession manifest.",
                )
            )
            continue

        if in_lab and not in_ecrf:
            ev = lab_key_map[k][0][1]
            findings.append(
                Finding(
                    finding_id=make_finding_id(),
                    discrepancy_type="MISSING_ECRF_RECORD",
                    study_id=k[0],
                    participant_id=k[1],
                    sample_id=k[2],
                    severity="HIGH",
                    description=f"Sample '{k[2]}' received in Central Lab (row {ev['row_number']}) is missing from eCRF.",
                    ecrf_evidence=None,
                    lab_evidence=ev,
                    rule_triggered="RULE-MISSING-ECRF-RECORD",
                    suggested_investigation_step="Check if site clinical coordinator omitted logging sample collection.",
                )
            )
            continue

        # Present in both sources
        # If duplicates existed on either side, handle explicitly: flag the match count based on unique compound keys
        matched_count += 1
        e_entry = ecrf_key_map[k][0][1]
        l_entry = lab_key_map[k][0][1]

        # 4. Field-level Comparison Rules
        # A. Date comparison (date-only comparison)
        e_dt, e_bad_dt = _parse_date(e_entry["collection_date"])
        l_dt, l_bad_dt = _parse_date(l_entry["collection_date"])
        if e_dt and l_dt and e_dt != l_dt:
            findings.append(
                Finding(
                    finding_id=make_finding_id(),
                    discrepancy_type="DATE_MISMATCH",
                    study_id=k[0],
                    participant_id=k[1],
                    sample_id=k[2],
                    severity="MEDIUM",
                    description=f"Collection date mismatch: eCRF has {e_dt.isoformat()} while Lab has {l_dt.isoformat()}.",
                    ecrf_evidence=e_entry,
                    lab_evidence=l_entry,
                    rule_triggered="RULE-DATE-MISMATCH",
                    suggested_investigation_step="Cross-reference tube barcode timestamp against clinic intake sheet.",
                )
            )

        # B. Analyte comparison (conservative comparison)
        e_analyte = _clean_str(e_entry["analyte"])
        l_analyte = _clean_str(l_entry["analyte"])
        if e_analyte and l_analyte and e_analyte.lower() != l_analyte.lower():
            findings.append(
                Finding(
                    finding_id=make_finding_id(),
                    discrepancy_type="ANALYTE_MISMATCH",
                    study_id=k[0],
                    participant_id=k[1],
                    sample_id=k[2],
                    severity="HIGH",
                    description=f"Analyte names disagree: eCRF recorded '{e_analyte}' but Central Lab reported '{l_analyte}'.",
                    ecrf_evidence=e_entry,
                    lab_evidence=l_entry,
                    rule_triggered="RULE-ANALYTE-MISMATCH",
                    suggested_investigation_step="Review laboratory order code mapping for this protocol visit.",
                )
            )

        # C. Missing values check
        e_val_str = e_entry["value"]
        l_val_str = l_entry["value"]
        e_is_empty = _is_empty_or_na(e_val_str)
        l_is_empty = _is_empty_or_na(l_val_str)

        if e_is_empty and not l_is_empty:
            findings.append(
                Finding(
                    finding_id=make_finding_id(),
                    discrepancy_type="MISSING_VALUE",
                    study_id=k[0],
                    participant_id=k[1],
                    sample_id=k[2],
                    severity="MEDIUM",
                    description=f"eCRF result value is blank while Central Lab has '{l_val_str}'.",
                    ecrf_evidence=e_entry,
                    lab_evidence=l_entry,
                    rule_triggered="RULE-MISSING-VALUE",
                    suggested_investigation_step="Prompt clinical research coordinator to transcribe result value into eCRF.",
                )
            )
        elif l_is_empty and not e_is_empty:
            findings.append(
                Finding(
                    finding_id=make_finding_id(),
                    discrepancy_type="MISSING_VALUE",
                    study_id=k[0],
                    participant_id=k[1],
                    sample_id=k[2],
                    severity="HIGH",
                    description=f"Central Lab result is pending or empty while eCRF recorded '{e_val_str}'.",
                    ecrf_evidence=e_entry,
                    lab_evidence=l_entry,
                    rule_triggered="RULE-MISSING-VALUE",
                    suggested_investigation_step="Verify if lab sample was rejected, hemolyzed, or still in process.",
                )
            )

        # D. Unit comparison (conservative, no guessing conversions)
        e_unit = _clean_str(e_entry["unit"])
        l_unit = _clean_str(l_entry["unit"])
        unit_compatible = True
        if _is_empty_or_na(e_unit) or _is_empty_or_na(l_unit):
            unit_compatible = False
            findings.append(
                Finding(
                    finding_id=make_finding_id(),
                    discrepancy_type="UNIT_MISMATCH",
                    study_id=k[0],
                    participant_id=k[1],
                    sample_id=k[2],
                    severity="HIGH",
                    description=f"Missing or unspecified unit of measure (eCRF: '{e_unit}', Lab: '{l_unit}').",
                    ecrf_evidence=e_entry,
                    lab_evidence=l_entry,
                    rule_triggered="RULE-UNIT-MISMATCH",
                    suggested_investigation_step="Confirm standard protocol unit of measure before comparing values.",
                )
            )
        elif e_unit.lower() != l_unit.lower():
            unit_compatible = False
            findings.append(
                Finding(
                    finding_id=make_finding_id(),
                    discrepancy_type="UNIT_MISMATCH",
                    study_id=k[0],
                    participant_id=k[1],
                    sample_id=k[2],
                    severity="HIGH",
                    description=f"Unit mismatch: eCRF is '{e_unit}' vs Central Lab '{l_unit}'. Unverified unit conversion prohibited.",
                    ecrf_evidence=e_entry,
                    lab_evidence=l_entry,
                    rule_triggered="RULE-UNIT-MISMATCH",
                    suggested_investigation_step="Verify protocol specification for authorized unit conversion.",
                )
            )

        # E. Numeric value comparison (only when units are compatible and both values are valid numbers)
        if unit_compatible and not e_is_empty and not l_is_empty:
            e_num, e_num_bad = _parse_numeric(e_val_str)
            l_num, l_num_bad = _parse_numeric(l_val_str)

            if not e_num_bad and not l_num_bad and e_num is not None and l_num is not None:
                delta = abs(e_num - l_num)
                if delta > numeric_tolerance:
                    findings.append(
                        Finding(
                            finding_id=make_finding_id(),
                            discrepancy_type="VALUE_MISMATCH",
                            study_id=k[0],
                            participant_id=k[1],
                            sample_id=k[2],
                            severity="HIGH" if delta > 1.0 else "MEDIUM",
                            description=f"Numeric value mismatch: eCRF recorded {e_num} while Central Lab reported {l_num} (delta: {delta:.4f} {e_unit}, tolerance: {numeric_tolerance}).",
                            ecrf_evidence=e_entry,
                            lab_evidence=l_entry,
                            rule_triggered="RULE-VALUE-MISMATCH",
                            suggested_investigation_step="Investigate transcription or instrument calibration discrepancy.",
                        )
                    )

    # Compile Summary
    by_category: Dict[str, int] = {}
    by_priority: Dict[str, int] = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    by_rule: Dict[str, int] = {}

    for f in findings:
        by_category[f.discrepancy_type] = by_category.get(f.discrepancy_type, 0) + 1
        by_priority[f.severity] = by_priority.get(f.severity, 0) + 1
        by_rule[f.rule_triggered] = by_rule.get(f.rule_triggered, 0) + 1

    summary_dict = {
        "total_ecrf_records": len(ecrf),
        "total_lab_records": len(lab),
        "matched_records": matched_count,
        "total_discrepancies": len(findings),
        "discrepancies_by_category": by_category,
        "discrepancies_by_priority": by_priority,
        "discrepancies_by_rule": by_rule,
    }

    result = {
        "summary": summary_dict,
        "discrepancies": [f.model_dump() for f in findings],
        "source_row_counts": {
            "ecrf_rows": len(ecrf),
            "lab_rows": len(lab),
        },
        "reconciliation_metadata": {
            "engine_version": "1.0.0",
            "executed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "numeric_tolerance": numeric_tolerance,
            "matching_keys": ["study_id", "participant_id", "sample_id"],
        },
    }

    return result


def reconcile(
    ecrf_df: pd.DataFrame,
    lab_df: pd.DataFrame,
    numeric_tolerance: float = DEFAULT_NUMERIC_TOLERANCE,
) -> ReconciliationResult:
    """Object-based reconcile wrapper returning ReconciliationResult for backwards compatibility."""
    res_dict = reconcile_data(ecrf_df, lab_df, numeric_tolerance)
    summary = ReconciliationSummary(**res_dict["summary"])
    discrepancies = [Finding(**d) for d in res_dict["discrepancies"]]
    return ReconciliationResult(
        summary=summary,
        discrepancies=discrepancies,
        reconciliation_metadata=res_dict["reconciliation_metadata"],
        source_row_counts=res_dict["source_row_counts"],
    )
