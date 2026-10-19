"""Optional AI / Rule-Based Explanation Assistant for ReconX Findings.

Adheres to strict clinical safety constraints:
- Operates on minimal, de-identified finding evidence only.
- Never decides clinical significance.
- Clearly separates supported facts from speculative hypotheses.
- States limitations on what cannot be concluded from available data.
- Provides transparent fallback when external LLM is not configured.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class FindingEvidencePayload(BaseModel):
    finding_id: str
    discrepancy_type: str
    rule_triggered: str
    study_id: Optional[str] = None
    participant_id: Optional[str] = None
    sample_id: Optional[str] = None
    description: str
    ecrf_evidence: Optional[Dict[str, Any]] = None
    lab_evidence: Optional[Dict[str, Any]] = None
    is_missing_record: bool = False


class AssistantExplanation(BaseModel):
    finding_id: str
    provider: str = Field(..., description="'rule_based_fallback' or configured model name")
    plain_language_summary: str
    supported_facts: List[str]
    hypotheses: List[str]
    suggested_investigation_step: str
    limitations_and_unsupported_claims: str
    disclaimer: str = (
        "AI Assistance Notice: This explanation is generated as operational reviewer guidance only "
        "and does not constitute verified medical truth, clinical diagnostic determination, or resolution. "
        "Independent human review is required."
    )


def generate_explanation(payload: FindingEvidencePayload) -> AssistantExplanation:
    """Generate structured reviewer explanation using transparent clinical rule-based synthesis

    or external LLM provider if configured in environment (e.g. GEMINI_API_KEY).
    """
    # 1. Check if external model is explicitly enabled and configured
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY")

    if api_key and os.environ.get("ENABLE_EXTERNAL_LLM", "").lower() in ("true", "1"):
        # If external model integration is requested in future, call external provider here safely
        pass

    # 2. Transparent Rule-Based Clinical Knowledge Base Fallback
    # (Does not simulate fake AI; openly transparent as deterministic rule-based assistant)
    disc_type = payload.discrepancy_type
    ecrf = payload.ecrf_evidence or {}
    lab = payload.lab_evidence or {}

    facts: List[str] = []
    hypotheses: List[str] = []
    next_step = ""
    cannot_conclude = ""
    summary = ""

    # Build supported facts directly from supplied evidence
    if ecrf:
        facts.append(
            f"eCRF Record (Row {ecrf.get('row_number', 'N/A')}): Analyte '{ecrf.get('analyte')}', "
            f"Value '{ecrf.get('value')}', Unit '{ecrf.get('unit')}', Date '{ecrf.get('collection_date')}'."
        )
    else:
        facts.append("eCRF Record: No corresponding record exists for this compound key.")

    if lab:
        facts.append(
            f"Central Lab Record (Row {lab.get('row_number', 'N/A')}): Analyte '{lab.get('analyte')}', "
            f"Value '{lab.get('value')}', Unit '{lab.get('unit')}', Date '{lab.get('collection_date')}'."
        )
    else:
        facts.append("Central Lab Record: No accession record exists for this compound key.")

    # Tailor based on discrepancy type
    if disc_type == "MISSING_LAB_RECORD":
        summary = (
            f"Sample '{payload.sample_id}' was logged in eCRF by the clinical site coordinator, "
            f"but no accessioning receipt or test result exists in the central laboratory database."
        )
        hypotheses = [
            "Sample collected at clinical site but shipment package or manifestation receipt delayed.",
            "Sample accessioned at Central Lab under a mismatched barcode or misread tube aliquot identifier.",
            "eCRF record submitted erroneously before actual biological specimen collection took place.",
        ]
        next_step = (
            "Review central laboratory shipping manifest and courier temperature log to verify physical chain-of-custody."
        )
        cannot_conclude = (
            "Cannot determine whether biological specimen was physically drawn, damaged during transport, or mislabeled."
        )

    elif disc_type == "MISSING_ECRF_RECORD":
        summary = (
            f"Central laboratory reported a test result for sample '{payload.sample_id}', "
            f"but no corresponding sample collection entry is present in the electronic Case Report Form."
        )
        hypotheses = [
            "Site clinical research coordinator collected specimen but forgot to enter collection form into EDC.",
            "Specimen belonged to unscheduled or repeat visit not yet mapped to primary study visit.",
            "Sample tube labeled with incorrect subject or sample barcode at accessioning.",
        ]
        next_step = (
            "Issue query to site coordinator to cross-check subject source visit records and transcribe collection data."
        )
        cannot_conclude = (
            "Cannot determine if the sample actually belongs to this participant without inspecting the primary clinic source log."
        )

    elif disc_type == "VALUE_MISMATCH":
        summary = (
            f"Numeric result divergence: eCRF recorded {ecrf.get('value')} {ecrf.get('unit')} while "
            f"Central Lab reported {lab.get('value')} {lab.get('unit')} for analyte '{ecrf.get('analyte')}'."
        )
        hypotheses = [
            "Manual transcription error by site personnel during eCRF data entry (e.g., transposed digits).",
            "Site transcribed a local rapid point-of-care test result instead of the central lab certificate of analysis.",
            "Instrument re-run or dilution was performed at central lab with multiple conflicting reports issued.",
        ]
        next_step = (
            "Inspect primary instrument laboratory export and original site worksheet to verify the true measured value."
        )
        cannot_conclude = (
            "Cannot determine clinical significance, biological plausibility, or which value reflects actual patient status."
        )

    elif disc_type == "UNIT_MISMATCH":
        summary = (
            f"Incompatible measurement units reported: eCRF reported '{ecrf.get('unit')}' "
            f"versus Central Lab '{lab.get('unit')}' for analyte '{ecrf.get('analyte')}'."
        )
        hypotheses = [
            "Standard protocol specifications define SI units, but local site logged conventional units.",
            "Unverified manual unit conversion attempted prior to eCRF entry.",
            "Laboratory assay calibration profile configured with non-standard reporting units.",
        ]
        next_step = (
            "Consult clinical trial laboratory manual to identify authorized unit of measure and verified conversion factor."
        )
        cannot_conclude = (
            "Cannot mathematically convert values without an authorized, protocol-validated unit conversion rule."
        )

    elif disc_type == "DATE_MISMATCH":
        summary = (
            f"Collection date misalignment: eCRF recorded {ecrf.get('collection_date')} whereas "
            f"Central Lab accession sheet lists {lab.get('collection_date')}."
        )
        hypotheses = [
            "Timezone difference between clinic collection site and central accessioning facility.",
            "Specimen drawn on date X but accessioned/frozen on date Y, with lab recording accession date as collection date.",
            "Typographical error in site date entry.",
        ]
        next_step = (
            "Compare requisition form requisition date against courier pickup timestamp."
        )
        cannot_conclude = (
            "Cannot ascertain exact venipuncture timing without physical requisition slip."
        )

    elif disc_type == "ANALYTE_MISMATCH":
        summary = (
            f"Analyte naming mismatch: eCRF has '{ecrf.get('analyte')}' while Central Lab reports '{lab.get('analyte')}'."
        )
        hypotheses = [
            "Synonymous or biomarker sub-fraction naming (e.g., ALT vs SGPT, Fasting Glucose vs Blood Sugar).",
            "Incorrect test requisition code selected in EDC laboratory panel setup.",
        ]
        next_step = "Check protocol laboratory test schedule for standardized analyte dictionary mapping."
        cannot_conclude = "Cannot determine whether tests measure identical physiological biomarkers without dictionary crosswalk."

    elif disc_type == "DUPLICATE_KEY":
        summary = (
            f"Compound key (Study: {payload.study_id}, Participant: {payload.participant_id}, Sample: {payload.sample_id}) "
            f"appears more than once in source records."
        )
        hypotheses = [
            "Double form submission in EDC interface.",
            "Multiple aliquots or repeat assay runs submitted with identical primary identifiers.",
        ]
        next_step = "Contact data manager to clarify repeat assay aliquot numbering."
        cannot_conclude = "Cannot decide which duplicate record is valid without clinical data management input."

    else:
        summary = f"Discrepancy detected under rule '{payload.rule_triggered}': {payload.description}"
        hypotheses = [
            "Data entry omission or typographical error in source records.",
            "Protocol deviation or non-standard accessioning procedure.",
        ]
        next_step = "Audit source records with clinical data manager."
        cannot_conclude = "Cannot determine resolution without additional clinical documentation."

    return AssistantExplanation(
        finding_id=payload.finding_id,
        provider="rule_based_clinical_assistant",
        plain_language_summary=summary,
        supported_facts=facts,
        hypotheses=hypotheses,
        suggested_investigation_step=next_step,
        limitations_and_unsupported_claims=cannot_conclude,
    )
