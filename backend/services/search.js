/**
 * Search Service — Hỗ trợ nhiều provider với fallback tự động.
 *
 * Provider 1: Serper.dev (FREE 2500 queries, không cần thẻ)
 *   → Đăng ký: https://serper.dev → lấy API key
 *   → Thêm vào .env: SERPER_API_KEY=...
 *
 * Provider 2: Google Custom Search API (FREE 100 queries/ngày)
 *   → Setup phức tạp hơn, xem .env comments
 *
 * Fallback: Agent dùng kiến thức có sẵn
 */

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_SEARCH_CX;

/**
 * Search the web — tự động chọn provider khả dụng.
 */
async function searchWeb(query) {
  // Priority 1: Serper.dev (dễ setup nhất)
  if (SERPER_API_KEY && SERPER_API_KEY !== 'your-serper-api-key-here') {
    console.log('🔍 Using Serper.dev for search...');
    return await searchSerper(query);
  }

  // Priority 2: Google Custom Search
  if (GOOGLE_API_KEY && GOOGLE_CX &&
      GOOGLE_API_KEY !== 'your-google-api-key-here') {
    console.log('🔍 Using Google Custom Search...');
    return await searchGoogle(query);
  }

  console.warn('⚠️  No search API configured. Add SERPER_API_KEY to .env');
  console.warn('   Get free key: https://serper.dev');
  return formatFallback(query);
}

/**
 * Serper.dev — Google Search Results API.
 * FREE: 2500 queries (no credit card needed)
 */
async function searchSerper(query) {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        gl: 'vn',
        hl: 'vi',
        num: 5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Serper error ${response.status}:`, errorText);
      return formatFallback(query);
    }

    const data = await response.json();
    const organic = data.organic || [];

    if (organic.length === 0) {
      return formatFallback(query);
    }

    let formatted = `Kết quả tìm kiếm cho "${query}":\n\n`;

    organic.slice(0, 5).forEach((item, i) => {
      formatted += `${i + 1}. **${item.title}**\n`;
      if (item.snippet) {
        formatted += `   ${item.snippet}\n`;
      }
      if (item.link) {
        formatted += `   🔗 ${item.link}\n`;
      }
      formatted += '\n';
    });

    console.log(`✅ Serper: ${organic.length} results found`);
    return formatted;
  } catch (error) {
    console.warn('Serper error:', error.message);
    return formatFallback(query);
  }
}

/**
 * Google Custom Search JSON API.
 * FREE: 100 queries/day
 */
async function searchGoogle(query) {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}&num=5&lr=lang_vi`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn(`Google Search error ${response.status}:`, errorData?.error?.message);
      return formatFallback(query);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return formatFallback(query);
    }

    let formatted = `Kết quả tìm kiếm cho "${query}":\n\n`;

    data.items.slice(0, 5).forEach((item, i) => {
      formatted += `${i + 1}. **${item.title}**\n`;
      if (item.snippet) formatted += `   ${item.snippet}\n`;
      if (item.link) formatted += `   🔗 ${item.link}\n`;
      formatted += '\n';
    });

    console.log(`✅ Google Search: ${data.items.length} results found`);
    return formatted;
  } catch (error) {
    console.warn('Google Search error:', error.message);
    return formatFallback(query);
  }
}

function formatFallback(query) {
  return `Tìm kiếm "${query}" — Search API chưa cấu hình hoặc lỗi. Agent sẽ dùng kiến thức có sẵn để gợi ý.`;
}

module.exports = { searchWeb };
