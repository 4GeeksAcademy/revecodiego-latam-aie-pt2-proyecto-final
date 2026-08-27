from __future__ import annotations

from .validation import VALID_CATEGORIES, VALID_STATUSES


def compute_summary(valid_records: list[dict], invalid_records: list[dict]) -> dict:
    category_order = ["TECHNICAL", "BILLING", "ACCESS", "HR_QUERY", "COMPLAINT"]
    status_order = ["OPEN", "CLOSED", "DISCARDED"]
    invalid_reason_order = [
        "missing_client_company",
        "invalid_category",
        "invalid_description",
        "invalid_agent_id",
        "invalid_email",
        "closed_no_score",
        "score_out_of_range",
    ]

    valid_count = len(valid_records)
    invalid_count = len(invalid_records)
    total_records = valid_count + invalid_count

    category_counts = {category: 0 for category in category_order}
    status_counts = {status: 0 for status in status_order}

    for record in valid_records:
        category = (record.get("category") or "").strip()
        status = (record.get("status") or "").strip()
        if category in category_counts:
            category_counts[category] += 1
        if status in status_counts:
            status_counts[status] += 1

    def pct(part: int, total_amount: int) -> float:
        if total_amount == 0:
            return 0.0
        return (part / total_amount) * 100.0

    category_percentages = {
        category: pct(count, valid_count) for category, count in category_counts.items()
    }
    status_percentages = {
        status: pct(count, valid_count) for status, count in status_counts.items()
    }

    invalid_reason_counts = {reason: 0 for reason in invalid_reason_order}
    for record in invalid_records:
        reason = record.get("_invalid_reason")
        if reason in invalid_reason_counts:
            invalid_reason_counts[reason] += 1

    closed_records = [
        record for record in valid_records if (record.get("status") or "").strip() == "CLOSED"
    ]
    closed_total = len(closed_records)
    score_counts = {score: 0 for score in range(1, 6)}
    score_sum = 0
    scored_tickets = 0

    for record in closed_records:
        satisfaction_score = (record.get("satisfaction_score") or "").strip()
        if not satisfaction_score:
            continue

        score = int(satisfaction_score)
        if score in score_counts:
            score_counts[score] += 1
            scored_tickets += 1
            score_sum += score

    average_score = (score_sum / scored_tickets) if scored_tickets else 0.0

    extra_invalid_reasons = [
        reason
        for reason in ["invalid_description", "invalid_agent_id", "score_out_of_range"]
        if invalid_reason_counts[reason] > 0
    ]

    return {
        "totals": {
            "total_records": total_records,
            "valid_records": valid_count,
            "invalid_records": invalid_count,
        },
        "categories": {
            "order": category_order,
            "valid_values": sorted(VALID_CATEGORIES),
            "counts": category_counts,
            "percentages": category_percentages,
        },
        "statuses": {
            "order": status_order,
            "valid_values": sorted(VALID_STATUSES),
            "counts": status_counts,
            "percentages": status_percentages,
        },
        "invalid_reasons": {
            "order": invalid_reason_order,
            "counts": invalid_reason_counts,
            "extra_present": extra_invalid_reasons,
        },
        "satisfaction": {
            "closed_total": closed_total,
            "scored_tickets": scored_tickets,
            "average_score": average_score,
            "score_counts": score_counts,
        },
    }
