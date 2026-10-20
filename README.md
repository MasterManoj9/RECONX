# RECONX

> "Detect the mismatch. Explain the risk. Resolve with confidence."

ReconX is an enterprise-grade clinical data intelligence application designed for clinical data managers and trial monitors. It provides deterministic, AI-assisted comparison of synthetic electronic Case Report Form (eCRF) records against synthetic Central Laboratory datasets, detects discrepancies, explains factual evidence, and enables human-reviewed adjudication with a tamper-evident audit trail.

---

## 🌟 Key Features

1. **Deterministic Clinical Reconciliation Engine (`backend/recon.py`)**:
   - Compound primary key matching based on `(study_id, participant_id, sample_id)`.
   - Comprehensive rule-based discrepancy categorization:
     - `MISSING_IDENTIFIER`: Required primary identifiers missing in source records.
     - `DUPLICATE_KEY`: Duplicate compound identifiers detected within the same source.
     - `MISSING_ECRF_RECORD`: Sample present in Central Lab but missing from eCRF.
     - `MISSING_LAB_RECORD`: Sample recorded in eCRF with no Central Lab accession.
     - `INVALID_DATE`: Unparseable or malformed collection timestamps.
     - `DATE_MISMATCH`: Collection dates diverge between eCRF and Lab.
     - `ANALYTE_MISMATCH`: Analyte naming inconsistencies.
     - `MISSING_VALUE`: Missing or null result values.
     - `INVALID_NUMERIC_VALUE`: Non-numeric entries where quantitative values are expected.
     - `UNIT_MISMATCH`: Divergent units of measure without unverified automated conversions.
     - `VALUE_MISMATCH`: Numeric differences exceeding configured tolerance.
   - Preserves source datasets as immutable records (no in-place mutations or silent overwrites).

2. **FastAPI Clinical Backend (`backend/main.py`)**:
   - Endpoints for health checks, sample data download, file uploads (with 10 MB limit and MIME validation), reconciliation runs, human review actions, audit logging, and formula-safe CSV exports.
   - Built-in CSV formula injection protection (`_safe_csv_field`).

3. **Clinical Explanation Assistant (`backend/assistant.py`)**:
   - Operates on minimal, de-identified finding evidence.
   - Generates structured summaries, supported facts, explicit hypotheses, next investigation steps, and statements of data boundaries.
   - Strict clinical safety constraints: never diagnoses, never decides clinical significance, never resolves findings automatically, and provides a transparent rule-based knowledge fallback.

4. **Clinical Data Intelligence Workspace (`frontend/`)**:
   - Built with **React 19**, **Vite**, **Lucide Icons**, and **Recharts**.
   - Restrained enterprise design system (navy, slate, teal palette with accessible contrast).
   - Dynamic dashboard featuring KPI metrics, discrepancy breakdown charts, and review queue donut charts.
   - Searchable, filterable, sortable findings table with side-by-side evidence inspection drawer.
   - Human review workflow enforcing mandatory reviewer rationales and preventing double-submission.
   - Traceable Audit Trail table displaying previous and new review statuses.
   - Regulatory-compliant CSV export functionality.

---

## 📁 Repository Structure

```
reconx/
├── backend/
│   ├── assistant.py          # Clinical explanation assistant & hypothesis engine
│   ├── main.py               # FastAPI application, CORS, endpoints, audit & export
│   ├── recon.py              # Core deterministic reconciliation engine & schema validation
│   ├── requirements.txt      # Python dependencies (FastAPI, Pandas, Pytest, Uvicorn, HTTPX)
│   └── tests/
│       ├── test_api.py       # API integration, export, review & security tests
│       ├── test_assistant.py # Assistant explanation, safety & constraint tests
│       └── test_recon.py     # Deterministic reconciliation rules & edge-case tests
├── data/
│   ├── ecrf.csv              # Synthetic eCRF test dataset
│   ├── lab_results.csv       # Synthetic Central Lab test dataset
│   ├── synthetic_ecrf.csv    # Extended synthetic eCRF dataset
│   └── synthetic_lab.csv     # Extended synthetic lab dataset
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FindingDetail.jsx # Slide-in drawer with evidence comparison & AI assistant
│   │   │   ├── FindingsTable.jsx # Searchable & filterable findings table
│   │   │   ├── Sidebar.jsx       # Responsive navigation sidebar
│   │   │   ├── StatCard.jsx      # Summary KPI card
│   │   │   └── UploadPanel.jsx   # Dual file dropzone with preview & sample loader
│   │   ├── pages/
│   │   │   ├── AuditTrail.jsx    # Audit event history
│   │   │   ├── Dashboard.jsx     # Overview with Recharts analytics
│   │   │   ├── Findings.jsx      # Discrepancy findings explorer
│   │   │   ├── Reconciliation.jsx# Reconciliation run setup
│   │   │   ├── Reports.jsx       # Export and run summary
│   │   │   └── ReviewQueue.jsx   # Human review queue
│   │   ├── services/
│   │   │   └── api.js            # Unified backend API client
│   │   ├── App.jsx               # Application root layout & status monitor
│   │   └── index.css             # Design tokens & styling
│   ├── package.json
│   └── vite.config.js
├── README.md
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup & Launch
```powershell
# Navigate to workspace
cd f:\reconx

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install dependencies (if needed)
pip install -r backend/requirements.txt

# Run the FastAPI server
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```
- API Health Check: `http://127.0.0.1:8000/health`
- Interactive API Docs (Swagger): `http://127.0.0.1:8000/docs`

### 2. Frontend Setup & Launch
```powershell
cd f:\reconx\frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Testing & Verification

### Run Backend Tests (30/30 Passed)
```powershell
cd f:\reconx
.\.venv\Scripts\python.exe -m pytest backend/tests/ -v
```

### Run Frontend Lint & Build
```powershell
cd f:\reconx\frontend
npm run lint
npm run build
```

---

## 🔒 Safety & Regulatory Compliance Principles
- **Synthetic Data Exclusively**: Only fictional clinical trial records are processed.
- **Data Integrity**: Source records are treated as strictly immutable and are never overwritten or altered.
- **Human-in-the-Loop Requirement**: Discrepancies are never auto-resolved by AI or algorithms; explicit human reviewer adjudication and rationale are mandatory.
- **Formula-Injection Safe**: All exported CSV text fields are sanitized against spreadsheet formula injection triggers (`=`, `+`, `-`, `@`).
