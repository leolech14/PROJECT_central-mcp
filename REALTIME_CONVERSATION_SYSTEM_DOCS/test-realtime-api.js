#!/usr/bin/env node

const https = require('https');
const { spawn } = require('child_process');

async function getApiKeyFromDoppler() {
  return new Promise((resolve, reject) => {
    const doppler = spawn('doppler', ['secrets', 'get', '--project', 'ai-tools', '--config', 'dev', 'OPENAI_API_KEY', '--plain']);

    let output = '';
    doppler.stdout.on('data', (data) => {
      output += data.toString();
    });

    doppler.stderr.on('data', (data) => {
      console.error('Doppler error:', data.toString());
    });

    doppler.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Doppler exited with code ${code}`));
      }
    });
  });
}

function testRealtimeAPI(apiKey) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: "gpt-4o-realtime-preview",
      voice: "alloy",
      modalities: ["text", "audio"],
      instructions: "You are a helpful assistant."
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/realtime/sessions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve(parsedData);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    console.log('🔑 Retrieving OpenAI API key from Doppler...');
    const apiKey = await getApiKeyFromDoppler();
    console.log('✅ API key retrieved successfully');

    console.log('🌐 Testing gpt-4o-realtime-preview API...');
    const result = await testRealtimeAPI(apiKey);

    console.log('✅ SUCCESS: Realtime API connection established!');
    console.log('📋 Session Details:');
    console.log(`   Session ID: ${result.id}`);
    console.log(`   Model: ${result.model}`);
    console.log(`   Modalities: ${result.modalities.join(', ')}`);
    console.log(`   Voice: ${result.voice}`);
    console.log(`   Client Secret: ${result.client_secret.value}`);
    console.log(`   Expires at: ${new Date(result.client_secret.expires_at * 1000).toISOString()}`);

  } catch (error) {
    console.error('❌ ERROR: Failed to connect to realtime API');
    console.error('Details:', error.message);
    process.exit(1);
  }
}

main();