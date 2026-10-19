"""ReconX FastAPI Backend Server.

Provides RESTful endpoints for clinical data reconciliation,
human-in-the-loop review actions, audit logging, and CSV exports.
"""

from __future__ import annotations

import csv
import datetime
import io
import os
import uuid
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field

from backend.recon import (
    DEFAULT_NUMERIC_TOLERANCE,
    REQUIRED_FIELDS,
    reconcile_data,
    validate_dataframe,
)

APP_VERSION = "1.0.0"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))

app = FastAPI(
    title="ReconX API",
    description="Deterministic Clinical Data Reconciliation Service",
    version=APP_VERSION,
)

# CORS configuration for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-Memory Storage Layer
# (Explicitly ephemeral: resets whenever backend restarts)
# ---------------------------------------------------------------------------
class InMemoryStore:
    def __init__(self):
        self.reconciliations: Dict[str, Dict[str, Any]] = {}
        self.audit_log: List[Dict[str, Any]] = []

    def save_reconciliation(self, recon_id: str, data: Dict[str, Any]) -> None:
        self.reconciliations[recon_id] = data

    def get_reconciliation(self, recon_id: str) -> Optional[Dict[str, Any]]:
        return self.reconciliations.get(recon_id)

    def add_audit_event(self, event: Dict[str, Any]) -> None:
        self.audit_log.append(event)

    def get_audit_events(self) -> List[Dict[str, Any]]:
        return list(self.audit_log)


store = InMemoryStore()


# ---------------------------------------------------------------------------
# Pydantic Request / Response Models
# ---------------------------------------------------------------------------
class ReviewRequest(BaseModel):
    finding_id: str = Field(..., min_length=1, description="Target finding ID (e.g. DISC-0001)")
    decision: str = Field(
        ...,
        description="Permitted review decision: Confirmed Discrepancy, Accept eCRF, Accept Lab, False Positive, Query Site",
    )
    reviewer_id: str = Field(..., min_length=1, description="Reviewer identifier or demo reviewer handle")
    rationale: str = Field(..., min_length=3, description="Clinical data management rationale")
    reconciliation_id: Optional[str] = Field(None, description="Optional reconciliation session ID")


PERMITTED_DECISIONS = {
    "Confirmed Discrepancy",
    "Accept eCRF",
    "Accept Lab",
    "False Positive",
    "Query Site",
}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health", tags=["System"])
async def health_check():
    """Service health and version status."""
    return {
        "status": "healthy",
        "service": "ReconX Clinical Data Reconciliation API",
        "version": APP_VERSION,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }


def _read_and_validate_csv(file_bytes: bytes, filename: str, source_label: str) -> pd.DataFrame:
    """Safely decode and parse CSV file without logging contents."""
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{source_label} file '{filename}' is empty.",
        )
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"{source_label} file exceeds maximum allowed size of 10 MB.",
        )

    # Safe text decoding
    try:
        content_str = file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            content_str = file_bytes.decode("latin-1")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to decode {source_label} file '{filename}'. Please provide a valid UTF-8 CSV.",
            )

    try:
        df = pd.read_csv(io.StringIO(content_str), dtype=str)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed CSV in {source_label} file: {str(exc)}",
        )

    valid, errors = validate_dataframe(df, source_label, REQUIRED_FIELDS)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Schema validation failed: {'; '.join(errors)}",
        )

    return df


@app.post("/api/reconcile", tags=["Reconciliation"])
async def reconcile_files(
    ecrf_file: UploadFile = File(..., description="eCRF CSV file upload"),
    lab_file: UploadFile = File(..., description="Central Lab CSV file upload"),
    numeric_tolerance: float = Query(DEFAULT_NUMERIC_TOLERANCE, ge=0.0, le=10.0),
):
    """Reconcile uploaded eCRF and Central Lab CSV files.

    Performs file size validation, schema validation, and deterministic comparison.
    Results are cached in memory under a unique reconciliation_id.
    """
    if not ecrf_file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ecrf_file must be a CSV file (.csv).",
        )
    if not lab_file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="lab_file must be a CSV file (.csv).",
        )

    ecrf_bytes = await ecrf_file.read()
    lab_bytes = await lab_file.read()

    ecrf_df = _read_and_validate_csv(ecrf_bytes, ecrf_file.filename, "eCRF")
    lab_df = _read_and_validate_csv(lab_bytes, lab_file.filename, "Central Lab")

    try:
        recon_result = reconcile_data(ecrf_df, lab_df, numeric_tolerance=numeric_tolerance)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve),
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during reconciliation processing.",
        )

    recon_id = f"REC-{uuid.uuid4().hex[:8].upper()}"
    recon_result["reconciliation_id"] = recon_id
    recon_result["source_files"] = {
        "ecrf_filename": ecrf_file.filename,
        "lab_filename": lab_file.filename,
    }

    # Store in ephemeral memory
    store.save_reconciliation(recon_id, recon_result)

    # Record initial reconciliation audit event
    store.add_audit_event({
        "event_id": f"EVT-{uuid.uuid4().hex[:8].upper()}",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "action": "RECONCILIATION_RUN",
        "reconciliation_id": recon_id,
        "reviewer_id": "SYSTEM",
        "details": {
            "total_discrepancies": recon_result["summary"]["total_discrepancies"],
            "matched_records": recon_result["summary"]["matched_records"],
            "ecrf_file": ecrf_file.filename,
            "lab_file": lab_file.filename,
        },
    })

    return recon_result


@app.get("/api/reconcile/{reconciliation_id}", tags=["Reconciliation"])
async def get_reconciliation_by_id(reconciliation_id: str):
    """Retrieve in-memory reconciliation results by ID."""
    result = store.get_reconciliation(reconciliation_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reconciliation session '{reconciliation_id}' not found. Note: in-memory store resets on server restart.",
        )
    return result


@app.get("/api/sample-data", tags=["Sample Data"])
async def get_sample_data():
    """Return catalog of built-in synthetic clinical datasets."""
    catalog = [
        {
            "id": "ecrf_default",
            "name": "Synthetic eCRF Dataset",
            "filename": "ecrf.csv",
            "description": "Fictional clinical trial eCRF records with standard analytes and intentional edge cases.",
            "download_url": "/api/sample-data/download/ecrf",
        },
        {
            "id": "lab_default",
            "name": "Synthetic Central Lab Dataset",
            "filename": "lab_results.csv",
            "description": "Fictional Central Laboratory records with intentional discrepancies for matching testing.",
            "download_url": "/api/sample-data/download/lab",
        },
    ]
    return {"sample_datasets": catalog}


@app.get("/api/sample-data/download/{dataset_type}", tags=["Sample Data"])
async def download_sample_data(dataset_type: str):
    """Download built-in synthetic sample CSVs safely."""
    if dataset_type == "ecrf":
        file_path = os.path.join(DATA_DIR, "ecrf.csv")
        filename = "synthetic_ecrf.csv"
    elif dataset_type == "lab":
        file_path = os.path.join(DATA_DIR, "lab_results.csv")
        filename = "synthetic_lab_results.csv"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid dataset_type. Choose 'ecrf' or 'lab'.",
        )

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample file {filename} not found on server.",
        )

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/api/review", tags=["Review & Audit"])
async def record_human_review(review: ReviewRequest):
    """Record a human-reviewed resolution for a specific discrepancy finding.

    Validates decision, updates finding status in-memory if reconciliation_id is provided,
    and logs an audit trail event. Never silently alters raw source data.
    """
    if review.decision not in PERMITTED_DECISIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid decision '{review.decision}'. Permitted decisions: {', '.join(sorted(PERMITTED_DECISIONS))}",
        )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    finding_updated = False

    # If reconciliation_id provided, attempt to update finding in memory
    if review.reconciliation_id:
        recon = store.get_reconciliation(review.reconciliation_id)
        if recon:
            for disc in recon.get("discrepancies", []):
                if disc.get("finding_id") == review.finding_id:
                    disc["review_status"] = review.decision
                    disc["reviewed_by"] = review.reviewer_id
                    disc["reviewer_rationale"] = review.rationale
                    disc["reviewed_at"] = now_iso
                    finding_updated = True
                    break

    audit_event = {
        "event_id": f"EVT-{uuid.uuid4().hex[:8].upper()}",
        "timestamp": now_iso,
        "action": "HUMAN_REVIEW_DECISION",
        "finding_id": review.finding_id,
        "decision": review.decision,
        "reviewer_id": review.reviewer_id,
        "rationale": review.rationale,
        "reconciliation_id": review.reconciliation_id,
        "finding_updated": finding_updated,
    }
    store.add_audit_event(audit_event)

    return {
        "status": "success",
        "message": f"Review recorded for finding {review.finding_id}",
        "audit_event": audit_event,
    }


@app.get("/api/audit", tags=["Review & Audit"])
async def get_audit_trail():
    """Retrieve audit events from ephemeral in-memory storage."""
    events = store.get_audit_events()
    return {
        "total_events": len(events),
        "storage_mode": "in-memory (resets on server restart)",
        "events": events,
    }


@app.get("/api/export/{reconciliation_id}", tags=["Export"])
async def export_reconciliation_csv(reconciliation_id: str):
    """Export findings for a given reconciliation session as a CSV file."""
    recon = store.get_reconciliation(reconciliation_id)
    if not recon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reconciliation session '{reconciliation_id}' not found. Cannot export.",
        )

    findings = recon.get("discrepancies", [])
    output = io.StringIO()
    writer = csv.writer(output)

    # Standard clinical export headers
    headers = [
        "Finding ID",
        "Discrepancy Type",
        "Severity",
        "Study ID",
        "Participant ID",
        "Sample ID",
        "Rule Triggered",
        "Description",
        "Suggested Action",
        "Review Status",
        "Reviewed By",
        "Reviewer Rationale",
        "Reviewed At",
        "eCRF Analyte",
        "eCRF Value",
        "eCRF Unit",
        "Lab Analyte",
        "Lab Value",
        "Lab Unit",
    ]
    writer.writerow(headers)

    for f in findings:
        ecrf_ev = f.get("ecrf_evidence") or {}
        lab_ev = f.get("lab_evidence") or {}
        writer.writerow([
            f.get("finding_id", ""),
            f.get("discrepancy_type", ""),
            f.get("severity", ""),
            f.get("study_id", ""),
            f.get("participant_id", ""),
            f.get("sample_id", ""),
            f.get("rule_triggered", ""),
            f.get("description", ""),
            f.get("suggested_investigation_step", ""),
            f.get("review_status", "Needs Review"),
            f.get("reviewed_by", ""),
            f.get("reviewer_rationale", ""),
            f.get("reviewed_at", ""),
            ecrf_ev.get("analyte", ""),
            ecrf_ev.get("value", ""),
            ecrf_ev.get("unit", ""),
            lab_ev.get("analyte", ""),
            lab_ev.get("value", ""),
            lab_ev.get("unit", ""),
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="recon_findings_{reconciliation_id}.csv"'
        },
    )
