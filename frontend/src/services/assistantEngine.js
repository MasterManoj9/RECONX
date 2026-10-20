/**
 * ReconX Client-Side Assistant & Hypothesis Synthesizer
 * Formats clinical findings and limitations without requiring a running Python server.
 */

export function generateClientExplanation(finding) {
  const ecrf = finding.ecrf_evidence || {};
  const lab = finding.lab_evidence || {};
  const discType = finding.discrepancy_type;

  const facts = [];
  if (finding.ecrf_evidence) {
    facts.push(
      `eCRF Record (Row ${ecrf.row_number || 'N/A'}): Analyte '${ecrf.analyte || '—'}', Value '${ecrf.value || '—'}', Unit '${ecrf.unit || '—'}', Date '${ecrf.collection_date || '—'}'.`
    );
  } else {
    facts.push('eCRF Record: No corresponding record found for this compound identifier.');
  }

  if (finding.lab_evidence) {
    facts.push(
      `Central Lab Record (Row ${lab.row_number || 'N/A'}): Analyte '${lab.analyte || '—'}', Value '${lab.value || '—'}', Unit '${lab.unit || '—'}', Date '${lab.collection_date || '—'}'.`
    );
  } else {
    facts.push('Central Lab Record: No accession record found for this compound identifier.');
  }

  let summary;
  let hypotheses;
  const nextStep = finding.suggested_investigation_step || 'Audit source documents with clinical data manager.';
  let limitations = 'Cannot determine clinical significance, biological plausibility, or true subject diagnosis from available metadata.';

  if (discType === 'MISSING_LAB_RECORD') {
    summary = `Sample '${finding.sample_id}' was logged in eCRF, but no accession receipt or test result exists in the central laboratory database.`;
    hypotheses = [
      'Sample was collected at site but courier manifest receipt is delayed or missing.',
      'Sample accessioned at Central Lab under a different aliquot barcode.',
      'eCRF entry was logged prematurely prior to confirmed sample draw.',
    ];
    limitations = 'Cannot determine whether specimen was drawn, damaged during transport, or mislabeled.';
  } else if (discType === 'MISSING_ECRF_RECORD') {
    summary = `Central lab recorded sample '${finding.sample_id}', but no corresponding entry is present in eCRF.`;
    hypotheses = [
      'Site coordinator collected the specimen but omitted entering the collection form in EDC.',
      'Specimen belongs to an unscheduled visit not yet logged.',
    ];
  } else if (discType === 'VALUE_MISMATCH') {
    summary = `Numeric result discrepancy: eCRF recorded '${ecrf.value}' while Central Lab reported '${lab.value}' for ${ecrf.analyte || 'analyte'}.`;
    hypotheses = [
      'Manual transcription error during eCRF data entry.',
      'Site logged a point-of-care rapid test rather than the central lab result.',
      'Instrument re-run occurred at the laboratory.',
    ];
  } else if (discType === 'UNIT_MISMATCH') {
    summary = `Incompatible units of measure reported: eCRF has '${ecrf.unit}' vs Central Lab '${lab.unit}'.`;
    hypotheses = [
      'Site entered conventional units while central lab reported standard SI units.',
      'Automated unit conversion was attempted without a validated conversion factor.',
    ];
  } else {
    summary = finding.description;
    hypotheses = [
      'Discrepancy due to non-standard accessioning or transcription variation.',
      'Potential clinical protocol deviation.',
    ];
  }

  return {
    finding_id: finding.finding_id,
    provider: 'rule_based_clinical_assistant',
    plain_language_summary: summary,
    supported_facts: facts,
    hypotheses,
    suggested_investigation_step: nextStep,
    limitations_and_unsupported_claims: limitations,
    disclaimer:
      'AI Assistance Notice: This explanation is generated as reviewer guidance and does not constitute verified medical truth or clinical diagnosis. Human review is required.',
  };
}
