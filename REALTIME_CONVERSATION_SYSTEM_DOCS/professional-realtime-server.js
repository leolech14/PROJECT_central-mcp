#!/usr/bin/env node

const https = require('https');
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3003;

// Professional configuration from guide
const AUDIO_CONFIG = {
  format: "pcm16",
  sampleRate: 24000,
  inputChunkSize: 1024,
  outputChunkSize: 2048,
  totalBuffer: 4096,
  channels: 1
};

const TURN_DETECTION_CONFIG = {
  type: "server_vad",
  threshold: 0.5,
  prefix_padding_ms: 300,
  silence_duration_ms: 500,
  create_response: true,
  interrupt_response: true
};

const VOICE_OPTIONS = {
  alloy: { name: "Alloy", gender: "neutral", characteristics: "balanced, professional" },
  echo: { name: "Echo", gender: "male", characteristics: "deep, calm, authoritative" },
  shimmer: { name: "Shimmer", gender: "female", characteristics: "bright, friendly, engaging" }
};

const LANGUAGE_SUPPORT = {
  english: { confidence: 0.95, code: "en", name: "English" },
  spanish: { confidence: 0.90, code: "es", name: "Español" },
  french: { confidence: 0.88, code: "fr", name: "Français" },
  german: { confidence: 0.85, code: "de", name: "Deutsch" },
  japanese: { confidence: 0.82, code: "ja", name: "日本語" },
  chinese: { confidence: 0.80, code: "zh", name: "中文" },
  portuguese: { confidence: 0.78, code: "pt", name: "Português" },
  russian: { confidence: 0.75, code: "ru", name: "Русский" }
};

// Store active sessions with cleanup
const sessions = new Map();
const sessionTTL = 30 * 60 * 1000; // 30 minutes

// Rate limiting store
const rateLimitStore = new Map();
const rateLimitWindow = 60 * 1000; // 1 minute
const rateLimitMax = 100; // requests per minute

// Enhanced metrics with automatic cleanup
const metrics = {
  activeConnections: 0,
  totalSessions: 0,
  audioLatency: [],
  errorCount: 0,
  lastReset: Date.now()
};

// Input validation schemas
const validateVoiceRequest = (data) => {
  const errors = [];

  if (!data.message || typeof data.message !== 'string') {
    errors.push('Message is required and must be a string');
  } else if (data.message.length > 1000) {
    errors.push('Message must be 1000 characters or less');
  }

  if (!data.voice || !['alloy', 'echo', 'shimmer'].includes(data.voice)) {
    errors.push('Voice must be one of: alloy, echo, shimmer');
  }

  if (data.conversation_history) {
    if (!Array.isArray(data.conversation_history)) {
      errors.push('Conversation history must be an array');
    } else if (data.conversation_history.length > 20) {
      errors.push('Conversation history cannot exceed 20 items');
    } else {
      data.conversation_history.forEach((item, index) => {
        if (!item.speaker || !['user', 'assistant'].includes(item.speaker)) {
          errors.push(`History item ${index} must have valid speaker`);
        }
        if (!item.text || typeof item.text !== 'string' || item.text.length > 2000) {
          errors.push(`History item ${index} must have valid text (max 2000 chars)`);
        }
      });
    }
  }

  return errors;
};

// Rate limiting function
const checkRateLimit = (clientIp) => {
  const now = Date.now();
  const windowStart = now - rateLimitWindow;

  if (!rateLimitStore.has(clientIp)) {
    rateLimitStore.set(clientIp, []);
  }

  const requests = rateLimitStore.get(clientIp);

  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  rateLimitStore.set(clientIp, validRequests);

  if (validRequests.length >= rateLimitMax) {
    return false;
  }

  validRequests.push(now);
  return true;
};

// Session cleanup function
const cleanupExpiredSessions = () => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.createdAt > sessionTTL) {
      sessions.delete(sessionId);
      cleanedCount++;
    }
  }

  // Cleanup rate limiting store
  for (const [clientIp, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter(timestamp => now - timestamp < rateLimitWindow);
    if (validRequests.length === 0) {
      rateLimitStore.delete(clientIp);
    } else {
      rateLimitStore.set(clientIp, validRequests);
    }
  }

  // Cleanup old metrics (keep only last 100)
  if (metrics.audioLatency.length > 100) {
    metrics.audioLatency = metrics.audioLatency.slice(-100);
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired sessions. Active sessions: ${sessions.size}`);
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

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

function createOptimizedSession(config = {}) {
  return new Promise((resolve, reject) => {
    const sessionConfig = {
      model: "gpt-realtime-mini",
      voice: config.voice || "alloy",
      modalities: ["text", "audio"],
      instructions: buildSystemPrompt(config.language || "english", config.personality || "professional"),
      input_audio_format: AUDIO_CONFIG.format,
      output_audio_format: AUDIO_CONFIG.format,
      input_audio_transcription: {
        model: "whisper-1"
      },
      turn_detection: TURN_DETECTION_CONFIG,
      tool_choice: "auto",
      temperature: 0.8,
      max_response_output_tokens: 4096,
      ...config
    };

    const data = JSON.stringify(sessionConfig);

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/realtime/sessions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${config.apiKey}`
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

function buildSystemPrompt(language, personality) {
  const languagePrompts = {
    english: "You are a helpful AI assistant. Respond naturally and conversationally in English.",
    spanish: "Eres un asistente de IA útil. Responde de manera natural y conversacional en español.",
    french: "Vous êtes un assistant IA utile. Répondez de manière naturelle et conversationnelle en français.",
    german: "Sie sind ein hilfreicher KI-Assistent. Antworten Sie natürlich und unterhaltsam auf Deutsch.",
    japanese: "あなたは有用なAIアシスタントです。日本語で自然で会話的に応答してください。",
    chinese: "你是一个有用的AI助手。请用中文自然对话地回应。",
    portuguese: "Você é um assistente de IA útil. Responda de forma natural e conversacional em português.",
    russian: "Вы полезный AI-помощник. Отвечайте естественно и разговорно на русском."
  };

  const personalityPrompts = {
    professional: "Maintain a professional, courteous tone.",
    friendly: "Be warm, friendly, and engaging.",
    casual: "Use a casual, relaxed conversational style.",
    formal: "Maintain formal, respectful communication."
  };

  return `${languagePrompts[language] || languagePrompts.english} ${personalityPrompts[personality] || personalityPrompts.professional}`;
}

function detectLanguage(transcript) {
  // Simple language detection based on common words/phrases
  const patterns = {
    spanish: /\b(hola|gracias|por favor|buenos días)\b/i,
    french: /\b(bonjour|merci|s'il vous plaît|bonne journée)\b/i,
    german: /\b(hallo|danke|bitte|guten tag)\b/i,
    japanese: /\b(こんにちは|ありがとう|お願いします|おはよう)\b/i,
    chinese: /\b(你好|谢谢|请|早上好)\b/i,
    portuguese: /\b(olá|obrigado|por favor|bom dia)\b/i,
    russian: /\b(здравствуйте|спасибо|пожалуйста|доброе утро)\b/i
  };

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(transcript)) {
      return lang;
    }
  }

  return 'english'; // Default fallback
}

function callOpenAIChat(apiKey, messages) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'gpt-4',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
      stream: false
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
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
          const response = parsedData.choices[0].message.content;
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse OpenAI response: ${error.message}`));
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

function recordMetric(name, value) {
  if (!metrics[name]) {
    metrics[name] = [];
  }
  metrics[name].push({ value, timestamp: Date.now() });

  // Keep only last 100 entries
  if (metrics[name].length > 100) {
    metrics[name] = metrics[name].slice(-100);
  }

  // Check for critical thresholds
  if (name === 'audioLatency' && value > 500) {
    console.warn(`🚨 CRITICAL: Audio latency ${value}ms exceeds 500ms threshold`);
  }
}

const server = http.createServer(async (req, res) => {
  // Get client IP for rate limiting
  const clientIp = req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';

  // Enable CORS with more restrictive settings
  const allowedOrigins = ['http://localhost:3003', 'http://127.0.0.1:3003'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  try {
    if (pathname === '/') {
      // Serve the SIMPLE working voice chat interface
      const htmlPath = path.join(__dirname, 'simple-realtime-chat.html');
      if (fs.existsSync(htmlPath)) {
        const html = fs.readFileSync(htmlPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Simple voice chat interface not found');
      }

    } else if (pathname === '/true-realtime') {
      // Serve the true realtime interface (experimental)
      const htmlPath = path.join(__dirname, 'true-realtime-voice-chat.html');
      if (fs.existsSync(htmlPath)) {
        const html = fs.readFileSync(htmlPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('True real-time voice chat interface not found');
      }

    } else if (pathname === '/professional') {
      // Serve the professional interface (original)
      const htmlPath = path.join(__dirname, 'professional-voice-chat.html');
      if (fs.existsSync(htmlPath)) {
        const html = fs.readFileSync(htmlPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Professional voice chat interface not found');
      }

    } else if (pathname === '/voice-to-voice') {
      // Serve the voice-to-voice real-time interface
      const htmlPath = path.join(__dirname, 'voice-to-voice-realtime.html');
      if (fs.existsSync(htmlPath)) {
        const html = fs.readFileSync(htmlPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Voice-to-voice real-time interface not found');
      }

    } else if (pathname === '/webrtc') {
      // Serve the WebRTC Voice Orb interface
      const htmlPath = path.join(__dirname, 'voice-orb-webrtc.html');
      if (fs.existsSync(htmlPath)) {
        const html = fs.readFileSync(htmlPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('WebRTC Voice Orb interface not found');
      }

    } else if (pathname === '/create-session' && req.method === 'POST') {
      // Create optimized session with advanced configuration
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const config = JSON.parse(body);
          const apiKey = await getApiKeyFromDoppler();

          const sessionData = await createOptimizedSession({
            ...config,
            apiKey
          });

          // Store session with metadata
          const sessionId = sessionData.id;
          sessions.set(sessionId, {
            ...sessionData,
            createdAt: new Date(),
            config,
            messages: [],
            metrics: {
              audioLatency: [],
              messageCount: 0,
              language: config.language || 'english'
            }
          });

          metrics.totalSessions++;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            session: sessionData,
            config: {
              audio: AUDIO_CONFIG,
              turnDetection: TURN_DETECTION_CONFIG,
              voiceOptions: VOICE_OPTIONS,
              languageSupport: LANGUAGE_SUPPORT
            }
          }));

        } catch (error) {
          metrics.errorCount++;
          console.error('Session creation error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
      });

    } else if (pathname === '/detect-language' && req.method === 'POST') {
      // Language detection endpoint
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const { transcript } = JSON.parse(body);
          const detectedLanguage = detectLanguage(transcript);
          const confidence = LANGUAGE_SUPPORT[detectedLanguage]?.confidence || 0.5;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            language: detectedLanguage,
            confidence,
            supported: confidence >= 0.7
          }));

        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
      });

    } else if (pathname === '/metrics') {
      // Return performance metrics
      const avgLatency = metrics.audioLatency.length > 0
        ? metrics.audioLatency.reduce((a, b) => a + b.value, 0) / metrics.audioLatency.length
        : 0;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        activeConnections: metrics.activeConnections,
        totalSessions: metrics.totalSessions,
        averageAudioLatency: Math.round(avgLatency),
        errorCount: metrics.errorCount,
        uptime: Date.now() - metrics.lastReset,
        sessions: Array.from(sessions.entries()).map(([id, session]) => ({
          id,
          createdAt: session.createdAt,
          messageCount: session.metrics.messageCount,
          language: session.metrics.language
        }))
      }));

    } else if (pathname === '/chat-completion' && req.method === 'POST') {
      // Real OpenAI chat completion endpoint
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const { message, voice, style, conversation_history } = JSON.parse(body);
          const apiKey = await getApiKeyFromDoppler();

          // Build conversation messages for OpenAI
          const systemPrompt = buildSystemPrompt('english', style);

          const messages = [
            { role: 'system', content: systemPrompt },
            ...conversation_history.slice(-4).map(item => ({
              role: item.speaker,
              content: item.text
            })),
            { role: 'user', content: message }
          ];

          // Call OpenAI API
          const openaiResponse = await callOpenAIChat(apiKey, messages);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            response: openaiResponse,
            voice: voice,
            style: style
          }));

        } catch (error) {
          console.error('Chat completion error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
      });

    } else if (pathname === '/voice-streaming' && req.method === 'POST') {
      // Voice streaming endpoint for real-time voice-to-voice conversation

      // Apply rate limiting
      if (!checkRateLimit(clientIp)) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(rateLimitWindow / 1000)
        }));
        return;
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();

        // Prevent oversized requests
        if (body.length > 50000) { // 50KB limit
          req.destroy();
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Request too large'
          }));
          return;
        }
      });

      req.on('end', async () => {
        try {
          let requestData;
          try {
            requestData = JSON.parse(body);
          } catch (parseError) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Invalid JSON in request body'
            }));
            return;
          }

          // Validate input data
          const validationErrors = validateVoiceRequest(requestData);
          if (validationErrors.length > 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Validation failed',
              details: validationErrors
            }));
            return;
          }

          const { message, voice, style = 'professional', conversation_history } = requestData;
          const apiKey = await getApiKeyFromDoppler();

          // Build conversation messages for OpenAI
          const systemPrompt = buildSystemPrompt('english', style);

          const messages = [
            { role: 'system', content: systemPrompt },
            ...conversation_history.slice(-4).map(item => ({
              role: item.speaker === 'user' ? 'user' : 'assistant',
              content: item.text
            })),
            { role: 'user', content: message }
          ];

          // Set up streaming response headers
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          });

          // Call OpenAI API with streaming
          const data = JSON.stringify({
            model: 'gpt-4',
            messages: messages,
            max_tokens: 500,
            temperature: 0.7,
            stream: true
          });

          const options = {
            hostname: 'api.openai.com',
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': data.length,
              'Authorization': `Bearer ${apiKey}`
            }
          };

          const openaiReq = https.request(options, (openaiRes) => {
            let buffer = '';

            openaiRes.on('data', (chunk) => {
              buffer += chunk.toString();
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    res.write('data: [DONE]\n\n');
                    res.end();
                    return;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      // Send OpenAI-compatible format for client compatibility
                      res.write(`data: ${JSON.stringify({
                        choices: [{
                          delta: { content }
                        }]
                      })}\n\n`);
                    }
                  } catch (e) {
                    // Ignore parsing errors
                  }
                }
              }
            });

            openaiRes.on('end', () => {
              res.end();
            });
          });

          openaiReq.on('error', (error) => {
            console.error(`❌ OpenAI streaming error for ${clientIp}:`, error);
            metrics.errorCount++;
            res.write(`data: ${JSON.stringify({ error: 'AI service temporarily unavailable' })}\n\n`);
            res.end();
          });

          openaiReq.write(data);
          openaiReq.end();

        } catch (error) {
          console.error(`❌ Voice streaming error for ${clientIp}:`, error);
          metrics.errorCount++;
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Service temporarily unavailable'
          }));
        }
      });

    } else if (pathname === '/text-to-speech' && req.method === 'POST') {
      // OpenAI TTS endpoint for high-quality voice synthesis
      if (!checkRateLimit(clientIp)) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        }));
        return;
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
        if (body.length > 10000) { // 10KB limit for TTS
          req.destroy();
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Request too large'
          }));
          return;
        }
      });

      req.on('end', async () => {
        try {
          const { text, voice = 'alloy', speed = 1.0 } = JSON.parse(body);

          // Validate input
          if (!text || typeof text !== 'string' || text.length > 5000) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Text is required and must be 5000 characters or less'
            }));
            return;
          }

          if (!['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(voice)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Invalid voice. Supported: alloy, echo, fable, onyx, nova, shimmer'
            }));
            return;
          }

          const apiKey = await getApiKeyFromDoppler();

          // Call OpenAI TTS API
          const ttsData = JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: voice,
            speed: Math.min(Math.max(speed, 0.25), 4.0), // Clamp between 0.25 and 4.0
            response_format: 'mp3'
          });

          const options = {
            hostname: 'api.openai.com',
            port: 443,
            path: '/v1/audio/speech',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': ttsData.length,
              'Authorization': `Bearer ${apiKey}`
            }
          };

          const ttsReq = https.request(options, (ttsRes) => {
            if (ttsRes.statusCode !== 200) {
              let errorData = '';
              ttsRes.on('data', chunk => errorData += chunk);
              ttsRes.on('end', () => {
                console.error(`❌ TTS API error for ${clientIp}:`, ttsRes.statusCode, errorData);
                metrics.errorCount++;
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: false,
                  error: 'Voice synthesis failed'
                }));
              });
              return;
            }

            res.writeHead(200, {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
            });
            ttsRes.pipe(res);
          });

          ttsReq.on('error', (error) => {
            console.error(`❌ TTS request error for ${clientIp}:`, error);
            metrics.errorCount++;
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Voice synthesis unavailable'
            }));
          });

          ttsReq.write(ttsData);
          ttsReq.end();

        } catch (error) {
          console.error(`❌ TTS endpoint error for ${clientIp}:`, error);
          metrics.errorCount++;
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Invalid request'
          }));
        }
      });

    } else if (pathname === '/session' && req.method === 'GET') {
      // Generate real ephemeral key for WebRTC Realtime API
      try {
        const apiKey = await getApiKeyFromDoppler();

        // Call OpenAI API to generate ephemeral key using client secrets endpoint
        const data = JSON.stringify({
          model: 'gpt-4o-mini-realtime-preview'
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

        const req = https.request(options, (openaiRes) => {
          let responseData = '';

          openaiRes.on('data', (chunk) => {
            responseData += chunk;
          });

          openaiRes.on('end', () => {
            console.log('OpenAI API response status:', openaiRes.statusCode);
            console.log('OpenAI response data:', responseData);

            try {
              const sessionData = JSON.parse(responseData);

              // Return the ephemeral key
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                value: sessionData.client_secret?.value || sessionData.value,
                client_secret: sessionData.client_secret,
                expires_at: sessionData.client_secret?.expires_at || sessionData.expires_at
              }));

            } catch (parseError) {
              console.error('Failed to parse OpenAI response:', parseError);
              console.error('Raw response:', responseData);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Failed to generate ephemeral key',
                details: parseError.message
              }));
            }
          });
        });

        req.on('error', (error) => {
          console.error('Error generating ephemeral key:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Failed to connect to OpenAI API',
            details: error.message
          }));
        });

        req.write(data);
        req.end();

      } catch (error) {
        console.error('Error in /session endpoint:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Internal server error',
          details: error.message
        }));
      }

    } else if (pathname === '/v1/realtime' && req.method === 'POST') {
      // WebRTC SDP exchange proxy for OpenAI Realtime API
      try {
        // Extract the ephemeral key from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing or invalid authorization header' }));
          return;
        }

        const ephemeralKey = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Get the SDP offer from request body
        let sdpOffer = '';
        req.on('data', chunk => {
          sdpOffer += chunk.toString();
        });

        req.on('end', async () => {
          try {
            // Forward the SDP exchange to OpenAI
            const options = {
              hostname: 'api.openai.com',
              port: 443,
              path: '/v1/realtime?model=gpt-4o-mini-realtime-preview',
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${ephemeralKey}`,
                'Content-Type': 'application/sdp',
                'Content-Length': Buffer.byteLength(sdpOffer)
              }
            };

            const openaiReq = https.request(options, (openaiRes) => {
              let responseData = '';

              openaiRes.on('data', (chunk) => {
                responseData += chunk;
              });

              openaiRes.on('end', () => {
                // Forward OpenAI's response back to the Voice Orb
                res.writeHead(openaiRes.statusCode, {
                  'Content-Type': 'application/sdp',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'POST, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                });
                res.end(responseData);
              });
            });

            openaiReq.on('error', (error) => {
              console.error('OpenAI SDP exchange error:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Failed to connect to OpenAI',
                details: error.message
              }));
            });

            openaiReq.write(sdpOffer);
            openaiReq.end();

          } catch (error) {
            console.error('SDP exchange error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'SDP exchange failed',
              details: error.message
            }));
          }
        });

      } catch (error) {
        console.error('WebRTC proxy error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Internal server error',
          details: error.message
        }));
      }

    } else if (pathname === '/status') {
      // Health check endpoint
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        capabilities: {
          voice: Object.keys(VOICE_OPTIONS),
          languages: Object.keys(LANGUAGE_SUPPORT),
          audio: AUDIO_CONFIG,
          webrtc: true
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
  console.log(`🚀 Professional Realtime Voice Server running at:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   http://127.0.0.1:${PORT}`);
  console.log('');
  console.log(`✅ Professional configuration loaded:`);
  console.log(`   🎤 Audio: ${AUDIO_CONFIG.sampleRate}Hz PCM16`);
  console.log(`   🌍 Languages: ${Object.keys(LANGUAGE_SUPPORT).length} supported`);
  console.log(`   🔊 Voices: ${Object.keys(VOICE_OPTIONS).length} available`);
  console.log(`   📊 Metrics: Real-time monitoring enabled`);
  console.log(`   🔌 HTTP Server: Ready for professional API calls`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔴 Shutting down professional server...');
  server.close(() => {
    console.log('✅ Professional server stopped');
    process.exit(0);
  });
});

// Metrics cleanup every 5 minutes
setInterval(() => {
  // Clean old metrics
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  Object.keys(metrics).forEach(key => {
    if (Array.isArray(metrics[key])) {
      metrics[key] = metrics[key].filter(entry => entry.timestamp > fiveMinutesAgo);
    }
  });

  console.log(`📊 Metrics cleanup completed. Active sessions: ${sessions.size}`);
}, 5 * 60 * 1000);