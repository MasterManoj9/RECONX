/**
 * ReconX Deterministic Client-Side Reconciliation Engine
 * Executes all 11 discrepancy rules locally with exact parity to the Python engine.
 */

export const REQUIRED_FIELDS = [
  'study_id',
  'participant_id',
  'sample_id',
  'collection_date',
  'analyte',
  'result_value',
  'unit',
];

export const SUPPORTED_DATE_FORMATS = [
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{1,2}\/\d{1,2}\/\d{4}$/,
  /^\d{4}\/\d{1,2}\/\d{1,2}$/,
];

function cleanStr(val) {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  if (['nan', 'null', 'none'].includes(s.toLowerCase())) return '';
  return s;
}

function isEmpty(val) {
  return cleanStr(val) === '';
}

function parseDateExplicit(dateStr) {
  if (isEmpty(dateStr)) return { date: null, isInvalid: false };
  const s = String(dateStr).trim();
  
  // ISO standard YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { date: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`, isInvalid: false };
    }
    return { date: null, isInvalid: true };
  }

  // MM/DD/YYYY or DD/MM/YYYY
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const dObj = new Date(s);
    if (!isNaN(dObj.getTime())) {
      return { date: dObj.toISOString().slice(0, 10), isInvalid: false };
    }
  }

  return { date: null, isInvalid: true };
}

function parseNumeric(val) {
  if (isEmpty(val)) return { num: null, isInvalid: false };
  const s = String(val).trim().replace(/,/g, '');
  const n = Number(s);
  if (isNaN(n)) return { num: null, isInvalid: true };
  return { num: n, isInvalid: false };
}

export function parseCsvText(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const rawHeaders = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const headers = rawHeaders.map((h) => h.toLowerCase());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parser handling quotes
    const cells = [];
    let insideQuotes = false;
    let currentCell = '';

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const c = line[charIdx];
      if (c === '"') {
        insideQuotes = !insideQuotes;
      } else if (c === ',' && !insideQuotes) {
        cells.push(currentCell.trim().replace(/^"|"$/g, ''));
        currentCell = '';
      } else {
        currentCell += c;
      }
    }
    cells.push(currentCell.trim().replace(/^"|"$/g, ''));

    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = cells[idx] !== undefined ? cells[idx] : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

export function reconcileDatasets(ecrfRows, labRows, numericTolerance = 0.001) {
  const findings = [];
  let findingCounter = 1;

  function nextId() {
    const fid = `DISC-${String(findingCounter).padStart(4, '0')}`;
    findingCounter++;
    return fid;
  }

  function getField(row, ...keys) {
    for (const k of keys) {
      if (row[k] !== undefined) return row[k];
      const lower = k.toLowerCase();
      if (row[lower] !== undefined) return row[lower];
    }
    return '';
  }

  // 1. Row integrity inspection
  function processIntegrity(rows, sourceName, valueCol) {
    return rows.map((row, idx) => {
      const rowNum = idx + 1;
      const sId = getField(row, 'study_id');
      const pId = getField(row, 'participant_id');
      const smpId = getField(row, 'sample_id');
      const cDate = getField(row, 'collection_date');
      const analyte = getField(row, 'analyte', 'analyte_name');
      const val = getField(row, 'result_value', valueCol);
      const unit = getField(row, 'unit');

      const evidence = {
        source: sourceName,
        row_number: rowNum,
        study_id: sId,
        participant_id: pId,
        sample_id: smpId,
        collection_date: cDate,
        analyte,
        value: val,
        unit,
      };

      // Check MISSING_IDENTIFIER
      const missing = [];
      if (isEmpty(sId)) missing.push('study_id');
      if (isEmpty(pId)) missing.push('participant_id');
      if (isEmpty(smpId)) missing.push('sample_id');

      if (missing.length > 0) {
        findings.push({
          finding_id: nextId(),
          discrepancy_type: 'MISSING_IDENTIFIER',
          study_id: cleanStr(sId) || null,
          participant_id: cleanStr(pId) || null,
          sample_id: cleanStr(smpId) || null,
          severity: 'HIGH',
          description: `${sourceName} record at row ${rowNum} is missing required identifier(s): ${missing.join(', ')}.`,
          ecrf_evidence: sourceName === 'eCRF' ? evidence : null,
          lab_evidence: sourceName === 'Central Lab' ? evidence : null,
          rule_triggered: 'RULE-MISSING-IDENTIFIER',
          suggested_investigation_step: `Audit source ${sourceName} log to populate mandatory identifiers.`,
          review_status: 'Needs Review',
        });
        return { rowNum, key: null, evidence };
      }

      // Check INVALID_DATE
      const { isInvalid: badDate } = parseDateExplicit(cDate);
      if (badDate) {
        findings.push({
          finding_id: nextId(),
          discrepancy_type: 'INVALID_DATE',
          study_id: cleanStr(sId),
          participant_id: cleanStr(pId),
          sample_id: cleanStr(smpId),
          severity: 'MEDIUM',
          description: `${sourceName} record at row ${rowNum} contains unparseable collection date '${cDate}'.`,
          ecrf_evidence: sourceName === 'eCRF' ? evidence : null,
          lab_evidence: sourceName === 'Central Lab' ? evidence : null,
          rule_triggered: 'RULE-INVALID-DATE',
          suggested_investigation_step: 'Correct date formatting to standard ISO YYYY-MM-DD.',
          review_status: 'Needs Review',
        });
      }

      // Check INVALID_NUMERIC_VALUE
      if (!isEmpty(val)) {
        const { isInvalid: badNum } = parseNumeric(val);
        if (badNum) {
          findings.push({
            finding_id: nextId(),
            discrepancy_type: 'INVALID_NUMERIC_VALUE',
            study_id: cleanStr(sId),
            participant_id: cleanStr(pId),
            sample_id: cleanStr(smpId),
            severity: 'HIGH',
            description: `${sourceName} record at row ${rowNum} contains non-numeric result value '${val}'.`,
            ecrf_evidence: sourceName === 'eCRF' ? evidence : null,
            lab_evidence: sourceName === 'Central Lab' ? evidence : null,
            rule_triggered: 'RULE-INVALID-NUMERIC-VALUE',
            suggested_investigation_step: 'Inspect laboratory instrument transcript for data transcription errors.',
            review_status: 'Needs Review',
          });
        }
      }

      const key = `${cleanStr(sId)}::${cleanStr(pId)}::${cleanStr(smpId)}`;
      return { rowNum, key, evidence };
    });
  }

  const ecrfProcessed = processIntegrity(ecrfRows, 'eCRF', 'reported_value');
  const labProcessed = processIntegrity(labRows, 'Central Lab', 'lab_value');

  // 2. Duplicate keys check
  const ecrfKeyMap = new Map();
  for (const item of ecrfProcessed) {
    if (item.key) {
      if (!ecrfKeyMap.has(item.key)) ecrfKeyMap.set(item.key, []);
      ecrfKeyMap.get(item.key).push(item);
    }
  }

  const labKeyMap = new Map();
  for (const item of labProcessed) {
    if (item.key) {
      if (!labKeyMap.has(item.key)) labKeyMap.set(item.key, []);
      labKeyMap.get(item.key).push(item);
    }
  }

  for (const [kStr, entries] of ecrfKeyMap.entries()) {
    if (entries.length > 1) {
      const [sId, pId, smpId] = kStr.split('::');
      findings.push({
        finding_id: nextId(),
        discrepancy_type: 'DUPLICATE_KEY',
        study_id: sId,
        participant_id: pId,
        sample_id: smpId,
        severity: 'HIGH',
        description: `Duplicate compound key (${sId}, ${pId}, ${smpId}) found in eCRF across ${entries.length} rows.`,
        ecrf_evidence: entries[0].evidence,
        lab_evidence: null,
        rule_triggered: 'RULE-DUPLICATE-KEY',
        suggested_investigation_step: 'Review site data entry logs to identify and remove duplicated record.',
        review_status: 'Needs Review',
      });
    }
  }

  for (const [kStr, entries] of labKeyMap.entries()) {
    if (entries.length > 1) {
      const [sId, pId, smpId] = kStr.split('::');
      findings.push({
        finding_id: nextId(),
        discrepancy_type: 'DUPLICATE_KEY',
        study_id: sId,
        participant_id: pId,
        sample_id: smpId,
        severity: 'HIGH',
        description: `Duplicate compound key (${sId}, ${pId}, ${smpId}) found in Central Lab across ${entries.length} rows.`,
        ecrf_evidence: null,
        lab_evidence: entries[0].evidence,
        rule_triggered: 'RULE-DUPLICATE-KEY',
        suggested_investigation_step: 'Clarify multiple aliquots or re-accessioning with central laboratory.',
        review_status: 'Needs Review',
      });
    }
  }

  // 3. Cross-Source Matching
  const allKeys = new Set([...ecrfKeyMap.keys(), ...labKeyMap.keys()]);
  let matchedCount = 0;

  for (const kStr of Array.from(allKeys).sort()) {
    const [sId, pId, smpId] = kStr.split('::');
    const inEcrf = ecrfKeyMap.has(kStr);
    const inLab = labKeyMap.has(kStr);

    if (inEcrf && !inLab) {
      const ev = ecrfKeyMap.get(kStr)[0].evidence;
      findings.push({
        finding_id: nextId(),
        discrepancy_type: 'MISSING_LAB_RECORD',
        study_id: sId,
        participant_id: pId,
        sample_id: smpId,
        severity: 'HIGH',
        description: `Sample '${smpId}' recorded in eCRF (row ${ev.row_number}) is absent in Central Lab records.`,
        ecrf_evidence: ev,
        lab_evidence: null,
        rule_triggered: 'RULE-MISSING-LAB-RECORD',
        suggested_investigation_step: 'Verify sample receipt in Central Lab accession manifest.',
        review_status: 'Needs Review',
      });
      continue;
    }

    if (inLab && !inEcrf) {
      const ev = labKeyMap.get(kStr)[0].evidence;
      findings.push({
        finding_id: nextId(),
        discrepancy_type: 'MISSING_ECRF_RECORD',
        study_id: sId,
        participant_id: pId,
        sample_id: smpId,
        severity: 'HIGH',
        description: `Sample '${smpId}' received in Central Lab (row ${ev.row_number}) is missing from eCRF.`,
        ecrf_evidence: null,
        lab_evidence: ev,
        rule_triggered: 'RULE-MISSING-ECRF-RECORD',
        suggested_investigation_step: 'Check if site clinical coordinator omitted logging sample collection.',
        review_status: 'Needs Review',
      });
      continue;
    }

    // Present in both
    matchedCount++;
    const eEntry = ecrfKeyMap.get(kStr)[0].evidence;
    const lEntry = labKeyMap.get(kStr)[0].evidence;

    // A. Date mismatch
    const eDt = parseDateExplicit(eEntry.collection_date);
    const lDt = parseDateExplicit(lEntry.collection_date);
    if (eDt.date && lDt.date && eDt.date !== lDt.date) {
      findings.push({
        finding_id: nextId(),
        discrepancy_type: 'DATE_MISMATCH',
        study_id: sId,
        participant_id: pId,
        sample_id: smpId,
        severity: 'MEDIUM',
        description: `Collection date mismatch: eCRF has ${eDt.date} while Lab has ${lDt.date}.`,
        ecrf_evidence: eEntry,
        lab_evidence: lEntry,
        rule_triggered: 'RULE-DATE-MISMATCH',
        suggested_investigation_step: 'Cross-reference tube barcode timestamp against clinic intake sheet.',
        review_status: 'Needs Review',
      });
    }

    // B. Analyte mismatch
    const eAnalyte = cleanStr(eEntry.analyte);
    const lAnalyte = cleanStr(lEntry.analyte);
    if (eAnalyte && lAnalyte && eAnalyte.toLowerCase() !== lAnalyte.toLowerCase()) {
      findings.push({
        finding_id: nextId(),
        discrepancy_type: 'ANALYTE_MISMATCH',
        study_id: sId,
        participant_id: pId,
        sample_id: smpId,
        severity: 'HIGH',
        description: `Analyte names disagree: eCRF recorded '${eAnalyte}' but Central Lab reported '${lAnalyte}'.`,
        ecrf_evidence: eEntry,
        lab_evidence: lEntry,
        rule_triggered: 'RULE-ANALYTE-MISMATCH',
        suggested_investigation_step: 'Review laboratory order code mapping for this protocol visit.',
        review_status: 'Needs Review',
      });
    }

    // C. Missing value
    const eEmpty = isEmpty(eEntry.value);
    const lEmpty = isEmpty(lEntry.value);

    if (eEmpty && !lEmpty) {
      findings.push({
        finding_id: nextId(),
        discrepancy_type: 'MISSING_VALUE',
        study_id: sId,
        participant_id: pId,
        sample_id: smpId,
        severity: 'MEDIUM',
        description: `eCRF result value is blank while Central Lab has '${lEntry.value}'.`,
        ecrf_evidence: eEntry,
        lab_evidence: lEntry,
        rule_triggered: 'RULE-MISSING-VALUE',
        suggested_investigation_step: 'Prompt clinical research coordinator to transcribe result value into eCRF.',
        review_status: 'Needs Review',
      });
    } else if (lEmpty && !eEmpty) {
      findings.push({
        finding_id: nextId(),
        discrepancy_type: 'MISSING_VALUE',
        study_id: sId,
        participant_id: pId,
        sample_id: smpId,
        severity: 'HIGH',
        description: `Central Lab result is pending or empty while eCRF recorded '${eEntry.value}'.`,
        ecrf_evidence: eEntry,
        lab_evidence: lEntry,
        rule_triggered: 'RULE-MISSING-VALUE',
        suggested_investigation_step: 'Verify if lab sample was rejected, hemolyzed, or still in process.',
        review_status: 'Needs Review',
      });
    }

    // D. Unit mismatch
    const eUnit = cleanStr(eEntry.unit);
    const lUnit = cleanStr(lEntry.unit);
    let unitCompatible = true;

    if (isEmpty(eUnit) || isEmpty(lUnit)) {
      unitCompatible = false;
      findings.push({
        finding_id: nextId(),
        discrepancy_type: 'UNIT_MISMATCH',
        study_id: sId,
        participant_id: pId,
        sample_id: smpId,
        severity: 'HIGH',
        description: `Missing or unspecified unit of measure (eCRF: '${eUnit}', Lab: '${lUnit}').`,
        ecrf_evidence: eEntry,
        lab_evidence: lEntry,
        rule_triggered: 'RULE-UNIT-MISMATCH',
        suggested_investigation_step: 'Confirm standard protocol unit of measure before comparing values.',
        review_status: 'Needs Review',
      });
    } else if (eUnit.toLowerCase() !== lUnit.toLowerCase()) {
      unitCompatible = false;
      findings.push({
        finding_id: nextId(),
        discrepancy_type: 'UNIT_MISMATCH',
        study_id: sId,
        participant_id: pId,
        sample_id: smpId,
        severity: 'HIGH',
        description: `Unit mismatch: eCRF is '${eUnit}' vs Central Lab '${lUnit}'. Unverified unit conversion prohibited.`,
        ecrf_evidence: eEntry,
        lab_evidence: lEntry,
        rule_triggered: 'RULE-UNIT-MISMATCH',
        suggested_investigation_step: 'Verify protocol specification for authorized unit conversion.',
        review_status: 'Needs Review',
      });
    }

    // E. Numeric value mismatch
    if (unitCompatible && !eEmpty && !lEmpty) {
      const eNum = parseNumeric(eEntry.value);
      const lNum = parseNumeric(lEntry.value);
      if (!eNum.isInvalid && !lNum.isInvalid && eNum.num !== null && lNum.num !== null) {
        const delta = Math.abs(eNum.num - lNum.num);
        if (delta > numericTolerance) {
          findings.push({
            finding_id: nextId(),
            discrepancy_type: 'VALUE_MISMATCH',
            study_id: sId,
            participant_id: pId,
            sample_id: smpId,
            severity: delta > 1.0 ? 'HIGH' : 'MEDIUM',
            description: `Numeric value mismatch: eCRF recorded ${eNum.num} while Central Lab reported ${lNum.num} (delta: ${delta.toFixed(4)} ${eUnit}).`,
            ecrf_evidence: eEntry,
            lab_evidence: lEntry,
            rule_triggered: 'RULE-VALUE-MISMATCH',
            suggested_investigation_step: 'Investigate transcription or instrument calibration discrepancy.',
            review_status: 'Needs Review',
          });
        }
      }
    }
  }

  // Summary Metrics
  const byCategory = {};
  const byPriority = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  const byRule = {};

  for (const f of findings) {
    byCategory[f.discrepancy_type] = (byCategory[f.discrepancy_type] || 0) + 1;
    byPriority[f.severity] = (byPriority[f.severity] || 0) + 1;
    byRule[f.rule_triggered] = (byRule[f.rule_triggered] || 0) + 1;
  }

  const reconId = `REC-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;

  return {
    reconciliation_id: reconId,
    summary: {
      total_ecrf_records: ecrfRows.length,
      total_lab_records: labRows.length,
      matched_records: matchedCount,
      total_discrepancies: findings.length,
      discrepancies_by_category: byCategory,
      discrepancies_by_priority: byPriority,
      discrepancies_by_rule: byRule,
    },
    discrepancies: findings,
    source_row_counts: {
      ecrf_rows: ecrfRows.length,
      lab_rows: labRows.length,
    },
    reconciliation_metadata: {
      engine_version: '1.0.0-client',
      executed_at: new Date().toISOString(),
      numeric_tolerance: numericTolerance,
      matching_keys: ['study_id', 'participant_id', 'sample_id'],
    },
  };
}
