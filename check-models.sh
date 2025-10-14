#!/bin/bash

echo "🔑 Getting API key from Doppler..."
OPENAI_API_KEY=$(doppler secrets get --project ai-tools --config dev OPENAI_API_KEY --plain)

echo "🔍 Checking for gpt-realtime-mini and gpt-image-1 models..."

echo "📋 Available models:"
curl -s -X GET "https://api.openai.com/v1/models" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  | jq '.data[] | select(.id | contains("realtime") or contains("gpt-image"))'