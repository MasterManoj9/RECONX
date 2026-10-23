# RECONX

> "Detect the mismatch. Explain the risk. Resolve with confidence."

🌐 **Live Deployed Application**: [https://main.d2f4yaeel8u9pw.amplifyapp.com/](https://main.d2f4yaeel8u9pw.amplifyapp.com/)

ReconX is an enterprise-grade clinical data intelligence application designed for clinical data managers, trial monitors, and medical reviewers. It provides deterministic, AI-assisted comparison of synthetic electronic Case Report Form (eCRF) records against synthetic Central Laboratory datasets, detects discrepancies, explains factual evidence, and enables human-reviewed adjudication with a tamper-evident audit trail.

---

## 🚀 Live Demo & Deployment
- **Frontend & App Host**: AWS Amplify ([Live Site](https://main.d2f4yaeel8u9pw.amplifyapp.com/))
- **Database & Authentication**: Supabase PostgreSQL & Supabase Auth (`vjshgqdtshyhhnpjfbzv.supabase.co`)
- **Email Delivery Service**: Custom SMTP via Gmail App Password / Custom SMTP provider
- **Engine Architecture**: Dual-execution support — runs deterministically in-browser for zero-server deployments (AWS Amplify) as well as natively via Python FastAPI (`backend/`).

---

## 🌟 Key Features

### 1. Deterministic Clinical Reconciliation Engine (`reconEngine.js` & `backend/recon.py`)
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

### 2. Production Authentication & Full Email Verification Lifecycle
- **Real User Signup Flow**: Reviewers register with their work email, full name, and password.
- **Verification Prompt**: Upon signup, users are presented with a dedicated "Check Your Email" prompt displaying next steps.
- **Confirmation Callback & Seamless Redirect**: Clicking the verification link in their email redirects users back to ReconX, where the app automatically opens the Sign In modal with a confirmed badge (`Email confirmed successfully!`).
- **Strict User Isolation**: Every user receives an isolated, dedicated dashboard with 0 data overlap; reconciliations and reviews are scoped strictly to the authenticated `user_id`.
- **ALCOA+ / 21 CFR Part 11 Attribution**: Authentic reviewer signatures on every finding decision and audit log.
- **Zero Demo Shortcuts**: Instant testing demo shortcuts have been completely retired to maintain regulatory integrity.

### 3. Interactive 3D Caduceus Medical Particle Background (`CaduceusOrbits.jsx`)
- Built with **Three.js** and **WebGL2**.
- Renders the iconic medical Caduceus (winged staff with twin entwined serpents) using thousands of glowing, colored particles.
- Features continuous 3D axial revolution with responsive mouse-tracking parallax and interactive click-ripple shockwaves.

### 4. Google Gemini NLP Clinical Intelligence Suite (`geminiNLP.js`)
- **Natural Language Findings Search & Q&A**: Reviewers can query clinical findings using conversational English (e.g., *"Which participants have potassium differences > 0.5?"*, *"Summarize all missing central lab records"*). Gemini NLP interprets reviewer intent, provides clinical narrative responses, and dynamically filters the findings table in real-time.
- **Deep Discrepancy Reasoning**: Analyzes discrepancies across eCRF and Lab evidence to formulate probable root causes (sample degradation, accession barcode mismatch, transcription error, or assay recalibration).
- **Automated Site Query Letter Drafting**: Generates formal, audit-ready inquiry letters addressed to Site Coordinators/PIs with 1-click clipboard copying.
- **Regulatory Risk Rating**: Synthesizes regulatory risk assessments (`HIGH`, `MEDIUM`, `LOW`) grounded in ALCOA+ data integrity standards.
- **Dual Engine Safety Fallback**: If an external API key is not configured, ReconX automatically defaults to its transparent, deterministic rule-based knowledge engine without breaking the user experience.

### 5. Clinical Data Intelligence Workspace (`frontend/`)
- Built with **React 19**, **Vite**, **Three.js**, **Lucide Icons**, and **Recharts**.
- **Liquid-Glass UI**: Dark aesthetic with frosted glass panels (`backdrop-filter: blur(16px)`) and teal/cyan glowing accents.
- **Collapsible Navigation Rail**: Sidebar smoothly toggles between expanded (`260px`) and icon-only rail (`72px`) modes for wide data table viewing.
- **Adjudication Closeout Workflow**: Filter review queues by *Pending*, *Adjudicated*, or *All*, with automatic *Reconciliation Adjudication Complete* regulatory sign-off milestones upon 100% review completion.
- Searchable, filterable, sortable findings table with side-by-side evidence inspection drawer.
- Regulatory-compliant, formula-injection safe CSV export functionality.

---

## ✉️ Email Verification Setup (Custom SMTP)

To allow any user on the internet (e.g. Gmail, Outlook, enterprise emails) to sign up and receive confirmation emails without needing a custom domain, Supabase is paired with Gmail SMTP via a Google App Password:

1. **Generate Google App Password**:
   - Go to [Google Account Security](https://myaccount.google.com/security) &rarr; **2-Step Verification** &rarr; [App Passwords](https://myaccount.google.com/apppasswords).
   - Enter App name: `Supabase`, then click **Create**.
   - Copy the generated 16-character password.
2. **Configure Supabase SMTP**:
   - In Supabase Dashboard &rarr; **Authentication** &rarr; **SMTP Settings**:
     - **Enable Custom SMTP**: ON
     - **Sender email**: `your-email@gmail.com`
     - **Sender name**: `ReconX Intelligence`
     - **Host**: `smtp.gmail.com`
     - **Port number**: `465`
     - **Username**: `your-email@gmail.com`
     - **Password**: `[16-character Google App Password]`
     - Click **Save changes**.
3. **URL Configuration**:
   - In Supabase &rarr; **Authentication** &rarr; **URL Configuration**:
     - **Site URL**: `https://main.d2f4yaeel8u9pw.amplifyapp.com`
     - **Redirect URLs**: `https://main.d2f4yaeel8u9pw.amplifyapp.com/**`

---

## 🗄️ Supabase SQL Database Migration

To enable per-user dashboard isolation and Row Level Security in your Supabase project, execute the following script in your **Supabase SQL Editor**:

```sql
-- 1. Ensure user_id column exists on reconciliations table
ALTER TABLE reconciliations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Ensure user_id column exists on audit_trail table
ALTER TABLE audit_trail 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Create performance indexes for user queries
CREATE INDEX IF NOT EXISTS idx_reconciliations_user_id ON reconciliations(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);

-- 4. Enable Row Level Security (RLS) for tenant isolation
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- 5. Policies: Allow reviewers to manage their own reconciliations
DROP POLICY IF EXISTS "Users can read own reconciliations" ON reconciliations;
CREATE POLICY "Users can read own reconciliations" 
ON reconciliations FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert own reconciliations" ON reconciliations;
CREATE POLICY "Users can insert own reconciliations" 
ON reconciliations FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update own reconciliations" ON reconciliations;
CREATE POLICY "Users can update own reconciliations" 
ON reconciliations FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can read audit trail" ON audit_trail;
CREATE POLICY "Users can read audit trail" 
ON audit_trail FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert audit trail" ON audit_trail;
CREATE POLICY "Users can insert audit trail" 
ON audit_trail FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
```

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
│   │   │   ├── AISettingsModal.jsx       # Google Gemini NLP key configuration modal
│   │   │   ├── AuthModal.jsx             # Production Sign-in / Sign-up dialog with email verify screen
│   │   │   ├── CaduceusOrbits.jsx        # 3D revolving Caduceus particle background (Three.js WebGL2)
│   │   │   ├── caduceus_base_points.json # Point cloud coordinates for Caduceus 3D geometry
│   │   │   ├── BinaryOrbits.jsx          # Spiral galaxy particle background component
│   │   │   ├── FindingDetail.jsx         # Slide-in drawer with evidence comparison & AI assistant
│   │   │   ├── FindingsTable.jsx         # Searchable & filterable findings table
│   │   │   ├── Sidebar.jsx               # Collapsible navigation sidebar (72px / 260px)
│   │   │   ├── StatCard.jsx              # Summary KPI card
│   │   │   └── UploadPanel.jsx           # Dual file dropzone with preview & sample loader
│   │   ├── pages/
│   │   │   ├── AuditTrail.jsx            # Audit event history
│   │   │   ├── Dashboard.jsx             # Overview with Recharts analytics
│   │   │   ├── Findings.jsx              # Discrepancy findings explorer with Gemini NLP search
│   │   │   ├── Home.jsx                  # Dedicated landing page explaining platform capabilities
│   │   │   ├── Reconciliation.jsx        # Reconciliation run setup
│   │   │   ├── Reports.jsx               # Export and run summary
│   │   │   └── ReviewQueue.jsx           # Human review queue with adjudication closeout
│   │   ├── services/
│   │   │   ├── api.js                    # Unified API, Auth & Supabase database client
│   │   │   ├── geminiNLP.js              # Google Gemini NLP engine (Search, Q&A, Site Query generator)
│   │   │   ├── assistantEngine.js        # Client-side explanation & hypothesis synthesizer
│   │   │   └── reconEngine.js            # Client-side deterministic reconciliation engine
│   │   ├── App.jsx                       # Application root layout, auth & status monitor
│   │   └── index.css                     # Design tokens & dynamic iOS glass styles
│   ├── package.json
│   └── vite.config.js
├── README.md
└── .gitignore
```

---

## 🚀 Getting Started

### 1. Web Application (Live)
Simply visit: **[https://main.d2f4yaeel8u9pw.amplifyapp.com/](https://main.d2f4yaeel8u9pw.amplifyapp.com/)**

### 2. Local Frontend Setup
```powershell
cd f:\reconx\frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 3. Local Python Backend Setup (Optional)
```powershell
cd f:\reconx

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install dependencies
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
- **Attributable Auditability**: Under ALCOA+ principles, every review decision and reconciliation run is recorded permanently in Supabase PostgreSQL with ISO 8601 timestamps and reviewer IDs.
- **Formula-Injection Safe**: All exported CSV text fields are sanitized against spreadsheet formula injection triggers (`=`, `+`, `-`, `@`).
