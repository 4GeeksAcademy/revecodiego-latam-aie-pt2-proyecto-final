from __future__ import annotations

import csv
import io
from typing import Any

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from incidents_analysis import compute_summary, validate_record
from routes.suppliers import router as suppliers_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(suppliers_router, prefix="/suppliers", tags=["suppliers"])

LAST_ANALYSIS_RESULT: dict[str, Any] | None = None

REQUIRED_COLUMNS = {
    "ticket_id",
    "date",
    "client_company",
    "category",
    "description",
    "agent_id",
    "status",
    "customer_email",
    "satisfaction_score",
}


def _build_metrics_rows(summary: dict[str, Any]) -> list[tuple[str, str | int | float]]:
    totals = summary["totals"]
    invalid_reason_counts = summary["invalid_reasons"]["counts"]
    category_counts = summary["categories"]["counts"]
    status_counts = summary["statuses"]["counts"]
    average_score = summary["satisfaction"]["average_score"]
    score_counts = summary["satisfaction"]["score_counts"]

    rows: list[tuple[str, str | int | float]] = [
        ("total_records", totals["total_records"]),
        ("valid_records", totals["valid_records"]),
        ("invalid_records", totals["invalid_records"]),
        ("invalid_missing_client_company", invalid_reason_counts["missing_client_company"]),
        ("invalid_category", invalid_reason_counts["invalid_category"]),
        ("invalid_email", invalid_reason_counts["invalid_email"]),
        ("invalid_closed_no_score", invalid_reason_counts["closed_no_score"]),
    ]

    for reason in ["invalid_description", "invalid_agent_id", "score_out_of_range"]:
        count = invalid_reason_counts[reason]
        if count > 0:
            rows.append((reason, count))

    rows.extend(
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

    return rows


@app.post("/api/incidents/analyze")
async def analyze_incidents(file: UploadFile | None = File(None)) -> dict[str, Any]:
    global LAST_ANALYSIS_RESULT

    if file is None:
        return JSONResponse(status_code=400, content={"error": "Debes adjuntar un archivo CSV."})

    content = await file.read()
    if not content:
        return JSONResponse(status_code=400, content={"error": "El archivo está vacío."})

    try:
        text_content = content.decode("utf-8")
    except UnicodeDecodeError:
        return JSONResponse(
            status_code=400,
            content={"error": "El archivo debe estar codificado en UTF-8."},
        )

    try:
        reader = csv.DictReader(io.StringIO(text_content), delimiter=",")
    except csv.Error:
        return JSONResponse(status_code=400, content={"error": "No se pudo parsear el archivo CSV."})

    if not reader.fieldnames:
        return JSONResponse(status_code=400, content={"error": "El CSV no contiene encabezados válidos."})

    fieldnames = {name.strip() for name in reader.fieldnames if name is not None}
    if not REQUIRED_COLUMNS.issubset(fieldnames):
        return JSONResponse(
            status_code=400,
            content={"error": "El CSV no contiene las columnas requeridas para el análisis."},
        )

    valid_records: list[dict] = []
    invalid_records: list[dict] = []

    try:
        for record in reader:
            is_valid, reason = validate_record(record)
            if is_valid:
                valid_records.append(record)
            else:
                invalid_record = dict(record)
                invalid_record["_invalid_reason"] = reason
                invalid_records.append(invalid_record)
    except csv.Error:
        return JSONResponse(status_code=400, content={"error": "No se pudo parsear el archivo CSV."})

    summary = compute_summary(valid_records, invalid_records)
    LAST_ANALYSIS_RESULT = summary
    return summary


@app.get("/api/incidents/results/export")
def export_last_results() -> StreamingResponse:
    if LAST_ANALYSIS_RESULT is None:
        return JSONResponse(
            status_code=404,
            content={"error": "No hay resultados disponibles. Ejecuta un análisis primero."},
        )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["metric", "value"])
    writer.writerows(_build_metrics_rows(LAST_ANALYSIS_RESULT))
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="results.csv"'},
    )
