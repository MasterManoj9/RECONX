# RECONX

> "Detect the mismatch. Explain the risk. Resolve with confidence."

ReconX is a clinical data reconciliation application for AI-assisted comparison of synthetic electronic Case Report Form (eCRF) data against synthetic central laboratory records.

## Key Features
- **Reconciliation Engine**: Deterministic detection of record presence, duplicates, date misalignments, analyte mismatches, missing values, unit differences, and value tolerances.
- **Traceable Findings**: Every finding is backed by source evidence, the triggered deterministic rule, factual explanation, and recommended investigation steps.
- **Human-in-the-Loop Review**: Decisions and rationales recorded with an immutable audit trail.
- **Enterprise Clinical UI**: Restrained navy/teal clinical intelligence dashboard with metrics, search/filtering, detail inspections, and CSV export.

## Architecture
- `backend/`: FastAPI API, deterministic reconciliation engine (`recon.py`), pytest test suite.
- `frontend/`: React + Vite + Tailwind CSS / tokens + Lucide icons + Recharts.
- `data/`: Synthetic clinical datasets only.
- `reports/`: Audit trail and exported reconciliation findings.
