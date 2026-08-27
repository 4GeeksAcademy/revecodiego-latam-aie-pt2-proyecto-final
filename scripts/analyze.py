#!/usr/bin/env python3

from __future__ import annotations

import csv
from pathlib import Path
import sys

from incidents_analysis import (
    VALID_CATEGORIES,
    VALID_STATUSES,
    compute_summary,
    validate_record,
)


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

    summary = compute_summary(valid_records, invalid_records)
    valid_count = summary["totals"]["valid_records"]
    invalid_count = summary["totals"]["invalid_records"]
    category_counts = summary["categories"]["counts"]
    category_percentages = summary["categories"]["percentages"]
    status_counts = summary["statuses"]["counts"]
    status_percentages = summary["statuses"]["percentages"]
    invalid_reason_counts = summary["invalid_reasons"]["counts"]
    closed_total = summary["satisfaction"]["closed_total"]
    scored_tickets = summary["satisfaction"]["scored_tickets"]
    average_score = summary["satisfaction"]["average_score"]
    score_counts = summary["satisfaction"]["score_counts"]

    source_file = Path(csv_path).name

    def pct(value: float) -> str:
        return f"{value:.1f}"

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
        f"  ├─ TECHNICAL .................... {category_counts['TECHNICAL']}  ({pct(category_percentages['TECHNICAL'])}%)"
    )
    print(
        f"  ├─ BILLING ...................... {category_counts['BILLING']}  ({pct(category_percentages['BILLING'])}%)"
    )
    print(
        f"  ├─ ACCESS ....................... {category_counts['ACCESS']}  ({pct(category_percentages['ACCESS'])}%)"
    )
    print(
        f"  ├─ HR_QUERY ..................... {category_counts['HR_QUERY']}  ({pct(category_percentages['HR_QUERY'])}%)"
    )
    print(
        f"  └─ COMPLAINT .................... {category_counts['COMPLAINT']}  ({pct(category_percentages['COMPLAINT'])}%)"
    )

    print()
    print("BREAKDOWN BY STATUS (valid records)")
    print(f"  ├─ OPEN ......................... {status_counts['OPEN']}  ({pct(status_percentages['OPEN'])}%)")
    print(f"  ├─ CLOSED ....................... {status_counts['CLOSED']}  ({pct(status_percentages['CLOSED'])}%)")
    print(
        f"  └─ DISCARDED .................... {status_counts['DISCARDED']}  ({pct(status_percentages['DISCARDED'])}%)"
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
