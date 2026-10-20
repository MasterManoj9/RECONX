"""Supabase storage adapter for ReconX.

Persists reconciliations and audit trail records to Supabase PostgreSQL,
with seamless fallback to InMemoryStore if Supabase is unavailable or offline.
"""

from __future__ import annotations

import os
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger("reconx.supabase")

# Supabase Credentials (configured with your project credentials)
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://vjshgqdtshyhhnpjfbzv.supabase.co")
SUPABASE_KEY = os.environ.get(
    "SUPABASE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqc2hncWR0c2h5aGhucGpmYnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0ODgzMDksImV4cCI6MjEwODA2NDMwOX0.f46rrC01s-ZJU4uEYJZLbEYCiS4ER5Gr34oZgEw5D6g",
)

supabase_client = None
try:
    if SUPABASE_URL and SUPABASE_KEY:
        from supabase import create_client, Client
        supabase_client: Optional[Client] = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized successfully.")
except Exception as e:
    logger.warning("Failed to initialize Supabase client: %s", e)
    supabase_client = None


class UnifiedStore:
    """Unified store providing persistence in Supabase with local memory fallback."""

    def __init__(self):
        self.reconciliations: Dict[str, Dict[str, Any]] = {}
        self.audit_log: List[Dict[str, Any]] = []

    @property
    def is_supabase_enabled(self) -> bool:
        return supabase_client is not None

    def clear(self) -> None:
        """Clear local cache (used in test fixtures)."""
        self.reconciliations.clear()
        self.audit_log.clear()

    def save_reconciliation(self, recon_id: str, data: Dict[str, Any]) -> None:
        # Cache locally
        self.reconciliations[recon_id] = data

        if self.is_supabase_enabled:
            try:
                row = {
                    "reconciliation_id": recon_id,
                    "summary": data.get("summary", {}),
                    "discrepancies": data.get("discrepancies", []),
                    "source_files": data.get("source_files", {}),
                    "source_row_counts": data.get("source_row_counts", {}),
                    "reconciliation_metadata": data.get("reconciliation_metadata", {}),
                }
                supabase_client.table("reconciliations").upsert(row).execute()
            except Exception as e:
                logger.error("Supabase error saving reconciliation %s: %s", recon_id, e)

    def get_reconciliation(self, recon_id: str) -> Optional[Dict[str, Any]]:
        if self.is_supabase_enabled:
            try:
                res = (
                    supabase_client.table("reconciliations")
                    .select("*")
                    .eq("reconciliation_id", recon_id)
                    .execute()
                )
                if res.data and len(res.data) > 0:
                    row = res.data[0]
                    return {
                        "reconciliation_id": row.get("reconciliation_id"),
                        "summary": row.get("summary"),
                        "discrepancies": row.get("discrepancies"),
                        "source_files": row.get("source_files"),
                        "source_row_counts": row.get("source_row_counts"),
                        "reconciliation_metadata": row.get("reconciliation_metadata"),
                    }
            except Exception as e:
                logger.warning("Supabase lookup failed for %s: %s", recon_id, e)

        # Fallback to local memory
        return self.reconciliations.get(recon_id)

    def add_audit_event(self, event: Dict[str, Any]) -> None:
        self.audit_log.append(event)

        if self.is_supabase_enabled:
            try:
                row = {
                    "event_id": event.get("event_id"),
                    "timestamp": event.get("timestamp"),
                    "action": event.get("action"),
                    "finding_id": event.get("finding_id"),
                    "reviewer_id": event.get("reviewer_id", "SYSTEM"),
                    "previous_review_status": event.get("previous_review_status"),
                    "new_review_status": event.get("new_review_status"),
                    "decision": event.get("decision"),
                    "rationale": event.get("rationale"),
                    "reconciliation_id": event.get("reconciliation_id"),
                    "finding_updated": event.get("finding_updated", False),
                    "details": event.get("details", {}),
                }
                supabase_client.table("audit_trail").insert(row).execute()
            except Exception as e:
                logger.error("Supabase error inserting audit event: %s", e)

    def get_audit_events(self) -> List[Dict[str, Any]]:
        if self.is_supabase_enabled:
            try:
                res = (
                    supabase_client.table("audit_trail")
                    .select("*")
                    .order("timestamp", desc=True)
                    .execute()
                )
                if res.data:
                    return res.data
            except Exception as e:
                logger.warning("Supabase audit query failed: %s", e)

        return list(self.audit_log)
