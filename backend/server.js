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
const { runAgent } = require('./agent/reactAgent');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ──────────────────────────────────────────────
// POST /api/chat — Main agent endpoint
// ──────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body;

  // Validate input
  if (!message || !sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: message, sessionId',
    });
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🤖 New request [${sessionId}]`);
  console.log(`📝 Message: "${message.substring(0, 100)}..."`);
  console.log(`${'='.repeat(60)}`);

  try {
    const startTime = Date.now();

    // Run the ReAct agent (this pushes Firebase logs along the way)
    const result = await runAgent(message, sessionId);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Completed in ${duration}s\n`);

    res.json(result);
  } catch (error) {
    console.error('❌ Agent error:', error.message);

    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
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
  console.log(`\n🚀 ReAct Agent Backend running at http://localhost:${PORT}`);
  console.log(`📡 Endpoint: POST http://localhost:${PORT}/api/chat`);
  console.log(`💚 Health: GET http://localhost:${PORT}/health`);

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key-here') {
    console.warn(`\n⚠️  WARNING: ANTHROPIC_API_KEY not set in .env file!`);
    console.warn(`   Please add your API key to backend/.env`);
  } else {
    console.log(`🔑 Anthropic API key configured`);
  }

  console.log(`🔥 Firebase DB: ${process.env.FIREBASE_DB_URL}\n`);
});
