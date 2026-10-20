# RECONX

> "Detect the mismatch. Explain the risk. Resolve with confidence."

🌐 **Live Deployed Application**: [https://main.d2f4yaeel8u9pw.amplifyapp.com/](https://main.d2f4yaeel8u9pw.amplifyapp.com/)

ReconX is an enterprise-grade clinical data intelligence platform designed for Clinical Data Managers (CDMs) and Clinical Trial Monitors. It delivers deterministic, AI-assisted cross-reconciliation between electronic Case Report Form (eCRF) records and Central Laboratory datasets, detects discrepancies across 11 regulatory categories, explains factual evidence with clinical safety constraints, and guarantees an immutable, audit-ready paper trail powered by Supabase PostgreSQL.

---

## 🚀 Live Demo & Infrastructure
- **Live Application Host**: [AWS Amplify (Production Site)](https://main.d2f4yaeel8u9pw.amplifyapp.com/)
- **Cloud Database**: [Supabase PostgreSQL Cluster](https://supabase.com) (`vjshgqdtshyhhnpjfbzv.supabase.co`)
- **Interactive Visual Engine**: WebGL2 custom **Binary Orbits** 3D cosmic galaxy simulation with real-time particle physics and starlight bloom
- **Hybrid Architecture**: Dual-execution design — runs client-side in browser for zero-server deployments (AWS Amplify) with optional high-performance Python FastAPI backend (`backend/`)

---

## 🌌 Interactive Visual Experience (Binary Orbits)

ReconX features an interactive WebGL2 3D simulation of a tilted spiral galaxy ([`BinaryOrbits.jsx`](frontend/src/components/BinaryOrbits.jsx)) embedded as a persistent cosmic background behind modern glassmorphism UI cards:

- **70,000 Streaming Stars**: Rendered using GPU instanced interleaved buffers and custom GLSL3 vertex/fragment shaders.
- **Differential Keplerian Rotation**: Stars rotate with velocity inversely proportional to core distance:
  $$\omega(a) = \frac{uSpin}{\sqrt{a^2 + uCoreRadius^2}}$$
  Inner core stars orbit faster while 3 logarithmic spiral arms continuously sweep through cosmic space.
- **Dynamic Gravitational Hover Wakes**: Sweeping the cursor over the galaxy displaces nearby star orbits with a gravitational drag vector, accelerating rotation (`hoverBoost = 0.5`) and kindling stars into brilliant magenta-pink (`#FFC2EE`) and violet (`#7B4DFF`) OKLab hues.
- **Click Ripple Shockwaves**: Clicking anywhere on the screen propagates expanding gravitational wave rings across the galaxy arms, causing stars along the wave front to flare with high-energy starlight.
- **Multi-Pass Bloom Pyramid**: GPU downsample and upsample blur passes provide authentic radiant glow, central core luminescence, and subtle cinematic dither.

---

## 🌟 Key Features

### 1. Deterministic Clinical Reconciliation Engine (`reconEngine.js` & `backend/recon.py`)
- **Compound Identifier Matching**: Joins records across `(study_id, participant_id, sample_id)`.
- **11 Regulatory Discrepancy Categories Detected**:
  - `MISSING_IDENTIFIER`: Required primary identifiers missing in source records.
  - `DUPLICATE_KEY`: Duplicate compound identifiers detected within the same source.
  - `MISSING_ECRF_RECORD`: Sample present in Central Lab but missing from eCRF.
  - `MISSING_LAB_RECORD`: Sample recorded in eCRF with no Central Lab accession.
  - `INVALID_DATE`: Unparseable or malformed collection timestamps.
  - `DATE_MISMATCH`: Collection dates diverge between eCRF and Central Lab.
  - `ANALYTE_MISMATCH`: Analyte biomarker naming inconsistencies.
  - `MISSING_VALUE`: Missing or null result values where expected.
  - `INVALID_NUMERIC_VALUE`: Non-numeric entries where quantitative values are expected.
  - `UNIT_MISMATCH`: Divergent units of measure without unverified automated conversions.
  - `VALUE_MISMATCH`: Numeric differences exceeding configured tolerance.
- **Data Immutability**: Source datasets are preserved as immutable records with zero in-place mutations or silent algorithmic overwrites.

### 2. Persistent Cloud Database (Supabase PostgreSQL)
- **Session Persistence**: Complete reconciliation results, summary metrics, and discrepancies persist to the Supabase `reconciliations` table.
- **Immutable Audit Trail**: All human review decisions, timestamps, reviewer handles, previous and new review statuses, and mandatory rationales are permanently written to the `audit_trail` table.
- **Zero-Downtime Resilience**: Automatic seamless fallback to local in-memory storage if cloud connectivity is interrupted.

### 3. Clinical Explanation Assistant (`assistantEngine.js` & `backend/assistant.py`)
- Operates strictly on minimal, de-identified finding evidence.
- Generates structured summaries, supported facts, explicit hypotheses, next investigation steps, and clear statements of data boundaries.
- **Strict Clinical Safety Constraints**: Never diagnoses, never decides clinical significance, never resolves findings automatically, and provides a transparent rule-based knowledge fallback.

### 4. Enterprise Review & Reporting Workspace (`frontend/`)
- Built with **React 19**, **Three.js**, **Vite**, **Lucide Icons**, and **Recharts**.
- Dynamic dashboard with KPI metrics, discrepancy breakdown charts, and review status donut charts.
- Searchable, filterable, sortable findings table with slide-in evidence inspection drawer.
- Human review workflow enforcing mandatory reviewer rationales and preventing double-submission.
- Traceable Audit Trail table displaying previous and new review statuses.
- Formula-injection safe CSV export protecting downstream spreadsheets from formula triggers (`=`, `+`, `-`, `@`).

---

## 👥 Who Uses ReconX?

| User Persona | Role & Objectives | How ReconX Solves It |
|---|---|---|
| **Clinical Data Manager (CDM)** | Ensures trial data integrity and regulatory compliance for study closeout. | Deterministically reconciles thousands of eCRF and Lab records in seconds; provides instant discrepancy summaries. |
| **Clinical Research Associate (CRA / Monitor)** | Verifies protocol compliance and sample accessioning at investigative sites. | Tracks missing lab samples (`MISSING_LAB_RECORD`) or unrecorded lab accessions (`MISSING_ECRF_RECORD`) to issue targeted site queries. |
| **Clinical Safety Reviewer** | Investigates safety biomarker shifts and reporting anomalies. | Compares analyte discrepancies and collection dates side-by-side with structured AI hypothesis evidence. |
| **Data Operations & Biostatistics** | Validates datasets for statistical analysis and FDA/EMA regulatory submission. | Generates formula-injection sanitized CSV audit reports with immutable Supabase audit histories. |

---

## 📁 Repository Structure

```
reconx/
├── amplify.yml               # AWS Amplify CI/CD build specification
├── backend/
│   ├── assistant.py          # Clinical explanation assistant & hypothesis engine
│   ├── db.py                 # Supabase PostgreSQL persistence adapter
│   ├── main.py               # FastAPI application, CORS, endpoints, audit & export
│   ├── recon.py              # Core deterministic reconciliation engine & schema validation
│   ├── requirements.txt      # Python dependencies (FastAPI, Pandas, Supabase, Pytest, Uvicorn, HTTPX)
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
│   │   │   ├── BinaryOrbits.jsx  # WebGL2 tilted 3D spiral galaxy background simulation
│   │   │   ├── FindingDetail.jsx # Slide-in drawer with evidence comparison & AI assistant
│   │   │   ├── FindingsTable.jsx # Searchable & filterable findings table
│   │   │   ├── Sidebar.jsx       # Responsive navigation sidebar
│   │   │   ├── StatCard.jsx      # Summary KPI card
│   │   │   └── UploadPanel.jsx   # Dual file dropzone with preview & sample loader
│   │   ├── pages/
│   │   │   ├── AuditTrail.jsx    # Audit event history
│   │   │   ├── Dashboard.jsx     # Overview with Recharts analytics
│   │   │   ├── Findings.jsx      # Discrepancy findings explorer
│   │   │   ├── Home.jsx          # Interactive cosmic landing page with Binary Orbits
│   │   │   ├── Reconciliation.jsx# Reconciliation run setup
│   │   │   ├── Reports.jsx       # Export and run summary
│   │   │   └── ReviewQueue.jsx   # Human review queue
│   │   ├── services/
│   │   │   ├── api.js            # Unified API & Supabase database client
│   │   │   ├── assistantEngine.js# Client-side explanation & hypothesis synthesizer
│   │   │   └── reconEngine.js    # Client-side deterministic reconciliation engine
│   │   ├── App.jsx               # Application root layout & status monitor
│   │   └── index.css             # Design tokens & styling
│   ├── package.json
│   └── vite.config.js
├── README.md
└── .gitignore
```

---

## 🚀 Getting Started

### 1. Web Application (Live Deployment)
Simply visit: **[https://main.d2f4yaeel8u9pw.amplifyapp.com/](https://main.d2f4yaeel8u9pw.amplifyapp.com/)**

### 2. Local Frontend Setup
```powershell
cd f:\reconx\frontend

# Install dependencies (React 19, Three.js, Lucide, Recharts)
npm install

# Start local development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 3. Local Python Backend Setup (Optional)
```powershell
cd f:\reconx

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt

# Run the FastAPI server
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```
- API Health Check: `http://127.0.0.1:8000/health`
- Interactive API Docs (Swagger): `http://127.0.0.1:8000/docs`

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
- **Auditability**: Every review decision and reconciliation run is recorded permanently in Supabase PostgreSQL with ISO 8601 timestamps and reviewer IDs.
- **Formula-Injection Safe**: All exported CSV text fields are sanitized against spreadsheet formula injection triggers (`=`, `+`, `-`, `@`).
