"""Automated test suite for ReconX deterministic reconciliation engine."""

import os
import pytest
import pandas as pd
from backend.recon import reconcile, validate_dataframe, Discrepancy, ReconciliationResult

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")


@pytest.fixture
def sample_ecrf_df():
    return pd.DataFrame([
        {
            "study_id": "STUDY-01",
            "site_id": "SITE-A",
            "participant_id": "PT-01",
            "visit_name": "V1",
            "sample_id": "SMP-01",
            "collection_date": "2026-01-10",
            "analyte_name": "Glucose",
            "reported_value": "100.0",
            "unit": "mg/dL",
        },
        {
            "study_id": "STUDY-01",
            "site_id": "SITE-A",
            "participant_id": "PT-02",
            "visit_name": "V1",
            "sample_id": "SMP-02",
            "collection_date": "2026-01-11",
            "analyte_name": "Hemoglobin",
            "reported_value": "14.0",
            "unit": "g/dL",
        },
    ])


@pytest.fixture
def sample_lab_df():
    return pd.DataFrame([
        {
            "study_id": "STUDY-01",
            "site_id": "SITE-A",
            "participant_id": "PT-01",
            "visit_name": "V1",
            "sample_id": "SMP-01",
            "collection_date": "2026-01-10",
            "analyte_name": "Glucose",
            "lab_value": "100.0",
            "unit": "mg/dL",
        },
        {
            "study_id": "STUDY-01",
            "site_id": "SITE-A",
            "participant_id": "PT-02",
            "visit_name": "V1",
            "sample_id": "SMP-02",
            "collection_date": "2026-01-11",
            "analyte_name": "Hemoglobin",
            "lab_value": "14.0",
            "unit": "g/dL",
        },
    ])


def test_perfect_match(sample_ecrf_df, sample_lab_df):
    res = reconcile(sample_ecrf_df, sample_lab_df)
    assert res.summary.matched_records == 2
    assert res.summary.total_discrepancies == 0
    assert len(res.discrepancies) == 0


def test_missing_in_lab(sample_ecrf_df, sample_lab_df):
    # Remove second record from lab
    lab_truncated = sample_lab_df.iloc[:1].copy()
    res = reconcile(sample_ecrf_df, lab_truncated)
    assert res.summary.matched_records == 1
    assert any(d.rule_id == "RULE-MISSING-LAB" and d.key["sample_id"] == "SMP-02" for d in res.discrepancies)


def test_missing_in_ecrf(sample_ecrf_df, sample_lab_df):
    # Remove first record from ecrf
    ecrf_truncated = sample_ecrf_df.iloc[1:].copy()
    res = reconcile(ecrf_truncated, sample_lab_df)
    assert res.summary.matched_records == 1
    assert any(d.rule_id == "RULE-MISSING-ECRF" and d.key["sample_id"] == "SMP-01" for d in res.discrepancies)


def test_duplicate_identifier(sample_ecrf_df, sample_lab_df):
    # Duplicate first record in ecrf
    ecrf_dups = pd.concat([sample_ecrf_df, sample_ecrf_df.iloc[:1]], ignore_index=True)
    res = reconcile(ecrf_dups, sample_lab_df)
    assert any(d.rule_id == "RULE-DUP-ECRF" for d in res.discrepancies)


def test_date_mismatch(sample_ecrf_df, sample_lab_df):
    lab_diff_date = sample_lab_df.copy()
    lab_diff_date.loc[0, "collection_date"] = "2026-01-15"
    res = reconcile(sample_ecrf_df, lab_diff_date)
    assert any(d.rule_id == "RULE-DATE-MISMATCH" for d in res.discrepancies)


def test_invalid_date(sample_ecrf_df, sample_lab_df):
    ecrf_bad_date = sample_ecrf_df.copy()
    ecrf_bad_date.loc[0, "collection_date"] = "INVALID-DATE-99"
    res = reconcile(ecrf_bad_date, sample_lab_df)
    assert any(d.rule_id == "RULE-INVALID-DATE" for d in res.discrepancies)


def test_analyte_mismatch(sample_ecrf_df, sample_lab_df):
    lab_diff_analyte = sample_lab_df.copy()
    lab_diff_analyte.loc[0, "analyte_name"] = "Fasting Glucose"
    res = reconcile(sample_ecrf_df, lab_diff_analyte)
    assert any(d.rule_id == "RULE-ANALYTE-MISMATCH" for d in res.discrepancies)


def test_missing_value(sample_ecrf_df, sample_lab_df):
    ecrf_missing_val = sample_ecrf_df.copy()
    ecrf_missing_val.loc[0, "reported_value"] = ""
    res = reconcile(ecrf_missing_val, sample_lab_df)
    assert any(d.rule_id == "RULE-MISSING-VALUE" and d.priority == "MEDIUM" for d in res.discrepancies)


def test_unit_mismatch(sample_ecrf_df, sample_lab_df):
    lab_diff_unit = sample_lab_df.copy()
    lab_diff_unit.loc[0, "unit"] = "mmol/L"
    res = reconcile(sample_ecrf_df, lab_diff_unit)
    assert any(d.rule_id == "RULE-UNIT-MISMATCH" for d in res.discrepancies)


def test_numeric_value_difference(sample_ecrf_df, sample_lab_df):
    lab_diff_val = sample_lab_df.copy()
    lab_diff_val.loc[0, "lab_value"] = "115.5"  # eCRF is 100.0
    res = reconcile(sample_ecrf_df, lab_diff_val)
    diff_finding = next((d for d in res.discrepancies if d.rule_id == "RULE-VALUE-MISMATCH"), None)
    assert diff_finding is not None
    assert diff_finding.priority == "HIGH"
    assert "100.0" in diff_finding.explanation
    assert "115.5" in diff_finding.explanation


def test_validation_fails_on_missing_column():
    bad_df = pd.DataFrame([{"study_id": "S1"}])
    good_df = pd.DataFrame([{"study_id": "S1", "site_id": "S", "participant_id": "P", "visit_name": "V", "sample_id": "SMP", "collection_date": "2026-01-01", "lab_value": 1, "unit": "U", "analyte_name": "A"}])
    with pytest.raises(ValueError) as exc:
        reconcile(bad_df, good_df)
    assert "missing required columns" in str(exc.value)


def test_full_synthetic_datasets():
    ecrf_path = os.path.join(DATA_DIR, "synthetic_ecrf.csv")
    lab_path = os.path.join(DATA_DIR, "synthetic_lab.csv")

    assert os.path.exists(ecrf_path), f"{ecrf_path} not found"
    assert os.path.exists(lab_path), f"{lab_path} not found"

    ecrf_df = pd.read_csv(ecrf_path)
    lab_df = pd.read_csv(lab_path)

    res = reconcile(ecrf_df, lab_df)
    assert res.summary.total_ecrf_records == 22
    assert res.summary.total_lab_records == 22
    assert res.summary.matched_records >= 15
    assert res.summary.total_discrepancies > 0

    rules_found = set(d.rule_id for d in res.discrepancies)
    assert "RULE-MISSING-LAB" in rules_found
    assert "RULE-MISSING-ECRF" in rules_found
    assert "RULE-DUP-ECRF" in rules_found
    assert "RULE-INVALID-DATE" in rules_found
    assert "RULE-DATE-MISMATCH" in rules_found
    assert "RULE-ANALYTE-MISMATCH" in rules_found
    assert "RULE-MISSING-VALUE" in rules_found
    assert "RULE-UNIT-MISMATCH" in rules_found
    assert "RULE-VALUE-MISMATCH" in rules_found
