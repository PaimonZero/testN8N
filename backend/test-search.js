/**
 * Test Search API — tự động test tất cả providers
 * Chạy: node test-search.js
 */

require('dotenv').config();

console.log('=== Test Search APIs ===\n');

const SERPER_KEY = process.env.SERPER_API_KEY;
const GOOGLE_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_SEARCH_CX;

console.log('Serper.dev:', SERPER_KEY && SERPER_KEY !== 'your-serper-api-key-here' ? '✅ Configured' : '❌ Not set');
console.log('Google CSE:', GOOGLE_KEY ? '⚙️ Configured' : '❌ Not set');
console.log('');

const query = 'bãi tắm đẹp Vũng Tàu';

// Test Serper.dev
async function testSerper() {
  if (!SERPER_KEY || SERPER_KEY === 'your-serper-api-key-here') {
    console.log('--- Serper.dev: SKIPPED (no key) ---\n');
    return false;
  }

  console.log('--- Testing Serper.dev ---');
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, gl: 'vn', hl: 'vi', num: 3 }),
    });
    const data = await res.json();

    if (!res.ok) {
      console.log('❌ Error:', res.status, data.message || JSON.stringify(data));
      return false;
    }

    const results = data.organic || [];
    console.log(`✅ ${results.length} results found!\n`);
    results.slice(0, 3).forEach((r, i) => console.log(`  ${i + 1}. ${r.title}\n     ${(r.snippet || '').substring(0, 80)}...\n`));
    return true;
  } catch (e) {
    console.log('❌ Error:', e.message);
    return false;
  }
}

// Test Google
async function testGoogle() {
  if (!GOOGLE_KEY || !GOOGLE_CX) {
    console.log('--- Google CSE: SKIPPED (no key) ---\n');
    return false;
  }

  console.log('--- Testing Google Custom Search ---');
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}&num=3`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.log('❌ Error:', data.error.code, data.error.message);
      return false;
    }

    const items = data.items || [];
    console.log(`✅ ${items.length} results found!\n`);
    items.forEach((r, i) => console.log(`  ${i + 1}. ${r.title}\n     ${(r.snippet || '').substring(0, 80)}...\n`));
    return true;
  } catch (e) {
    console.log('❌ Error:', e.message);
    return false;
  }
}

(async () => {
  const serperOk = await testSerper();
  const googleOk = await testGoogle();

  console.log('\n=== Summary ===');
  if (serperOk) console.log('✅ Serper.dev works — ready to use!');
  else if (googleOk) console.log('✅ Google CSE works — ready to use!');
  else {
    console.log('❌ No search API working.');
    console.log('\n💡 Easiest fix: Get Serper.dev key (free, 30 seconds):');
    console.log('   1. Go to https://serper.dev');
    console.log('   2. Sign up with Google/GitHub');
    console.log('   3. Copy API key from Dashboard');
    console.log('   4. Paste into backend/.env: SERPER_API_KEY=...');
  }
})();
