#!/usr/bin/env bash
# Adds the methods + headers that browser resumable uploads need to each
# bucket's EXISTING CORS (origins are kept as-is). Run in Cloud Shell:
#   bash scripts/fix-bucket-cors.sh
set -euo pipefail

for B in gs://my-saga-kyc gs://my-saga-adventures; do
  echo "== $B =="
  gcloud storage buckets describe "$B" --format="json(cors_config)" | jq '
    .cors_config | map(
      .method         = ((.method // [])         + ["PUT","POST","GET","HEAD"] | unique) |
      .responseHeader = (((.responseHeader // []) + ["Content-Type","Content-Range","x-goog-resumable","Location","Range","ETag"]) | group_by(ascii_downcase) | map(.[0])) |
      .maxAgeSeconds  = (.maxAgeSeconds // 3600)
    )' > /tmp/cors.json
  gcloud storage buckets update "$B" --cors-file=/tmp/cors.json
done
