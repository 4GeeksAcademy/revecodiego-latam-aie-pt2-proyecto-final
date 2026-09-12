#!/usr/bin/env python3
"""Seed script to populate historical Nexova incidents into the API TinyDB database."""
from __future__ import annotations

import csv
from datetime import datetime, timezone
from pathlib import Path
import sys
from typing import Any

# Ensure packages and API modules are accessible
ROOT_DIR = Path(__file__).resolve().parent.parent
SHARED_PKG = ROOT_DIR / "packages" / "shared"
API_DIR = ROOT_DIR / "services" / "api"

if str(SHARED_PKG) not in sys.path:
    sys.path.insert(0, str(SHARED_PKG))
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from nexova_shared.incidents.validation import validate_record
from database import get_db, incidents_table

DEFAULT_CSV_PATH = Path(__file__).resolve().parent / "incidents-nexova.csv"

STATUS_MAPPING: dict[str, str] = {
    "OPEN": "open",
    "CLOSED": "resolved",
    "DISCARDED": "discarded",
}

CATEGORY_MAPPING: dict[str, str] = {
    "TECHNICAL": "technical_failure",
    "BILLING": "process_error",
    "ACCESS": "technical_failure",
    "HR_QUERY": "process_error",
    "COMPLAINT": "client_complaint",
}


def _parse_iso_date(date_str: str) -> str:
    """Convert YYYY-MM-DD date string to UTC midnight ISO 8601 string."""
    cleaned = date_str.strip()
    dt = datetime.strptime(cleaned, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    return dt.isoformat()


def seed_incidents(csv_path: Path | str = DEFAULT_CSV_PATH) -> dict[str, Any]:
    """Read CSV, validate and transform records, and insert into incidents table idempotently."""
    csv_file_path = Path(csv_path).resolve()
    if not csv_file_path.exists():
        raise FileNotFoundError(f"No se encontró el archivo CSV en: {csv_file_path}")

    db = get_db()
    seed_meta_table = db.table("_seed_metadata")

    # Build existing keys set from metadata and fallback matchers
    existing_keys: set[str] = set()
    for meta in seed_meta_table.all():
        key = meta.get("key")
        inc_id = meta.get("incident_id")
        if key:
            if inc_id is not None and incidents_table.contains(doc_id=int(inc_id)):
                existing_keys.add(key)
            elif inc_id is None:
                existing_keys.add(key)

    # Fallback to existing incidents in the table to prevent duplicate insertion
    for existing_doc in incidents_table.all():
        fallback_key = f"{existing_doc.get('title')}_{existing_doc.get('created_at')}"
        existing_keys.add(fallback_key)

    total_csv_records = 0
    valid_count = 0
    invalid_records: list[tuple[dict[str, str], str]] = []
    inserted_records: list[dict[str, Any]] = []
    already_existing_count = 0

    status_counts: dict[str, int] = {"open": 0, "resolved": 0, "discarded": 0, "in_progress": 0}
    category_counts: dict[str, int] = {
        "technical_failure": 0,
        "process_error": 0,
        "client_complaint": 0,
        "candidate_issue": 0,
        "staff_issue": 0,
        "sla_breach": 0,
        "data_quality": 0,
        "other": 0,
    }
    origin_counts: dict[str, int] = {"customer": 0, "branch": 0, "internal": 0}
    branch_counts: dict[str, int] = {
        "central": 0,
        "valencia_operations": 0,
        "miami_office": 0,
        "remote": 0,
    }

    with open(csv_file_path, mode="r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_csv_records += 1

            # 1. Validation with shared package
            is_valid, reason = validate_record(row)
            if not is_valid:
                invalid_records.append((row, reason or "validation_failed"))
                continue

            # 2. Status and category mapping check
            raw_status = (row.get("status") or "").strip()
            mapped_status = STATUS_MAPPING.get(raw_status)
            if mapped_status is None:
                invalid_records.append((row, f"unsupported_status: {raw_status}"))
                continue

            raw_category = (row.get("category") or "").strip()
            mapped_category = CATEGORY_MAPPING.get(raw_category)
            if mapped_category is None:
                invalid_records.append((row, f"unsupported_category: {raw_category}"))
                continue

            # 3. Model transformation
            raw_desc = row.get("description") or ""
            title = raw_desc.strip()[:120]
            if not title:
                invalid_records.append((row, "empty_title"))
                continue

            raw_date = row.get("date") or ""
            try:
                created_at_iso = _parse_iso_date(raw_date)
            except ValueError as exc:
                invalid_records.append((row, f"invalid_date_format: {raw_date}"))
                continue

            valid_count += 1

            # 4. Idempotency key
            ticket_id = (row.get("ticket_id") or "").strip()
            idempotency_key = ticket_id if ticket_id else f"{title}_{created_at_iso}"

            # Track counts for valid records
            status_counts[mapped_status] = status_counts.get(mapped_status, 0) + 1
            category_counts[mapped_category] = category_counts.get(mapped_category, 0) + 1
            origin_counts["customer"] = origin_counts.get("customer", 0) + 1
            branch_counts["central"] = branch_counts.get("central", 0) + 1

            if idempotency_key in existing_keys:
                already_existing_count += 1
                continue

            # 5. Insert valid incident
            incident_doc = {
                "title": title,
                "description": raw_desc,
                "category": mapped_category,
                "status": mapped_status,
                "origin": "customer",
                "branch": "central",
                "created_at": created_at_iso,
                "updated_at": created_at_iso,
            }

            doc_id = incidents_table.insert(incident_doc)
            seed_meta_table.insert(
                {
                    "key": idempotency_key,
                    "ticket_id": ticket_id,
                    "incident_id": doc_id,
                }
            )
            existing_keys.add(idempotency_key)
            inserted_records.append({"id": str(doc_id), **incident_doc})

    results = {
        "total_csv_records": total_csv_records,
        "valid_count": valid_count,
        "invalid_count": len(invalid_records),
        "inserted_count": len(inserted_records),
        "already_existing_count": already_existing_count,
        "invalid_records": invalid_records,
        "status_counts": status_counts,
        "category_counts": category_counts,
        "origin_counts": origin_counts,
        "branch_counts": branch_counts,
    }

    return results


def main() -> None:
    csv_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_CSV_PATH
    print(f"Iniciando seed de incidencias históricas desde: {csv_path}")

    try:
        results = seed_incidents(csv_path)
    except FileNotFoundError:
        print(f"Error: no se encontró el archivo CSV en {csv_path}", file=sys.stderr)
        sys.exit(1)
    except UnicodeDecodeError:
        print(f"Error: el archivo {csv_path} no tiene una codificación UTF-8 válida.", file=sys.stderr)
        sys.exit(1)
    except PermissionError:
        print(f"Error: permisos insuficientes para acceder a {csv_path}", file=sys.stderr)
        sys.exit(1)
    except csv.Error as exc:
        print(f"Error crítico de parseo CSV en {csv_path}: {exc}", file=sys.stderr)
        sys.exit(1)
    except OSError as exc:
        print(f"Error de E/S al leer {csv_path}: {exc}", file=sys.stderr)
        sys.exit(1)
    except Exception as exc:
        print(f"Error inesperado al ejecutar el seed: {exc}", file=sys.stderr)
        sys.exit(1)

    print("\n" + "=" * 50)
    print("RESUMEN DE SEED DE INCIDENCIAS")
    print("=" * 50)
    print(f"Total registros en CSV:       {results['total_csv_records']}")
    print(f"Registros válidos procesados: {results['valid_count']}")
    print(f"Registros inválidos:          {results['invalid_count']}")
    print(f"Nuevos registros insertados:  {results['inserted_count']}")
    print(f"Registros ya existentes:      {results['already_existing_count']}")
    print(f"Total en tabla 'incidents':   {len(incidents_table.all())}")

    if results["invalid_records"]:
        print("\nRegistros inválidos descartados:")
        for row, reason in results["invalid_records"]:
            ticket = row.get("ticket_id", "N/A")
            company = row.get("client_company", "N/A")
            print(f"  - [{ticket}] Empresa: '{company}' -> Motivo: {reason}")

    print("\nDistribución por Status:")
    for status_key, count in results["status_counts"].items():
        if count > 0:
            print(f"  - {status_key}: {count}")

    print("\nDistribución por Categoría:")
    for cat_key, count in results["category_counts"].items():
        if count > 0:
            print(f"  - {cat_key}: {count}")

    print("\nDistribución por Origen y Sucursal:")
    print(f"  - Origin (customer): {results['origin_counts']['customer']}")
    print(f"  - Branch (central):  {results['branch_counts']['central']}")
    print("=" * 50)


if __name__ == "__main__":
    main()
