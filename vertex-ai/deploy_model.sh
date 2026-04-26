#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# Predelix — Vertex AI Model Deployment Script
# Uploads trained model artifact → imports to Model Registry → deploys to endpoint
#
# Usage:
#   MODEL_DIR=gs://predelix-uploads/models/<job-id>/ \
#   bash vertex-ai/deploy_model.sh
# ──────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project)}"
REGION="${GCP_REGION:-us-central1}"
MODEL_DISPLAY_NAME="predelix-demand-predictor"
ENDPOINT_DISPLAY_NAME="predelix-demand-endpoint"
MODEL_DIR="${MODEL_DIR:-}"
SERVING_IMAGE="us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.1-3:latest"

if [ -z "$MODEL_DIR" ]; then
  echo "❌ MODEL_DIR is required. Set it to the GCS path of the model artifact."
  echo "   Example: MODEL_DIR=gs://predelix-uploads/models/<job-id>/ bash deploy_model.sh"
  exit 1
fi

echo "🚀 Deploying Predelix demand prediction model to Vertex AI"
echo "   Project:    ${PROJECT_ID}"
echo "   Region:     ${REGION}"
echo "   Model dir:  ${MODEL_DIR}"

# ── Step 1: Upload model to Vertex AI Model Registry ──────────
echo ""
echo "📦 Step 1: Uploading model to Model Registry..."
MODEL_RESOURCE=$(gcloud ai models upload \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --display-name="$MODEL_DISPLAY_NAME" \
  --artifact-uri="$MODEL_DIR" \
  --container-image-uri="$SERVING_IMAGE" \
  --container-predict-route="/predict" \
  --container-health-route="/health" \
  --format="value(model)" \
  2>&1 | tail -1)

echo "  ✅ Model uploaded: ${MODEL_RESOURCE}"

# ── Step 2: Create or get existing endpoint ────────────────────
echo ""
echo "🔌 Step 2: Creating/finding endpoint..."
EXISTING_ENDPOINT=$(gcloud ai endpoints list \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --filter="displayName=${ENDPOINT_DISPLAY_NAME}" \
  --format="value(name)" 2>/dev/null | head -1 || true)

if [ -z "$EXISTING_ENDPOINT" ]; then
  ENDPOINT_RESOURCE=$(gcloud ai endpoints create \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --display-name="$ENDPOINT_DISPLAY_NAME" \
    --format="value(name)" 2>&1 | tail -1)
  echo "  ✅ Created endpoint: ${ENDPOINT_RESOURCE}"
else
  ENDPOINT_RESOURCE="$EXISTING_ENDPOINT"
  echo "  ✅ Using existing endpoint: ${ENDPOINT_RESOURCE}"
fi

ENDPOINT_ID=$(echo "$ENDPOINT_RESOURCE" | awk -F'/' '{print $NF}')
MODEL_ID=$(echo "$MODEL_RESOURCE" | awk -F'/' '{print $NF}')

# ── Step 3: Deploy model to endpoint ──────────────────────────
echo ""
echo "🎯 Step 3: Deploying model to endpoint..."
gcloud ai endpoints deploy-model "$ENDPOINT_RESOURCE" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --model="$MODEL_RESOURCE" \
  --display-name="${MODEL_DISPLAY_NAME}-$(date +%Y%m%d)" \
  --machine-type="n1-standard-2" \
  --min-replica-count=1 \
  --max-replica-count=3 \
  --traffic-split="0=100"

echo ""
echo "✅ Model deployed successfully!"
echo ""
echo "📋 Add these to your backend .env / Secret Manager:"
echo "   VERTEX_ENDPOINT_ID=${ENDPOINT_ID}"
echo "   VERTEX_MODEL_ID=${MODEL_ID}"
echo ""
echo "🔗 Console: https://console.cloud.google.com/vertex-ai/endpoints?project=${PROJECT_ID}"
