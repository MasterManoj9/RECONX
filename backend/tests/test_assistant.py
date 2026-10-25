"""Tests for the optional AI / Rule-Based Explanation Assistant."""

import pytest
from fastapi.testclient import TestClient
from backend.assistant import FindingEvidencePayload, generate_explanation
from backend.main import app

client = TestClient(app)


def test_assistant_missing_lab_explanation():
    payload = FindingEvidencePayload(
        finding_id="DISC-0001",
        discrepancy_type="MISSING_LAB_RECORD",
        rule_triggered="RULE-MISSING-LAB-RECORD",
        study_id="RCX-001",
        participant_id="PT-101",
        sample_id="SMP-001",
        description="Sample SMP-001 recorded in eCRF is absent in Lab.",
        ecrf_evidence={"row_number": 2, "analyte": "Glucose", "value": "100.0", "unit": "mg/dL", "collection_date": "2026-03-01"},
        lab_evidence=None,
        is_missing_record=True,
    )
    explanation = generate_explanation(payload)
    assert explanation.finding_id == "DISC-0001"
    assert explanation.provider == "rule_based_clinical_assistant"
    assert "eCRF" in explanation.plain_language_summary
    assert len(explanation.supported_facts) >= 2
    assert len(explanation.hypotheses) >= 1
    assert "Cannot determine" in explanation.limitations_and_unsupported_claims
    assert "AI Assistance Notice" in explanation.disclaimer


def test_assistant_value_mismatch_explanation():
    payload = FindingEvidencePayload(
        finding_id="DISC-0002",
        discrepancy_type="VALUE_MISMATCH",
        rule_triggered="RULE-VALUE-MISMATCH",
        study_id="RCX-001",
        participant_id="PT-102",
        sample_id="SMP-002",
        description="Numeric value mismatch: 14.2 vs 18.0",
        ecrf_evidence={"row_number": 3, "analyte": "Hemoglobin", "value": "14.2", "unit": "g/dL", "collection_date": "2026-03-01"},
        lab_evidence={"row_number": 3, "analyte": "Hemoglobin", "value": "18.0", "unit": "g/dL", "collection_date": "2026-03-01"},
        is_missing_record=False,
    )
    explanation = generate_explanation(payload)
    assert "divergence" in explanation.plain_language_summary
    # Verified constraint: never decides clinical significance
    assert "Cannot determine clinical significance" in explanation.limitations_and_unsupported_claims


def test_assistant_api_endpoint():
    request_data = {
        "finding_id": "DISC-0003",
        "discrepancy_type": "UNIT_MISMATCH",
        "rule_triggered": "RULE-UNIT-MISMATCH",
        "study_id": "RCX-001",
        "participant_id": "PT-103",
        "sample_id": "SMP-003",
        "description": "Unit mismatch g/dL vs mg/dL",
        "ecrf_evidence": {"row_number": 4, "analyte": "Albumin", "value": "4.2", "unit": "g/dL"},
        "lab_evidence": {"row_number": 4, "analyte": "Albumin", "value": "42.0", "unit": "g/L"},
        "is_missing_record": False,
    }
    res = client.post("/api/assistant/explain", json=request_data)
    assert res.status_code == 200
    data = res.json()
    assert data["finding_id"] == "DISC-0003"
    assert "plain_language_summary" in data
    assert "hypotheses" in data
    assert "limitations_and_unsupported_claims" in data
    assert "disclaimer" in data


def test_assistant_malformed_request_fails_gracefully():
    bad_data = {
        "finding_id": "DISC-BAD",
        # Missing required discrepancy_type, rule_triggered, and description
    }
    res = client.post("/api/assistant/explain", json=bad_data)
    assert res.status_code == 422
