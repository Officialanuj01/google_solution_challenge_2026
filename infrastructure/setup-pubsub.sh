#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# Predelix — Pub/Sub Topics & Subscriptions Setup
# Creates all required Pub/Sub topics and pull subscriptions
#
# Usage:
#   GCP_PROJECT_ID=predelix-prod bash infrastructure/setup-pubsub.sh
# ──────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project)}"
echo "🔧 Setting up Pub/Sub for project: ${PROJECT_ID}"

# ── Topics ────────────────────────────────────────────────────
TOPICS=(
  "sales-data-uploaded"
  "delivery-data-uploaded"
  "prediction-complete"
  "call-status-update"
  "insights-generated"
)

for TOPIC in "${TOPICS[@]}"; do
  if gcloud pubsub topics describe "$TOPIC" --project="$PROJECT_ID" &>/dev/null; then
    echo "  ✅ Topic already exists: $TOPIC"
  else
    gcloud pubsub topics create "$TOPIC" --project="$PROJECT_ID"
    echo "  ✅ Created topic: $TOPIC"
  fi
done

# ── Pull Subscriptions (for backend server-side listeners) ────
declare -A SUBS=(
  ["prediction-complete"]="prediction-complete-sub"
  ["call-status-update"]="call-status-update-sub"
  ["sales-data-uploaded"]="sales-data-uploaded-sub"
  ["delivery-data-uploaded"]="delivery-data-uploaded-sub"
  ["insights-generated"]="insights-generated-sub"
)

for TOPIC in "${!SUBS[@]}"; do
  SUB="${SUBS[$TOPIC]}"
  if gcloud pubsub subscriptions describe "$SUB" --project="$PROJECT_ID" &>/dev/null; then
    echo "  ✅ Subscription already exists: $SUB"
  else
    gcloud pubsub subscriptions create "$SUB" \
      --topic="$TOPIC" \
      --project="$PROJECT_ID" \
      --ack-deadline=60 \
      --message-retention-duration=600s \
      --expiration-period=never
    echo "  ✅ Created subscription: $SUB → $TOPIC"
  fi
done

echo ""
echo "✅ Pub/Sub setup complete for project: ${PROJECT_ID}"
echo "   Topics: ${#TOPICS[@]} created/verified"
echo "   Subscriptions: ${#SUBS[@]} created/verified"
