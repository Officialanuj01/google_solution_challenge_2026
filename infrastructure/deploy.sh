#!/bin/bash
# ──────────────────────────────────────────────
# Predelix — GCP Deployment Script
# Deploys all services to Google Cloud Platform
# ──────────────────────────────────────────────

set -e

PROJECT_ID="${GCP_PROJECT_ID:-predelix-prod}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="predelix-api"

echo "🚀 Predelix Deployment Script"
echo "   Project: $PROJECT_ID"
echo "   Region:  $REGION"
echo ""

# ── Step 1: Enable Required APIs ─────────────
echo "📦 Enabling required GCP APIs..."
gcloud services enable \
    run.googleapis.com \
    aiplatform.googleapis.com \
    storage.googleapis.com \
    cloudbuild.googleapis.com \
    containerregistry.googleapis.com \
    --project=$PROJECT_ID

# ── Step 2: Create Cloud Storage Bucket ──────
echo "🗄️ Creating Cloud Storage bucket..."
gsutil mb -p $PROJECT_ID -l $REGION gs://predelix-uploads/ 2>/dev/null || echo "  Bucket already exists"

# ── Step 3: Build and Deploy Backend to Cloud Run ──
echo "🐳 Building and deploying backend to Cloud Run..."
cd backend

gcloud builds submit \
    --tag gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --project=$PROJECT_ID

gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars "NODE_ENV=production,GCP_PROJECT_ID=$PROJECT_ID,GCP_REGION=$REGION" \
    --project=$PROJECT_ID

cd ..

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
echo "════════════════════════════════════════════"
echo "✅ Deployment Complete!"
echo "════════════════════════════════════════════"
echo "  Backend API:  $API_URL"
echo "  Health Check: $API_URL/health"
echo "  API Docs:     $API_URL/"
echo "════════════════════════════════════════════"
