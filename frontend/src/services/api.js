/**
 * ReconX API Client Service
 * Connects to the FastAPI backend (http://127.0.0.1:8000)
 */

const API_BASE = 'http://127.0.0.1:8000';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchSampleDataCatalog() {
  const res = await fetch(`${API_BASE}/api/sample-data`);
  if (!res.ok) {
    throw new Error(`Failed to fetch sample catalog: HTTP ${res.status}`);
  }
  return res.json();
}

export async function downloadSampleCsv(type) {
  const res = await fetch(`${API_BASE}/api/sample-data/download/${type}`);
  if (!res.ok) {
    throw new Error(`Failed to download sample ${type}: HTTP ${res.status}`);
  }
  return res.text();
}

export async function postReconcileFiles(ecrfFile, labFile, numericTolerance = 0.001) {
  const formData = new FormData();
  formData.append('ecrf_file', ecrfFile);
  formData.append('lab_file', labFile);

  const res = await fetch(`${API_BASE}/api/reconcile?numeric_tolerance=${numericTolerance}`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || `Reconciliation failed with status ${res.status}`);
  }
  return data;
}

export async function fetchReconciliation(reconId) {
  const res = await fetch(`${API_BASE}/api/reconcile/${reconId}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || `Failed to fetch reconciliation: HTTP ${res.status}`);
  }
  return res.json();
}

export async function submitFindingReview({
  findingId,
  decision,
  reviewerId,
  rationale,
  reconciliationId,
}) {
  const res = await fetch(`${API_BASE}/api/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      finding_id: findingId,
      decision,
      reviewer_id: reviewerId,
      rationale,
      reconciliation_id: reconciliationId,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || `Review submission failed with status ${res.status}`);
  }
  return data;
}

export async function fetchAuditTrail() {
  const res = await fetch(`${API_BASE}/api/audit`);
  if (!res.ok) {
    throw new Error(`Failed to fetch audit log: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchFindingExplanation(payload) {
  const res = await fetch(`${API_BASE}/api/assistant/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || `Explanation request failed with status ${res.status}`);
  }
  return data;
}

export function getExportUrl(reconciliationId) {
  return `${API_BASE}/api/export/${reconciliationId}`;
}
