#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
# Predelix — Full GCP Bootstrap & Deployment Script
# Sets up all infrastructure and deploys to Cloud Run
#
# Usage:
#   GCP_PROJECT_ID=predelix-prod bash infrastructure/deploy.sh
#
# Prerequisites: gcloud, bq, gsutil CLIs installed and authenticated
# ──────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project)}"
REGION="${GCP_REGION:-us-central1}"
BUCKET="${GCS_UPLOAD_BUCKET:-predelix-uploads}"
SERVICE_NAME="predelix-api"
SERVICE_ACCOUNT="predelix-run-sa"
SA_EMAIL="${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🚀 Predelix Full Deployment"
echo "   Project: $PROJECT_ID"
echo "   Region:  $REGION"
echo "   Bucket:  $BUCKET"
echo ""

# ── Step 1: Enable Required GCP APIs ─────────────────────────────
echo "📦 Step 1: Enabling GCP APIs..."
gcloud services enable \
    run.googleapis.com \
    bigquery.googleapis.com \
    bigquerystorage.googleapis.com \
    aiplatform.googleapis.com \
    speech.googleapis.com \
    storage.googleapis.com \
    cloudbuild.googleapis.com \
    containerregistry.googleapis.com \
    secretmanager.googleapis.com \
    dataflow.googleapis.com \
    iam.googleapis.com \
    --project="$PROJECT_ID"
echo "  ✅ APIs enabled"

# ── Step 2: Create Service Account ───────────────────────────────
echo ""
echo "👤 Step 2: Setting up service account..."
if gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
    echo "  ✅ Service account already exists: $SA_EMAIL"
else
    gcloud iam service-accounts create "$SERVICE_ACCOUNT" \
        --display-name="Predelix Cloud Run SA" \
        --project="$PROJECT_ID"
    echo "  ✅ Created service account: $SA_EMAIL"
fi

# Grant required roles
ROLES=(
    "roles/bigquery.dataEditor"
    "roles/bigquery.jobUser"
    "roles/dataflow.developer"
    "roles/aiplatform.user"
    "roles/storage.objectAdmin"
    "roles/secretmanager.secretAccessor"
    "roles/run.invoker"
    "roles/logging.logWriter"
)

for ROLE in "${ROLES[@]}"; do
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SA_EMAIL" \
        --role="$ROLE" \
        --condition=None \
        --quiet 2>/dev/null || true
done
echo "  ✅ IAM roles granted"

# ── Step 3: Cloud Storage Buckets ────────────────────────────────
echo ""
echo "🗄️  Step 3: Creating Cloud Storage buckets..."
for SUFFIX in "" "/dataflow-temp" "/dataflow-staging" "/models" "/templates"; do
    # Note: actual GCS buckets don't have sub-paths, just the root bucket
    break
done

if gsutil ls "gs://${BUCKET}" &>/dev/null; then
    echo "  ✅ Bucket already exists: gs://${BUCKET}"
else
    gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://${BUCKET}"
    echo "  ✅ Created bucket: gs://${BUCKET}"
fi

# Set lifecycle policy
gsutil lifecycle set - "gs://${BUCKET}" <<'EOF'
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"age": 30, "matchesPrefix": ["dataflow-temp/"]}
    }
  ]
}
EOF

# ── Step 4: Secret Manager Secrets ───────────────────────────────
echo ""
echo "🔐 Step 4: Setting up Secret Manager secrets..."
SECRETS=(
    "PREDELIX_GEMINI_API_KEY"
    "PREDELIX_JWT_ACCESS_SECRET"
    "PREDELIX_JWT_REFRESH_SECRET"
    "PREDELIX_MONGODB_URI"
    "PREDELIX_TWILIO_ACCOUNT_SID"
    "PREDELIX_TWILIO_AUTH_TOKEN"
)

for SECRET in "${SECRETS[@]}"; do
    if gcloud secrets describe "$SECRET" --project="$PROJECT_ID" &>/dev/null; then
        echo "  ✅ Secret exists: $SECRET"
    else
        echo "  ⚠️  Creating placeholder secret: $SECRET (update with real value!)"
        echo -n "placeholder-update-me" | \
            gcloud secrets create "$SECRET" \
                --project="$PROJECT_ID" \
                --replication-policy="automatic" \
                --data-file=-
    fi
done

# ── Step 5: BigQuery Schema ───────────────────────────────────────
echo ""
echo "📊 Step 5: Provisioning BigQuery schema..."
GCP_PROJECT_ID="$PROJECT_ID" GCP_REGION="$REGION" bash "${SCRIPT_DIR}/setup-bigquery.sh"

# ── Step 6: Build and Deploy Backend via Cloud Build ─────────────
echo ""
echo "🐳 Step 6: Building and deploying backend to Cloud Run..."
cd "${ROOT_DIR}/backend"

gcloud builds submit \
    --config=cloudbuild.yaml \
    --project="$PROJECT_ID" \
    --substitutions="_REGION=${REGION}" \
    .

cd "$ROOT_DIR"

# ── Step 8: Get Cloud Run URL & Update Frontend ──────────────────
echo ""
echo "🔗 Step 8: Fetching Cloud Run URL..."
API_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --format='value(status.url)' \
    --project="$PROJECT_ID")

echo "  ✅ Backend deployed at: $API_URL"

# Update frontend env
WS_URL="${API_URL/https/wss}"
cat > "${ROOT_DIR}/client-side/.env.production" <<EOF
VITE_API_URL=${API_URL}/api
VITE_WS_URL=${WS_URL}
VITE_GCP_PROJECT_ID=${PROJECT_ID}
EOF
echo "  ✅ Frontend .env.production updated"

echo ""
echo "════════════════════════════════════════════════"
echo "✅ Predelix Deployment Complete!"
echo "════════════════════════════════════════════════"
echo "  Backend API:   $API_URL"
echo "  Health Check:  $API_URL/health"
echo "  Architecture:  $API_URL/"
echo ""
echo "📋 Next steps:"
echo "  1. Update Secret Manager secrets with real values:"
echo "     gcloud secrets versions add PREDELIX_GEMINI_API_KEY --data-file=- <<< 'your-key'"
echo "  2. Configure Dialogflow CX agent ID in Secret Manager or env"
echo "  3. Configure Vertex AI endpoint ID after first model training:"
echo "     bash vertex-ai/deploy_model.sh"
echo "  4. Build and deploy frontend (Vercel or Cloud Run):"
echo "     cd client-side && npm run build"
echo "════════════════════════════════════════════════"
