#!/usr/bin/env node

// Simple test script for Doppler integration and session endpoint
const https = require('https');
const { spawn } = require('child_process');

console.log('🧪 Testing Doppler Integration for Ephemeral Key Generation');

// Test 1: Can we get the OpenAI API key from Doppler?
console.log('\n1. Testing Doppler API key retrieval...');

const dopplerProcess = spawn('doppler', ['secrets', 'get', 'OPENAI_API_KEY', '--project', 'ai-tools', '--config', 'dev', '--plain'], {
  stdio: 'pipe'
});

let dopplerKey = '';

dopplerProcess.stdout.on('data', (data) => {
  dopplerKey = data.toString().trim();
  console.log('✅ Successfully retrieved API key from Doppler');
  console.log(`Key length: ${dopplerKey.length} characters`);
  console.log(`Key starts with: ${dopplerKey.substring(0, 7)}...`);
});

dopplerProcess.stderr.on('data', (data) => {
  console.error('❌ Doppler error:', data.toString());
});

dopplerProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Failed to get API key from Doppler');
    process.exit(1);
  }

  // Test 2: Can we make the OpenAI API call for ephemeral key?
  console.log('\n2. Testing OpenAI ephemeral key generation...');

  // Try different API call formats
  const data = JSON.stringify({
    model: 'gpt-4o-mini-realtime-preview',
    // Alternative format - just model parameter
  });

  const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/realtime/sessions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${dopplerKey}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);

    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('Response body:', responseData);

      if (res.statusCode === 200) {
        console.log('✅ Successfully generated ephemeral key!');
        try {
          const parsed = JSON.parse(responseData);
          console.log(`✅ Client ID: ${parsed.client_id?.value?.substring(0, 10)}...`);
          console.log(`✅ Expires at: ${new Date(parsed.expires_at * 1000).toISOString()}`);
        } catch (e) {
          console.error('❌ Failed to parse response:', e.message);
        }
      } else {
        console.error('❌ Failed to generate ephemeral key');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.write(data);
  req.end();
});