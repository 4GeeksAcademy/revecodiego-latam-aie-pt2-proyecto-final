# Incidents Analysis API

Simple FastAPI service to analyze incident CSV files using the shared `incidents-analysis` package.

## Install dependencies

```bash
cd services/api
python3 -m pip install -r requirements.txt
```

## Run server

```bash
uvicorn main:app --reload --port 8000
```

## Endpoints

- `POST /api/incidents/analyze`
  - Receives a CSV file as `multipart/form-data` (`file` field).
  - Validates rows and returns an aggregated JSON summary.

- `GET /api/incidents/results/export`
  - Returns `results.csv` (metrics only) for the latest stored analysis.
  - Returns `404` if no analysis has been run yet.
