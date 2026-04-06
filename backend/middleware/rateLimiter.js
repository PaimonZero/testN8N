/**
 * IP-based Rate Limiter Middleware
 *
 * Limits per IP per day:
 * - Default (no user keys):        50 req/day
 * - All 4 user keys provided:      100 req/day
 * - Claude Haiku, no Anthropic key: 1 req/day (unless admin code provided)
 */

const fs = require('fs');
const path = require('path');
const logger = require('../services/logger');

const ADMIN_UNLOCK_CODE = process.env.ADMIN_UNLOCK_CODE || 'wewillwin100';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DB_PATH = path.join(__dirname, '../.tmp-rate-limits.db');

// In-memory store: ip -> { count, claudeCount, resetAt }
let rateLimitStore = new Map();

// Initialize store from disk if exists
try {
  if (fs.existsSync(DB_PATH)) {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    rateLimitStore = new Map(Object.entries(data));
    logger.info('RATE_LIMIT', `Restored rate limits for ${rateLimitStore.size} IPs from disk.`);
  }
} catch (e) {
  logger.error('RATE_LIMIT', 'Failed to load rate limits from disk.', e);
}

/**
 * Save store to disk.
 */
function persistStore() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(Object.fromEntries(rateLimitStore)), 'utf8');
  } catch (e) {
    logger.error('RATE_LIMIT', 'Failed to persist rate limits to disk.', e);
  }
}

/**
 * Get or create a rate limit entry for an IP.
 */
function getEntry(ip) {
  const now = Date.now();
  let entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    // Create or reset entry
    entry = { count: 0, claudeCount: 0, resetAt: now + MS_PER_DAY };
    rateLimitStore.set(ip, entry);
    persistStore();
  }

  return entry;
}

/**
 * Determine the rate limit config based on user keys and model.
 */
function getLimitConfig(userKeys = {}, llmModel = 'gemini', adminCode = '') {
  const hasAllKeys =
    userKeys.geminiApiKey &&
    userKeys.anthropicApiKey &&
    userKeys.mapboxApiKey &&
    userKeys.serperApiKey;

  const isClaudeModel = llmModel === 'claude';
  const hasAnthropicKey = !!userKeys.anthropicApiKey;
  const isAdmin = adminCode === ADMIN_UNLOCK_CODE;

  return {
    isAllKeys: !!hasAllKeys,
    isClaudeNoKey: isClaudeModel && !hasAnthropicKey && !isAdmin,
    isAdmin,
    defaultLimit: hasAllKeys ? 100 : 50,
    claudeNoKeyLimit: 1,
  };
}

/**
 * Express middleware to check rate limits before processing a request.
 */
function rateLimiterMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const { userKeys = {}, llmModel = 'gemini', adminCode = '' } = req.body;

  const entry = getEntry(ip);
  const config = getLimitConfig(userKeys, llmModel, adminCode);

  // Check Claude-specific limit first
  if (config.isClaudeNoKey) {
    if (entry.claudeCount >= config.claudeNoKeyLimit) {
      const resetIn = Math.ceil((entry.resetAt - Date.now()) / 3600000);
      logger.warn('RATE_LIMIT', `IP ${ip} exceeded Claude Haiku limit (1/day without API key).`);
      return res.status(429).json({
        success: false,
        error: 'CLAUDE_LIMIT',
        message: `Đã hết lượt dùng Claude Haiku trong hôm nay (1 lần/ngày khi không có ANTHROPIC_API_KEY). Vui lòng nhập API key của bạn hoặc mã quản trị viên.`,
        resetInHours: resetIn,
        rateLimitStatus: getRateLimitStatus(ip, userKeys, llmModel, adminCode)
      });
    }
  }

  // Check general daily limit
  if (entry.count >= config.defaultLimit) {
    const resetIn = Math.ceil((entry.resetAt - Date.now()) / 3600000);
    logger.warn('RATE_LIMIT', `IP ${ip} exceeded daily limit (${config.defaultLimit}/day). Count: ${entry.count}`);
    return res.status(429).json({
      success: false,
      error: 'DAILY_LIMIT',
      message: `Bạn đã dùng hết ${config.defaultLimit} lượt hôm nay. Vui lòng nhập API key của bạn để tăng giới hạn lên 100 lượt/ngày.`,
      resetInHours: resetIn,
      limit: config.defaultLimit,
      used: entry.count,
      rateLimitStatus: getRateLimitStatus(ip, userKeys, llmModel, adminCode)
    });
  }

  // Pass limit info to the request for downstream use
  req.rateLimitConfig = config;
  req.rateLimitEntry = entry;
  req.clientIp = ip;

  next();
}

/**
 * Call this AFTER a successful request to increment the counters.
 */
function incrementLimit(ip, isClaudeNoKey = false) {
  const entry = rateLimitStore.get(ip);
  if (entry) {
    entry.count++;
    if (isClaudeNoKey) {
      entry.claudeCount++;
    }
    persistStore();
  }
}

/**
 * Get rate limit status for an IP (for the status endpoint).
 */
function getRateLimitStatus(ip, userKeys = {}, llmModel = 'gemini', adminCode = '') {
  const entry = getEntry(ip);
  const config = getLimitConfig(userKeys, llmModel, adminCode);
  const limit = config.defaultLimit;
  const remaining = Math.max(0, limit - entry.count);

  return {
    limit,
    used: entry.count,
    remaining,
    resetAt: entry.resetAt,
    isAllKeys: config.isAllKeys,
    claudeUsed: entry.claudeCount,
    claudeLimit: config.claudeNoKeyLimit,
  };
}

module.exports = { rateLimiterMiddleware, incrementLimit, getRateLimitStatus };
