from __future__ import annotations

import re

VALID_CATEGORIES = {"TECHNICAL", "BILLING", "ACCESS", "HR_QUERY", "COMPLAINT"}
VALID_STATUSES = {"OPEN", "CLOSED", "DISCARDED"}

_AGENT_ID_PATTERN = re.compile(r"^AGT-[A-Za-z0-9]{2}$")


def validate_record(record: dict) -> tuple[bool, str | None]:
    client_company = (record.get("client_company") or "").strip()
    category = (record.get("category") or "").strip()
    description = (record.get("description") or "").strip()
    agent_id = (record.get("agent_id") or "").strip()
    customer_email = (record.get("customer_email") or "").strip()
    status = (record.get("status") or "").strip()
    satisfaction_score = (record.get("satisfaction_score") or "").strip()

    if not client_company:
        return False, "missing_client_company"

    if not category or category not in VALID_CATEGORIES:
        return False, "invalid_category"

    if not description or len(description) < 5:
        return False, "invalid_description"

    if not agent_id or not _AGENT_ID_PATTERN.fullmatch(agent_id):
        return False, "invalid_agent_id"

    if not customer_email or "@" not in customer_email:
        return False, "invalid_email"

    if status == "CLOSED" and not satisfaction_score:
        return False, "closed_no_score"

    if satisfaction_score:
        try:
            score = int(satisfaction_score)
        except ValueError:
            return False, "score_out_of_range"

        if score < 1 or score > 5:
            return False, "score_out_of_range"

    return True, None
