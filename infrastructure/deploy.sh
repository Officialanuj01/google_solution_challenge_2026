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
    aiplatform.googleapis.com \
    storage.googleapis.com \
    cloudbuild.googleapis.com \
    containerregistry.googleapis.com \
    secretmanager.googleapis.com \
    dataflow.googleapis.com \
    iam.googleapis.com \
    --project="$PROJECT_ID"
echo "  ✅ APIs enabled"

# ── Step 2: Create Cloud Storage Bucket ──────
echo "🗄️ Creating Cloud Storage bucket..."
gsutil mb -p $PROJECT_ID -l $REGION gs://predelix-uploads/ 2>/dev/null || echo "  Bucket already exists"

# ── Step 3: Build and Deploy Backend to Cloud Run ──
echo "🐳 Building and deploying backend to Cloud Run..."
cd backend

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

# ── Step 4: Get Cloud Run URL ────────────────
API_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)' --project=$PROJECT_ID)
echo "✅ Backend deployed at: $API_URL"

# ── Step 5: Build Frontend ───────────────────
echo "🎨 Building frontend..."
cd client-side
echo "VITE_API_URL=${API_URL}/api" > .env.production
echo "VITE_WS_URL=${API_URL/https/wss}/api" >> .env.production
echo "VITE_GCP_PROJECT_ID=$PROJECT_ID" >> .env.production
npm run build
cd ..

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
