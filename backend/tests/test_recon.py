"""Automated test suite for ReconX deterministic reconciliation engine.

Tests all 11 discrepancy categories, normal matching, empty datasets,
and JSON serializability per Phase 1 specification.
"""

import json
import os
import pytest
import pandas as pd
from backend.recon import reconcile_data, reconcile, validate_dataframe, Finding, ReconciliationResult

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")


@pytest.fixture
def perfect_ecrf_df():
    return pd.DataFrame([
        {
            "study_id": "RCX-001",
            "participant_id": "PT-101",
            "sample_id": "SMP-001",
            "collection_date": "2026-03-01",
            "analyte": "Hemoglobin",
            "result_value": "14.2",
            "unit": "g/dL",
        },
        {
            "study_id": "RCX-001",
            "participant_id": "PT-102",
            "sample_id": "SMP-002",
            "collection_date": "2026-03-01",
            "analyte": "Glucose",
            "result_value": "95.0",
            "unit": "mg/dL",
        },
    ])


@pytest.fixture
def perfect_lab_df():
    return pd.DataFrame([
        {
            "study_id": "RCX-001",
            "participant_id": "PT-101",
            "sample_id": "SMP-001",
            "collection_date": "2026-03-01",
            "analyte": "Hemoglobin",
            "result_value": "14.2",
            "unit": "g/dL",
        },
        {
            "study_id": "RCX-001",
            "participant_id": "PT-102",
            "sample_id": "SMP-002",
            "collection_date": "2026-03-01",
            "analyte": "Glucose",
            "result_value": "95.0",
            "unit": "mg/dL",
        },
    ])


def test_normal_matching(perfect_ecrf_df, perfect_lab_df):
    res = reconcile_data(perfect_ecrf_df, perfect_lab_df)
    assert res["summary"]["total_ecrf_records"] == 2
    assert res["summary"]["total_lab_records"] == 2
    assert res["summary"]["matched_records"] == 2
    assert res["summary"]["total_discrepancies"] == 0
    assert len(res["discrepancies"]) == 0


def test_missing_records_both_sides(perfect_ecrf_df, perfect_lab_df):
    ecrf = perfect_ecrf_df.iloc[:1].copy()  # Only SMP-001
    lab = perfect_lab_df.iloc[1:].copy()   # Only SMP-002

    res = reconcile_data(ecrf, lab)
    assert res["summary"]["matched_records"] == 0
    types = [d["discrepancy_type"] for d in res["discrepancies"]]
    assert "MISSING_LAB_RECORD" in types
    assert "MISSING_ECRF_RECORD" in types


def test_duplicate_keys(perfect_ecrf_df, perfect_lab_df):
    # Duplicate first record in eCRF
    ecrf_dups = pd.concat([perfect_ecrf_df, perfect_ecrf_df.iloc[:1]], ignore_index=True)
    res = reconcile_data(ecrf_dups, perfect_lab_df)
    dup_finding = next((d for d in res["discrepancies"] if d["discrepancy_type"] == "DUPLICATE_KEY"), None)
    assert dup_finding is not None
    assert dup_finding["sample_id"] == "SMP-001"
    assert "eCRF" in dup_finding["description"]


def test_date_mismatch(perfect_ecrf_df, perfect_lab_df):
    lab_date_mod = perfect_lab_df.copy()
    lab_date_mod.loc[0, "collection_date"] = "2026-03-05"

    res = reconcile_data(perfect_ecrf_df, lab_date_mod)
    mismatch = next((d for d in res["discrepancies"] if d["discrepancy_type"] == "DATE_MISMATCH"), None)
    assert mismatch is not None
    assert mismatch["severity"] == "MEDIUM"


def test_unit_mismatch(perfect_ecrf_df, perfect_lab_df):
    lab_unit_mod = perfect_lab_df.copy()
    lab_unit_mod.loc[0, "unit"] = "mmol/L"

    res = reconcile_data(perfect_ecrf_df, lab_unit_mod)
    unit_finding = next((d for d in res["discrepancies"] if d["discrepancy_type"] == "UNIT_MISMATCH"), None)
    assert unit_finding is not None
    assert unit_finding["severity"] == "HIGH"


def test_value_mismatch(perfect_ecrf_df, perfect_lab_df):
    lab_val_mod = perfect_lab_df.copy()
    lab_val_mod.loc[0, "result_value"] = "16.8"

    res = reconcile_data(perfect_ecrf_df, lab_val_mod)
    val_finding = next((d for d in res["discrepancies"] if d["discrepancy_type"] == "VALUE_MISMATCH"), None)
    assert val_finding is not None
    assert val_finding["severity"] == "HIGH"
    assert "14.2" in val_finding["description"]
    assert "16.8" in val_finding["description"]


def test_invalid_dates(perfect_ecrf_df, perfect_lab_df):
    ecrf_bad_date = perfect_ecrf_df.copy()
    ecrf_bad_date.loc[0, "collection_date"] = "2026-99-99"

    res = reconcile_data(ecrf_bad_date, perfect_lab_df)
    bad_date_finding = next((d for d in res["discrepancies"] if d["discrepancy_type"] == "INVALID_DATE"), None)
    assert bad_date_finding is not None
    assert bad_date_finding["sample_id"] == "SMP-001"


def test_invalid_numeric_value(perfect_ecrf_df, perfect_lab_df):
    lab_bad_num = perfect_lab_df.copy()
    lab_bad_num.loc[0, "result_value"] = "ERROR_VAL"

    res = reconcile_data(perfect_ecrf_df, lab_bad_num)
    bad_num_finding = next((d for d in res["discrepancies"] if d["discrepancy_type"] == "INVALID_NUMERIC_VALUE"), None)
    assert bad_num_finding is not None
    assert "ERROR_VAL" in bad_num_finding["description"]


def test_missing_identifier(perfect_ecrf_df, perfect_lab_df):
    ecrf_missing_id = perfect_ecrf_df.copy()
    ecrf_missing_id.loc[0, "participant_id"] = ""

    res = reconcile_data(ecrf_missing_id, perfect_lab_df)
    id_finding = next((d for d in res["discrepancies"] if d["discrepancy_type"] == "MISSING_IDENTIFIER"), None)
    assert id_finding is not None
    assert "participant_id" in id_finding["description"]


def test_missing_value(perfect_ecrf_df, perfect_lab_df):
    ecrf_missing_val = perfect_ecrf_df.copy()
    ecrf_missing_val.loc[0, "result_value"] = ""

    res = reconcile_data(ecrf_missing_val, perfect_lab_df)
    missing_val_finding = next((d for d in res["discrepancies"] if d["discrepancy_type"] == "MISSING_VALUE"), None)
    assert missing_val_finding is not None


def test_analyte_mismatch(perfect_ecrf_df, perfect_lab_df):
    lab_diff_analyte = perfect_lab_df.copy()
    lab_diff_analyte.loc[0, "analyte"] = "Hematocrit"

    res = reconcile_data(perfect_ecrf_df, lab_diff_analyte)
    analyte_finding = next((d for d in res["discrepancies"] if d["discrepancy_type"] == "ANALYTE_MISMATCH"), None)
    assert analyte_finding is not None
    assert "Hematocrit" in analyte_finding["description"]


def test_empty_datasets():
    empty_df = pd.DataFrame(columns=["study_id", "participant_id", "sample_id", "collection_date", "analyte", "result_value", "unit"])
    sample_df = pd.DataFrame([{
        "study_id": "RCX-001",
        "participant_id": "PT-101",
        "sample_id": "SMP-001",
        "collection_date": "2026-03-01",
        "analyte": "Hemoglobin",
        "result_value": "14.2",
        "unit": "g/dL",
    }])
    with pytest.raises(ValueError) as exc:
        reconcile_data(empty_df, sample_df)
    assert "file is empty" in str(exc.value)


def test_input_dataframes_not_mutated(perfect_ecrf_df, perfect_lab_df):
    ecrf_copy = perfect_ecrf_df.copy()
    lab_copy = perfect_lab_df.copy()

    reconcile_data(perfect_ecrf_df, perfect_lab_df)

    pd.testing.assert_frame_equal(perfect_ecrf_df, ecrf_copy)
    pd.testing.assert_frame_equal(perfect_lab_df, lab_copy)


def test_json_serializability(perfect_ecrf_df, perfect_lab_df):
    res = reconcile_data(perfect_ecrf_df, perfect_lab_df)
    json_str = json.dumps(res)
    assert json_str is not None
    parsed = json.loads(json_str)
    assert "summary" in parsed
    assert "discrepancies" in parsed
    assert "reconciliation_metadata" in parsed
    assert "source_row_counts" in parsed


def test_synthetic_csv_files_phase1():
    ecrf_path = os.path.join(DATA_DIR, "ecrf.csv")
    lab_path = os.path.join(DATA_DIR, "lab_results.csv")

    assert os.path.exists(ecrf_path)
    assert os.path.exists(lab_path)

    ecrf_df = pd.read_csv(ecrf_path, dtype=str)
    lab_df = pd.read_csv(lab_path, dtype=str)

    res = reconcile_data(ecrf_df, lab_df)

    assert res["summary"]["total_ecrf_records"] == 22
    assert res["summary"]["total_lab_records"] == 21
    assert res["summary"]["matched_records"] >= 15

    types = set(d["discrepancy_type"] for d in res["discrepancies"])
    assert "MISSING_IDENTIFIER" in types
    assert "DUPLICATE_KEY" in types
    assert "MISSING_ECRF_RECORD" in types
    assert "MISSING_LAB_RECORD" in types
    assert "INVALID_DATE" in types
    assert "DATE_MISMATCH" in types
    assert "ANALYTE_MISMATCH" in types
    assert "MISSING_VALUE" in types
    assert "INVALID_NUMERIC_VALUE" in types
    assert "UNIT_MISMATCH" in types
    assert "VALUE_MISMATCH" in types
