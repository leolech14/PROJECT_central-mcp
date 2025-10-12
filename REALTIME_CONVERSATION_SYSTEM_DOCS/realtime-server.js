#!/usr/bin/env node

const https = require('https');
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

// Store active sessions
const sessions = new Map();

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

function createRealtimeSession(apiKey) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: "gpt-realtime-mini",
      voice: "alloy",
      modalities: ["text", "audio"],
      instructions: "You are a helpful assistant. Respond naturally and conversationally."
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

function generateImage(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: "gpt-image-1-mini",
      prompt: prompt,
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

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  try {
    if (pathname === '/') {
      // Serve the HTML chat interface
      const htmlPath = path.join(__dirname, 'realtime-voice-chat.html');
      const html = fs.readFileSync(htmlPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);

    } else if (pathname === '/text-chat') {
      // Serve the text-based chat interface
      const htmlPath = path.join(__dirname, 'realtime-chat.html');
      const html = fs.readFileSync(htmlPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);

    } else if (pathname === '/create-session' && req.method === 'POST') {
      // Create a new realtime session
      const apiKey = await getApiKeyFromDoppler();
      const sessionData = await createRealtimeSession(apiKey);

      // Store session
      const sessionId = sessionData.id;
      sessions.set(sessionId, {
        ...sessionData,
        createdAt: new Date(),
        messages: []
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        session: sessionData
      }));

    } else if (pathname === '/generate-image' && req.method === 'POST') {
      // Generate an image
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const { prompt } = JSON.parse(body);
          const apiKey = await getApiKeyFromDoppler();
          const imageData = await generateImage(apiKey, prompt);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            image: imageData
          }));

        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
      });

    } else if (pathname === '/status') {
      // Get server status
      const apiKey = await getApiKeyFromDoppler();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        status: 'connected',
        activeSessions: sessions.size,
        models: {
          'gpt-realtime-mini': 'available',
          'gpt-image-1-mini': 'available'
        }
      }));

    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }

  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Realtime Mini Chat Server running at:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   http://127.0.0.1:${PORT}`);
  console.log('');
  console.log(`✅ Connected to OpenAI with API key from Doppler`);
  console.log(`🎯 Models available: gpt-realtime-mini, gpt-image-1-mini`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔴 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});