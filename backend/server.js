/**
 * Express.js Backend Server
 * Replaces the N8N workflow for the ReAct Weather Event Planner Agent.
 *
 * Single endpoint: POST /api/chat
 * - Receives: { message, sessionId }
 * - Pushes CoT steps to Firebase in real-time
 * - Returns: { success, finalAnswer }
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { runAgentV1 } = require('./agent/v1_baseline');
const { runAgentV2 } = require('./agent/v2_react_basic');
const { runAgent } = require('./agent/reactAgent'); // Equivalent to V3
const { rateLimiterMiddleware, incrementLimit, getRateLimitStatus } = require('./middleware/rateLimiter');

const logger = require('./services/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : '*';
app.use(cors({
  origin: allowedOrigins
}));
app.use(express.json());

// ──────────────────────────────────────────────
// POST /api/chat — Main agent endpoint
// ──────────────────────────────────────────────
app.post('/api/chat', rateLimiterMiddleware, async (req, res) => {
  const { message, sessionId, version = 'v3', llmModel = 'claude', history = [], userKeys = {}, adminCode = '' } = req.body;
  const startTime = Date.now();

  // Validate input
  if (!message || !sessionId) {
    logger.warn('SERVER', `Invalid request: missing message or sessionId [${sessionId}]`);
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: message, sessionId',
    });
  }

  logger.info('SERVER', `🤖 New request [${sessionId}] | Version: ${version.toUpperCase()} | Model: ${llmModel.toUpperCase()}`);
  logger.info('SERVER', `📝 Message: "${message.substring(0, 80)}${message.length > 80 ? '...' : ''}"`);
  if (history.length > 0) {
    logger.info('SERVER', `📜 History attached: ${history.length} messages`);
  }

  try {
    // Run the correct agent based on version requested
    let result;
    if (version === 'v1') {
      result = await runAgentV1(message, sessionId, llmModel, history, userKeys);
    } else if (version === 'v2') {
      result = await runAgentV2(message, sessionId, llmModel, history, userKeys);
    } else {
      result = await runAgent(message, sessionId, llmModel, history, userKeys); // V3
    }

    // Increment rate limit counter only on success
    const isClaudeNoKey = llmModel === 'claude' && !userKeys?.anthropicApiKey && adminCode !== process.env.ADMIN_UNLOCK_CODE;
    incrementLimit(req.clientIp, isClaudeNoKey);

    const duration = Date.now() - startTime;
    logger.api('POST', '/api/chat', 200, duration);
    
    // As per user architecture proposal: Return the remaining limit attached to response
    const currentRateLimit = getRateLimitStatus(req.clientIp, userKeys, llmModel, adminCode);
    res.json({
      ...result,
      rateLimitStatus: currentRateLimit
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('SERVER', `❌ Agent error [${sessionId}]: ${error.message}`, error);
    logger.api('POST', '/api/chat', 500, duration);

    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// ──────────────────────────────────────────────
// POST /api/rate-limit-status — Return quota status for the IP
// ──────────────────────────────────────────────
app.post('/api/rate-limit-status', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const { userKeys = {}, llmModel = 'gemini', adminCode = '' } = req.body || {};
  const status = getRateLimitStatus(ip, userKeys, llmModel, adminCode);
  res.json(status);
});

// ──────────────────────────────────────────────
// Health check
// ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ReAct Weather Event Planner Agent',
    timestamp: new Date().toISOString(),
  });
});

// ──────────────────────────────────────────────
// Start server
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  logger.success('SERVER', `🚀 ReAct Agent Backend running at http://localhost:${PORT}`);
  logger.info('SERVER', `📡 Endpoint: POST http://localhost:${PORT}/api/chat`);
  logger.info('SERVER', `💚 Health  : GET http://localhost:${PORT}/health`);
  console.log(`${'='.repeat(60)}`);

  // Check for API keys
  const keys = {
    'Anthropic': process.env.ANTHROPIC_API_KEY,
    'Gemini'   : process.env.GEMINI_API_KEY,
    'Mapbox'   : process.env.MAPBOX_API_KEY,
    'Serper'   : process.env.SERPER_API_KEY
  };

  for (const [name, key] of Object.entries(keys)) {
    if (!key || key.includes('your-') || key.includes('-key-here')) {
      logger.warn('CONFIG', `⚠️  ${name} API key is missing or invalid!`);
    } else {
      logger.success('CONFIG', `🔑 ${name} API key configured [${key.substring(0, 6)}...]`);
    }
  }

  logger.info('DATABASE', `🔥 Firebase DB: ${process.env.FIREBASE_DB_URL}\n`);
});
// reload

// env update
