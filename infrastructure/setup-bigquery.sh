#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# Predelix — BigQuery Dataset & Tables Setup
# Declarative schema provisioning using bq CLI
#
# Usage:
#   GCP_PROJECT_ID=predelix-prod BIGQUERY_DATASET=predelix \
#   bash infrastructure/setup-bigquery.sh
# ──────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project)}"
DATASET="${BIGQUERY_DATASET:-predelix}"
REGION="${GCP_REGION:-us-central1}"

echo "🔧 Setting up BigQuery for project: ${PROJECT_ID}, dataset: ${DATASET}"

# ── Create Dataset ─────────────────────────────────────────────
if bq ls --project_id="$PROJECT_ID" "$DATASET" &>/dev/null; then
  echo "  ✅ Dataset already exists: ${DATASET}"
else
  bq mk \
    --project_id="$PROJECT_ID" \
    --dataset \
    --location="$REGION" \
    --description="Predelix AI Supply Chain Analytics" \
    "${PROJECT_ID}:${DATASET}"
  echo "  ✅ Created dataset: ${DATASET}"
fi

# ── Helper: create table if not exists ────────────────────────
create_table() {
  local TABLE_NAME=$1
  local SCHEMA=$2
  local FULL_TABLE="${PROJECT_ID}:${DATASET}.${TABLE_NAME}"

  if bq show --project_id="$PROJECT_ID" "${DATASET}.${TABLE_NAME}" &>/dev/null; then
    echo "  ✅ Table already exists: ${TABLE_NAME}"
  else
    bq mk \
      --project_id="$PROJECT_ID" \
      --table \
      "${FULL_TABLE}" \
      "$SCHEMA"
    echo "  ✅ Created table: ${TABLE_NAME}"
  fi
}

# ── Tables ─────────────────────────────────────────────────────
# sales_data
create_table "sales_data" \
  "id:STRING,store_id:STRING,product_id:STRING,date:DATE,sales:INT64,stock:INT64,day_of_week:INT64,month:INT64,rolling_avg_7d:FLOAT64,lag_1d:INT64,lag_7d:INT64,ingested_at:TIMESTAMP"

# delivery_customers
create_table "delivery_customers" \
  "id:STRING,name:STRING,mobile_number:STRING,address:STRING,status:STRING,preferred_time:STRING,delivery_instructions:STRING,uploaded_at:TIMESTAMP,batch_id:STRING"

# predictions
create_table "predictions" \
  "id:STRING,store_id:STRING,product_id:STRING,prediction_date:DATE,predicted_stock:INT64,confidence:FLOAT64,model_version:STRING,created_at:TIMESTAMP"

# call_logs
create_table "call_logs" \
  "id:STRING,customer_id:STRING,customer_name:STRING,phone_number:STRING,call_status:STRING,duration_seconds:INT64,transcription:STRING,preferred_time:STRING,delivery_instructions:STRING,session_id:STRING,batch_id:STRING,called_at:TIMESTAMP"

# ml_features
create_table "ml_features" \
  "store_id:STRING,product_id:STRING,date:DATE,store_id_encoded:INT64,product_id_encoded:INT64,date_ordinal:INT64,sales:INT64,stock:INT64,day_of_week:INT64,month:INT64,rolling_avg_7d:FLOAT64,lag_1d:INT64,lag_7d:INT64,computed_at:TIMESTAMP"

# insights
create_table "insights" \
  "id:STRING,type:STRING,category:STRING,title:STRING,summary:STRING,details:JSON,severity:STRING,store_id:STRING,product_id:STRING,generated_at:TIMESTAMP"

echo ""
echo "✅ BigQuery setup complete!"
echo "   Project: ${PROJECT_ID}"
echo "   Dataset: ${DATASET}"
echo "   Region:  ${REGION}"
echo "   Tables:  6 created/verified"
echo ""
echo "🔗 View at: https://console.cloud.google.com/bigquery?project=${PROJECT_ID}&d=${DATASET}"
