/**
 * LLM Service — Switchable between Anthropic Claude and Google Gemini.
 */

const logger = require('./logger');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const CLAUDE_MODEL = 'claude-3-haiku-20240307';
const GEMINI_MODEL = 'gemini-3-flash-preview';

/**
 * Call LLM API based on modelType.
 *
 * @param {string} prompt - User message / prompt
 * @param {string} systemPrompt - Optional system prompt
 * @param {number} maxTokens - Max tokens to generate
 * @param {string} modelType - 'claude' or 'gemini'
 * @returns {string} - The text response from LLM
 */
async function callLLM(prompt, systemPrompt = '', maxTokens = 2048, modelType = 'claude', userKeys = {}) {
  if (modelType === 'gemini') {
    return callGemini(prompt, systemPrompt, maxTokens, userKeys);
  }
  return callClaude(prompt, systemPrompt, maxTokens, userKeys);
}

/**
 * Helper to call Gemini 1.5/2.5 REST API.
 */
async function callGemini(prompt, systemPrompt, maxTokens, userKeys = {}) {
  const apiKey = userKeys.geminiApiKey || GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    logger.error('LLM_SERVICE', 'GEMINI_API_KEY is not configured or using placeholder.');
    throw new Error('Chưa cấu hình GEMINI_API_KEY trong .env');
  }

  const startTime = Date.now();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  
  const body = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      maxOutputTokens: maxTokens
    }
  };

  if (systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  try {
    logger.info('LLM_SERVICE', `Calling Gemini 1.5 Flash [len: ${prompt.length}]...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('LLM_SERVICE', `Gemini API Error (status: ${response.status})`, errorText);
      throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    let resultText = '';
    
    try {
      resultText = data.candidates[0].content.parts[0].text;
      logger.success('LLM_SERVICE', `Gemini responded in ${duration}ms [len: ${resultText.length}]`);
      
      // Detailed debug log
      if (process.env.DEBUG_LLM === 'true') {
        logger.llm('GEMINI_2.5', prompt, resultText);
      }
      
      return resultText;
    } catch (err) {
      logger.error('LLM_SERVICE', 'Failed to parse Gemini response payload', data);
      throw new Error('Lỗi khi bóc tách kết quả từ Gemini API: ' + JSON.stringify(data));
    }
  } catch (error) {
    logger.error('LLM_SERVICE', `Unexpected error in callGemini: ${error.message}`, error);
    throw error;
  }
}

/**
 * Helper to call Anthropic Claude Messages API.
 */
async function callClaude(prompt, systemPrompt, maxTokens, userKeys = {}) {
  const apiKey = userKeys.anthropicApiKey || ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
    logger.error('LLM_SERVICE', 'ANTHROPIC_API_KEY is not configured or using placeholder.');
    throw new Error('Chưa cấu hình ANTHROPIC_API_KEY trong .env');
  }

  const startTime = Date.now();
  const body = {
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: 'user', content: prompt },
    ],
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  try {
    logger.info('LLM_SERVICE', `Calling Claude 3 Haiku [len: ${prompt.length}]...`);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('LLM_SERVICE', `Claude API Error (status: ${response.status})`, errorText);
      throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const resultText = data.content[0].text;
    
    logger.success('LLM_SERVICE', `Claude responded in ${duration}ms [len: ${resultText.length}]`);
    
    // Detailed debug log
    if (process.env.DEBUG_LLM === 'true') {
      logger.llm('CLAUDE_3', prompt, resultText);
    }
    
    return resultText;
  } catch (error) {
    logger.error('LLM_SERVICE', `Unexpected error in callClaude: ${error.message}`, error);
    throw error;
  }
}

module.exports = { callLLM };
