#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# Predelix — Dataflow Pipeline Submitter
# Submits any of the 3 Beam pipelines to Cloud Dataflow
#
# Usage:
#   bash dataflow/submit_pipeline.sh <pipeline> [options]
#
# Pipelines:
#   sales_ingestion      --input gs://bucket/file.csv
#   feature_engineering  (reads from BigQuery sales_data)
#   delivery_processing  --input gs://bucket/deliveries.csv
#
# Examples:
#   bash dataflow/submit_pipeline.sh sales_ingestion \
#     --input gs://predelix-uploads/sales/batch-123.csv
#
#   bash dataflow/submit_pipeline.sh feature_engineering
# ──────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project)}"
REGION="${GCP_REGION:-us-central1}"
DATASET="${BIGQUERY_DATASET:-predelix}"
BUCKET="${GCS_UPLOAD_BUCKET:-predelix-uploads}"
TEMP_LOCATION="gs://${BUCKET}/dataflow-temp"
STAGING_LOCATION="gs://${BUCKET}/dataflow-staging"

PIPELINE="${1:-}"
shift || true

if [ -z "$PIPELINE" ]; then
  echo "Usage: bash submit_pipeline.sh <sales_ingestion|feature_engineering|delivery_processing> [args]"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIPELINES_DIR="${SCRIPT_DIR}/pipelines"

# Activate venv if present
if [ -f "${SCRIPT_DIR}/../.venv/bin/activate" ]; then
  source "${SCRIPT_DIR}/../.venv/bin/activate"
fi

# Install requirements if needed
pip install -q -r "${SCRIPT_DIR}/requirements.txt"

case "$PIPELINE" in
  sales_ingestion)
    echo "🚀 Submitting sales ingestion pipeline..."
    python "${PIPELINES_DIR}/sales_ingestion.py" \
      --runner=DataflowRunner \
      --project="$PROJECT_ID" \
      --region="$REGION" \
      --temp_location="$TEMP_LOCATION" \
      --staging_location="$STAGING_LOCATION" \
      --output_table="${PROJECT_ID}:${DATASET}.sales_data" \
      --job_name="predelix-sales-ingest-$(date +%s)" \
      --setup_file="${SCRIPT_DIR}/setup.py" \
      "$@"
    ;;

  feature_engineering)
    echo "🚀 Submitting feature engineering pipeline..."
    python "${PIPELINES_DIR}/feature_engineering.py" \
      --runner=DataflowRunner \
      --project="$PROJECT_ID" \
      --region="$REGION" \
      --temp_location="$TEMP_LOCATION" \
      --staging_location="$STAGING_LOCATION" \
      --input_table="${PROJECT_ID}:${DATASET}.sales_data" \
      --output_table="${PROJECT_ID}:${DATASET}.ml_features" \
      --job_name="predelix-feature-eng-$(date +%s)" \
      --setup_file="${SCRIPT_DIR}/setup.py" \
      "$@"
    ;;

  delivery_processing)
    echo "🚀 Submitting delivery processing pipeline..."
    python "${PIPELINES_DIR}/delivery_processing.py" \
      --runner=DataflowRunner \
      --project="$PROJECT_ID" \
      --region="$REGION" \
      --temp_location="$TEMP_LOCATION" \
      --staging_location="$STAGING_LOCATION" \
      --output_table="${PROJECT_ID}:${DATASET}.delivery_customers" \
      --job_name="predelix-delivery-proc-$(date +%s)" \
      --setup_file="${SCRIPT_DIR}/setup.py" \
      "$@"
    ;;

  *)
    echo "Unknown pipeline: $PIPELINE"
    echo "Available: sales_ingestion, feature_engineering, delivery_processing"
    exit 1
    ;;
esac

echo ""
echo "✅ Pipeline submitted to Dataflow!"
echo "🔗 Monitor: https://console.cloud.google.com/dataflow/jobs?project=${PROJECT_ID}"
