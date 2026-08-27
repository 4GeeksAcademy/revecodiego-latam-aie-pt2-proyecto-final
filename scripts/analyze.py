#!/usr/bin/env python3

from __future__ import annotations

import csv
from pathlib import Path
import re
import sys

VALID_CATEGORIES = {"TECHNICAL", "BILLING", "ACCESS", "HR_QUERY", "COMPLAINT"}
VALID_STATUSES = {"OPEN", "CLOSED", "DISCARDED"}
AGENT_ID_PATTERN = re.compile(r"^AGT-[A-Za-z0-9]{2}$")


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

    if not agent_id or not AGENT_ID_PATTERN.fullmatch(agent_id):
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


def main() -> None:
    if len(sys.argv) < 2:
        print("Error: debes indicar la ruta al CSV. Uso: python analyze.py incidents-nexova.csv")
        sys.exit(1)

    csv_path = sys.argv[1]

    valid_records: list[dict] = []
    invalid_records: list[dict] = []

    try:
        with open(csv_path, "r", encoding="utf-8", newline="") as csv_file:
            reader = csv.DictReader(csv_file, delimiter=",")

            total = 0
            for record in reader:
                total += 1
                is_valid, reason = validate_record(record)

                if is_valid:
                    valid_records.append(record)
                else:
                    invalid_record = dict(record)
                    invalid_record["_invalid_reason"] = reason
                    invalid_records.append(invalid_record)
    except FileNotFoundError:
        print(f"Error: no se encontró el archivo CSV: {csv_path}")
        sys.exit(1)

    valid_count = len(valid_records)
    invalid_count = len(invalid_records)

    category_order = ["TECHNICAL", "BILLING", "ACCESS", "HR_QUERY", "COMPLAINT"]
    status_order = ["OPEN", "CLOSED", "DISCARDED"]

    category_counts = {category: 0 for category in category_order}
    status_counts = {status: 0 for status in status_order}

    for record in valid_records:
        category = (record.get("category") or "").strip()
        status = (record.get("status") or "").strip()
        if category in category_counts:
            category_counts[category] += 1
        if status in status_counts:
            status_counts[status] += 1

    invalid_reason_order = [
        "missing_client_company",
        "invalid_category",
        "invalid_description",
        "invalid_agent_id",
        "invalid_email",
        "closed_no_score",
        "score_out_of_range",
    ]
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

    source_file = Path(csv_path).name

    def pct(part: int, total_amount: int) -> str:
        if total_amount == 0:
            return "0.0"
        return f"{(part / total_amount) * 100:.1f}"

    print("=" * 60)
    print("  NEXOVA — SUPPORT TICKET ANALYSIS")
    print(f"  Source file: {source_file}")
    print("=" * 60)
    print()
    print(f"TOTAL RECORDS IN FILE .......... {total}")
    print(f"  ├─ Valid records ................ {valid_count}")
    print(f"  └─ Invalid / incomplete .......... {invalid_count}")
    print()
    print("INVALID RECORDS BREAKDOWN")
    print(f"  ├─ Missing client_company ........ {invalid_reason_counts['missing_client_company']}")
    print(f"  ├─ Invalid or missing category ... {invalid_reason_counts['invalid_category']}")
    print(f"  ├─ Invalid or missing email ...... {invalid_reason_counts['invalid_email']}")

    extra_invalid_lines = [
        ("Invalid or short description", invalid_reason_counts["invalid_description"]),
        ("Invalid or missing agent_id", invalid_reason_counts["invalid_agent_id"]),
        ("Score out of range (1-5)", invalid_reason_counts["score_out_of_range"]),
    ]
    for label, count in extra_invalid_lines:
        if count > 0:
            dots = "." * max(3, 33 - len(label))
            print(f"  ├─ {label} {dots} {count}")

    print(f"  └─ Closed ticket, no score ....... {invalid_reason_counts['closed_no_score']}")

    print()
    print("BREAKDOWN BY CATEGORY (valid records)")
    print(
        f"  ├─ TECHNICAL .................... {category_counts['TECHNICAL']}  ({pct(category_counts['TECHNICAL'], valid_count)}%)"
    )
    print(
        f"  ├─ BILLING ...................... {category_counts['BILLING']}  ({pct(category_counts['BILLING'], valid_count)}%)"
    )
    print(
        f"  ├─ ACCESS ....................... {category_counts['ACCESS']}  ({pct(category_counts['ACCESS'], valid_count)}%)"
    )
    print(
        f"  ├─ HR_QUERY ..................... {category_counts['HR_QUERY']}  ({pct(category_counts['HR_QUERY'], valid_count)}%)"
    )
    print(
        f"  └─ COMPLAINT .................... {category_counts['COMPLAINT']}  ({pct(category_counts['COMPLAINT'], valid_count)}%)"
    )

    print()
    print("BREAKDOWN BY STATUS (valid records)")
    print(f"  ├─ OPEN ......................... {status_counts['OPEN']}  ({pct(status_counts['OPEN'], valid_count)}%)")
    print(f"  ├─ CLOSED ....................... {status_counts['CLOSED']}  ({pct(status_counts['CLOSED'], valid_count)}%)")
    print(
        f"  └─ DISCARDED .................... {status_counts['DISCARDED']}  ({pct(status_counts['DISCARDED'], valid_count)}%)"
    )

    print()
    print("SATISFACTION INDEX (closed tickets)")
    print(f"  Scored tickets: {scored_tickets} of {closed_total}")
    print(f"  Average score: {average_score:.2f} / 5.00")
    print(f"  ├─ Score 1 (Very dissatisfied) ... {score_counts[1]}")
    print(f"  ├─ Score 2 (Dissatisfied) ........ {score_counts[2]}")
    print(f"  ├─ Score 3 (Neutral) ............ {score_counts[3]}")
    print(f"  ├─ Score 4 (Satisfied) .......... {score_counts[4]}")
    print(f"  └─ Score 5 (Very satisfied) ..... {score_counts[5]}")

    print()
    print("=" * 60)

    while True:
        export_answer = input("¿Deseas exportar los resultados a CSV? [s / n]: ").strip().lower()
        if export_answer in {"s", "n"}:
            break

    if export_answer == "n":
        print("Operación finalizada.")
        return

    metrics_rows: list[tuple[str, str | int | float]] = [
        ("total_records", total),
        ("valid_records", valid_count),
        ("invalid_records", invalid_count),
        ("invalid_missing_client_company", invalid_reason_counts["missing_client_company"]),
        ("invalid_category", invalid_reason_counts["invalid_category"]),
        ("invalid_email", invalid_reason_counts["invalid_email"]),
        ("invalid_closed_no_score", invalid_reason_counts["closed_no_score"]),
    ]

    extra_invalid_export_reasons = ["invalid_description", "invalid_agent_id", "score_out_of_range"]
    for reason in extra_invalid_export_reasons:
        count = invalid_reason_counts[reason]
        if count > 0:
            metrics_rows.append((reason, count))

    metrics_rows.extend(
        [
            ("category_technical", category_counts["TECHNICAL"]),
            ("category_billing", category_counts["BILLING"]),
            ("category_access", category_counts["ACCESS"]),
            ("category_hr_query", category_counts["HR_QUERY"]),
            ("category_complaint", category_counts["COMPLAINT"]),
            ("status_open", status_counts["OPEN"]),
            ("status_closed", status_counts["CLOSED"]),
            ("status_discarded", status_counts["DISCARDED"]),
            ("satisfaction_avg", f"{average_score:.2f}"),
            ("satisfaction_score_1", score_counts[1]),
            ("satisfaction_score_2", score_counts[2]),
            ("satisfaction_score_3", score_counts[3]),
            ("satisfaction_score_4", score_counts[4]),
            ("satisfaction_score_5", score_counts[5]),
        ]
    )

    results_path = Path(__file__).resolve().parent / "results.csv"
    with open(results_path, "w", encoding="utf-8", newline="") as results_file:
        writer = csv.writer(results_file)
        writer.writerow(["metric", "value"])
        writer.writerows(metrics_rows)

    print("Resultados exportados a results.csv")


if __name__ == "__main__":
    main()
