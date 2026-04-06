/**
 * LLM Service — Call Anthropic Claude API.
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-20250514';

/**
 * Call Anthropic Claude Messages API.
 *
 * @param {string} prompt - User message / prompt
 * @param {string} systemPrompt - Optional system prompt
 * @param {number} maxTokens - Max tokens to generate
 * @returns {string} - The text response from Claude
 */
async function callClaude(prompt, systemPrompt = '', maxTokens = 2048) {
  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: 'user', content: prompt },
    ],
  };

  // Add system prompt if provided
  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

module.exports = { callClaude };
