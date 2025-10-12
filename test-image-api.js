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

function testImageAPI(apiKey) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: "gpt-image-1",
      prompt: "A simple test image of a cat sitting on a desk",
      n: 1,
      size: "1024x1024"
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

async function testModelsList(apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/models',
      method: 'GET',
      headers: {
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

    req.end();
  });
}

async function main() {
  try {
    console.log('🔑 Retrieving OpenAI API key from Doppler...');
    const apiKey = await getApiKeyFromDoppler();
    console.log('✅ API key retrieved successfully');

    console.log('🔍 Checking available models...');
    const modelsResponse = await testModelsList(apiKey);

    const realtimeModel = modelsResponse.data.find(model => model.id.includes('realtime'));
    const imageModel = modelsResponse.data.find(model => model.id.includes('gpt-image'));

    console.log('📋 Available Models Found:');
    if (realtimeModel) {
      console.log(`   ✅ Realtime: ${realtimeModel.id}`);
    } else {
      console.log('   ❌ Realtime model not found');
    }

    if (imageModel) {
      console.log(`   ✅ Image: ${imageModel.id}`);
    } else {
      console.log('   ❌ Image model not found');
    }

    // Test image generation if available
    if (imageModel) {
      console.log('🖼️ Testing image generation API...');
      try {
        const imageResult = await testImageAPI(apiKey);
        console.log('✅ SUCCESS: Image API connection established!');
        console.log('📋 Image Generation Details:');
        console.log(`   Created: ${imageResult.created}`);
        console.log(`   Images generated: ${imageResult.data.length}`);
        if (imageResult.data && imageResult.data[0]) {
          console.log(`   URL: ${imageResult.data[0].url}`);
        }
      } catch (imageError) {
        console.log('⚠️ Image API test failed:', imageError.message);
      }
    }

  } catch (error) {
    console.error('❌ ERROR: Failed to connect to OpenAI API');
    console.error('Details:', error.message);
    process.exit(1);
  }
}

main();