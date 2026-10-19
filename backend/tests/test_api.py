"""Tests for ReconX FastAPI backend endpoints."""

import io
import os
import pytest
from fastapi.testclient import TestClient

from backend.main import app, store

client = TestClient(app)
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")


@pytest.fixture(autouse=True)
def clean_store():
    store.reconciliations.clear()
    store.audit_log.clear()


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_sample_data_catalog_and_download():
    # Test catalog
    cat_res = client.get("/api/sample-data")
    assert cat_res.status_code == 200
    datasets = cat_res.json()["sample_datasets"]
    assert len(datasets) == 2

    # Test download ecrf
    ecrf_dl = client.get("/api/sample-data/download/ecrf")
    assert ecrf_dl.status_code == 200
    assert "study_id" in ecrf_dl.text

    # Test download lab
    lab_dl = client.get("/api/sample-data/download/lab")
    assert lab_dl.status_code == 200
    assert "study_id" in lab_dl.text

    # Test download invalid
    inv_dl = client.get("/api/sample-data/download/unknown")
    assert inv_dl.status_code == 400


def test_reconcile_endpoint_valid_files():
    ecrf_content = (
        "study_id,participant_id,sample_id,collection_date,analyte,result_value,unit\n"
        "RCX-001,PT-101,SMP-001,2026-03-01,Hemoglobin,14.2,g/dL\n"
    )
    lab_content = (
        "study_id,participant_id,sample_id,collection_date,analyte,result_value,unit\n"
        "RCX-001,PT-101,SMP-001,2026-03-01,Hemoglobin,14.2,g/dL\n"
    )

    files = {
        "ecrf_file": ("ecrf.csv", io.BytesIO(ecrf_content.encode("utf-8")), "text/csv"),
        "lab_file": ("lab.csv", io.BytesIO(lab_content.encode("utf-8")), "text/csv"),
    }

    res = client.post("/api/reconcile", files=files)
    assert res.status_code == 200
    data = res.json()
    assert "reconciliation_id" in data
    assert data["summary"]["matched_records"] == 1
    assert data["summary"]["total_discrepancies"] == 0


def test_reconcile_endpoint_empty_file():
    files = {
        "ecrf_file": ("ecrf.csv", io.BytesIO(b""), "text/csv"),
        "lab_file": ("lab.csv", io.BytesIO(b"data"), "text/csv"),
    }
    res = client.post("/api/reconcile", files=files)
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()


def test_reconcile_endpoint_missing_columns():
    bad_content = "col_a,col_b\n1,2\n"
    good_content = (
        "study_id,participant_id,sample_id,collection_date,analyte,result_value,unit\n"
        "RCX-001,PT-101,SMP-001,2026-03-01,Hemoglobin,14.2,g/dL\n"
    )
    files = {
        "ecrf_file": ("ecrf.csv", io.BytesIO(bad_content.encode("utf-8")), "text/csv"),
        "lab_file": ("lab.csv", io.BytesIO(good_content.encode("utf-8")), "text/csv"),
    }
    res = client.post("/api/reconcile", files=files)
    assert res.status_code == 422
    assert "missing required columns" in res.json()["detail"].lower()


def test_reconcile_endpoint_non_csv_rejected():
    files = {
        "ecrf_file": ("ecrf.txt", io.BytesIO(b"data"), "text/plain"),
        "lab_file": ("lab.csv", io.BytesIO(b"data"), "text/csv"),
    }
    res = client.post("/api/reconcile", files=files)
    assert res.status_code == 400
    assert "csv" in res.json()["detail"].lower()


def test_get_reconciliation_by_id_and_export():
    # First upload to create a session
    ecrf_content = (
        "study_id,participant_id,sample_id,collection_date,analyte,result_value,unit\n"
        "RCX-001,PT-101,SMP-001,2026-03-01,Hemoglobin,14.2,g/dL\n"
        "RCX-001,PT-102,SMP-002,2026-03-01,Glucose,95.0,mg/dL\n"
    )
    lab_content = (
        "study_id,participant_id,sample_id,collection_date,analyte,result_value,unit\n"
        "RCX-001,PT-101,SMP-001,2026-03-01,Hemoglobin,14.2,g/dL\n"
        "RCX-001,PT-102,SMP-002,2026-03-01,Glucose,120.0,mg/dL\n"  # Value mismatch
    )
    files = {
        "ecrf_file": ("ecrf.csv", io.BytesIO(ecrf_content.encode("utf-8")), "text/csv"),
        "lab_file": ("lab.csv", io.BytesIO(lab_content.encode("utf-8")), "text/csv"),
    }
    res = client.post("/api/reconcile", files=files)
    recon_id = res.json()["reconciliation_id"]

    # Retrieve by ID
    get_res = client.get(f"/api/reconcile/{recon_id}")
    assert get_res.status_code == 200
    assert get_res.json()["reconciliation_id"] == recon_id

    # Test export CSV
    export_res = client.get(f"/api/export/{recon_id}")
    assert export_res.status_code == 200
    assert "Finding ID" in export_res.text
    assert "VALUE_MISMATCH" in export_res.text

    # Test 404 for unknown recon id
    not_found_res = client.get("/api/reconcile/REC-UNKNOWN")
    assert not_found_res.status_code == 404


def test_review_submission_and_audit():
    # Create session with discrepancy
    ecrf_content = (
        "study_id,participant_id,sample_id,collection_date,analyte,result_value,unit\n"
        "RCX-001,PT-101,SMP-001,2026-03-01,Hemoglobin,14.2,g/dL\n"
    )
    lab_content = (
        "study_id,participant_id,sample_id,collection_date,analyte,result_value,unit\n"
        "RCX-001,PT-101,SMP-001,2026-03-01,Hemoglobin,16.5,g/dL\n"
    )
    files = {
        "ecrf_file": ("ecrf.csv", io.BytesIO(ecrf_content.encode("utf-8")), "text/csv"),
        "lab_file": ("lab.csv", io.BytesIO(lab_content.encode("utf-8")), "text/csv"),
    }
    res = client.post("/api/reconcile", files=files)
    recon_id = res.json()["reconciliation_id"]
    finding_id = res.json()["discrepancies"][0]["finding_id"]

    # Submit valid review
    review_payload = {
        "finding_id": finding_id,
        "decision": "Confirmed discrepancy",
        "reviewer_id": "dr_smith",
        "rationale": "Verified with site coordinator; re-draw needed.",
        "reconciliation_id": recon_id,
    }
    review_res = client.post("/api/review", json=review_payload)
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "success"

    # Verify audit event recorded with previous and new status
    audit_res = client.get("/api/audit")
    assert audit_res.status_code == 200
    events = audit_res.json()["events"]
    evt = next((e for e in events if e["action"] == "HUMAN_REVIEW_DECISION" and e["finding_id"] == finding_id), None)
    assert evt is not None
    assert evt["previous_review_status"] == "Needs Review"
    assert evt["new_review_status"] == "Confirmed discrepancy"
    assert evt["decision"] == "Confirmed discrepancy"
    assert evt["rationale"] == "Verified with site coordinator; re-draw needed."

    # Check that in-memory reconciliation reflects reviewed status
    updated_recon = client.get(f"/api/reconcile/{recon_id}").json()
    assert updated_recon["discrepancies"][0]["review_status"] == "Confirmed discrepancy"
    assert updated_recon["discrepancies"][0]["reviewed_by"] == "dr_smith"


def test_review_submission_missing_or_short_rationale():
    bad_payload = {
        "finding_id": "DISC-0001",
        "decision": "Confirmed discrepancy",
        "reviewer_id": "tester",
        "rationale": "  ",
    }
    res = client.post("/api/review", json=bad_payload)
    assert res.status_code in (400, 422)


def test_review_submission_invalid_decision():
    bad_payload = {
        "finding_id": "DISC-0001",
        "decision": "Arbitrary Decision",
        "reviewer_id": "tester",
        "rationale": "Invalid rationale",
    }
    res = client.post("/api/review", json=bad_payload)
    assert res.status_code == 400
    assert "invalid decision" in res.json()["detail"].lower()


def test_csv_export_formula_injection_prevention():
    # Session with potential formula injection triggers (=, +, -, @)
    ecrf_content = (
        "study_id,participant_id,sample_id,collection_date,analyte,result_value,unit\n"
        "=CMD|' /C calc'!A0,PT-101,SMP-001,2026-03-01,Hemoglobin,14.2,g/dL\n"
    )
    lab_content = (
        "study_id,participant_id,sample_id,collection_date,analyte,result_value,unit\n"
        "=CMD|' /C calc'!A0,PT-101,SMP-001,2026-03-01,Hemoglobin,18.0,g/dL\n"
    )
    files = {
        "ecrf_file": ("ecrf.csv", io.BytesIO(ecrf_content.encode("utf-8")), "text/csv"),
        "lab_file": ("lab.csv", io.BytesIO(lab_content.encode("utf-8")), "text/csv"),
    }
    res = client.post("/api/reconcile", files=files)
    recon_id = res.json()["reconciliation_id"]

    export_res = client.get(f"/api/export/{recon_id}")
    assert export_res.status_code == 200
    # Values starting with '=' should be prepended with single quote in CSV
    assert "'=CMD|" in export_res.text

