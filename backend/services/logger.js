/**
 * Logger Service — Centralized logging with timestamps and categories.
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

const LOG_FILE = path.join(__dirname, '../server.log');

const getTimestamp = () => new Date().toISOString();

const writeToFile = (text) => {
  try {
    fs.appendFileSync(LOG_FILE, text + '\n');
  } catch (err) {
    // Ignore log errors
  }
};

const logger = {
  info: (category, message) => {
    const text = `[${getTimestamp()}] [${category}] ${message}`;
    console.log(`${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ${COLORS.bright}${COLORS.blue}[${category}]${COLORS.reset} ${message}`);
    writeToFile(text);
  },
  
  success: (category, message) => {
    const text = `[${getTimestamp()}] [${category}] SUCCESS: ${message}`;
    console.log(`${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ${COLORS.bright}${COLORS.green}[${category}]${COLORS.reset} ${message}`);
    writeToFile(text);
  },
  
  warn: (category, message) => {
    const text = `[${getTimestamp()}] [${category}] WARNING: ${message}`;
    console.log(`${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ${COLORS.bright}${COLORS.yellow}[${category}]${COLORS.reset} ${message}`);
    writeToFile(text);
  },
  
  error: (category, message, error = null) => {
    const text = `[${getTimestamp()}] [${category}] ERROR: ${message}`;
    console.log(`${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ${COLORS.bright}${COLORS.red}[${category}]${COLORS.reset} ${message}`);
    writeToFile(text);
    if (error) {
      if (error.stack) {
        console.log(`${COLORS.dim}${error.stack}${COLORS.reset}`);
        writeToFile(error.stack);
      } else {
        const errJson = JSON.stringify(error, null, 2);
        console.log(`${COLORS.dim}${errJson}${COLORS.reset}`);
        writeToFile(errJson);
      }
    }
  },
  
  api: (method, url, status, duration) => {
    const text = `[${getTimestamp()}] [API] ${method} ${url} ${status} (${duration}ms)`;
    const statusColor = status < 400 ? COLORS.green : COLORS.red;
    console.log(`${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ${COLORS.bright}${COLORS.cyan}[API]${COLORS.reset} ${method} ${url} ${statusColor}${status}${COLORS.reset} (${duration}ms)`);
    writeToFile(text);
  },

  llm: (model, prompt, response) => {
    const text = `[${getTimestamp()}] [LLM:${model}] Request/Response logged`;
    console.log(`${COLORS.dim}[${getTimestamp()}]${COLORS.reset} ${COLORS.bright}${COLORS.magenta}[LLM:${model}]${COLORS.reset} Request sent...`);
    if (process.env.DEBUG_LLM === 'true') {
        const fullText = `--- PROMPT ---\n${prompt}\n--- RESPONSE ---\n${response}\n---------------`;
        console.log(`${COLORS.dim}${fullText}${COLORS.reset}`);
        writeToFile(fullText);
    }
    writeToFile(text);
  }
};

module.exports = logger;
