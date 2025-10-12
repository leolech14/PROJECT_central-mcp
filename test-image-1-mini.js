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

function testImage1MiniAPI(apiKey) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: "gpt-image-1-mini",
      prompt: "A simple test image of a cute robot waving hello",
      n: 1,
      size: "1024x1024",
      style: "vivid"
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/images/generations',
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
          reject(new Error(`Failed to parse response: ${error.message}\nResponse: ${responseData}`));
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

function testRealtimeMiniAPI(apiKey) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: "gpt-realtime-mini",
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
          reject(new Error(`Failed to parse response: ${error.message}\nResponse: ${responseData}`));
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

    console.log('');
    console.log('🎯 Testing gpt-realtime-mini API...');
    const realtimeResult = await testRealtimeMiniAPI(apiKey);
    console.log('✅ SUCCESS: gpt-realtime-mini API connection established!');
    console.log('📋 Realtime Session Details:');
    console.log(`   Session ID: ${realtimeResult.id}`);
    console.log(`   Model: ${realtimeResult.model}`);
    console.log(`   Voice: ${realtimeResult.voice}`);
    console.log(`   Modalities: ${realtimeResult.modalities.join(', ')}`);

    console.log('');
    console.log('🖼️ Testing gpt-image-1-mini API...');
    const imageResult = await testImage1MiniAPI(apiKey);
    console.log('✅ SUCCESS: gpt-image-1-mini API connection established!');
    console.log('📋 Image Generation Details:');
    console.log(`   Created: ${imageResult.created}`);
    console.log(`   Images generated: ${imageResult.data.length}`);
    if (imageResult.data && imageResult.data[0]) {
      console.log(`   Revised Prompt: ${imageResult.data[0].revised_prompt}`);
      console.log(`   Image URL: ${imageResult.data[0].url}`);
    }

    console.log('');
    console.log('🎉 BOTH MODELS SUCCESSFULLY CONNECTED!');
    console.log('✅ gpt-realtime-mini - Session creation working');
    console.log('✅ gpt-image-1-mini - Image generation working');

  } catch (error) {
    console.error('❌ ERROR: Failed to connect to one of the APIs');
    console.error('Details:', error.message);
    process.exit(1);
  }
}

main();