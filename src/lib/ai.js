const { generateUniqueSlug } = require('./slugify');
const { v4: uuidv4 } = require('uuid');

/**
 * Intelligent categorization based on headline and content keywords
 */
function detectCategorySlug(text, defaultSlug = 'india') {
  const lower = (text || '').toLowerCase();

  if (/\b(andhra|amaravati|visakhapatnam|vizag|vijayawada|ysrcp|tdp|chandrababu|jagan|pawan kalyan|tirupati|kurnool|guntur|ap govt)\b/i.test(lower)) {
    return 'andhra-pradesh';
  }
  if (/\b(telangana|hyderabad|revanth|kcr|brs|secunderabad|warangal|nizamabad|khammam|tg govt)\b/i.test(lower)) {
    return 'telangana';
  }
  if (/\b(cricket|ipl|bcci|rohit|kohli|tennis|football|fifa|olympic|badminton|wicket|world cup|hockey)\b/i.test(lower)) {
    return 'sports';
  }
  if (/\b(ai|artificial intelligence|tech|software|google|apple|microsoft|nvidia|smartphone|cyber|chip|meta|spacex|isro|nasa)\b/i.test(lower)) {
    return 'technology';
  }
  if (/\b(sensex|nifty|rbi|inflation|gdp|economy|market|rupee|stock|investor|fiscal|startup|fintech|banking)\b/i.test(lower)) {
    return 'business';
  }
  if (/\b(movie|cinema|film|actor|actress|tollywood|bollywood|hollywood|box office|trailer|director|ott|release)\b/i.test(lower)) {
    return 'entertainment';
  }
  if (/\b(exam|neet|jee|cbse|university|college|ugc|results|admission|school|education|curriculum)\b/i.test(lower)) {
    return 'education';
  }
  if (/\b(election|poll|lok sabha|rajya sabha|parliament|bjp|congress|modi|rahul|cabinet|bill|supreme court|governor)\b/i.test(lower)) {
    return 'politics';
  }
  if (/\b(us|usa|china|russia|ukraine|israel|iran|un|united nations|biden|trump|putin|europe|middle east|global)\b/i.test(lower)) {
    return 'world';
  }

  return defaultSlug || 'india';
}

/**
 * Generate relevant keyword tags
 */
function extractTags(text, categorySlug) {
  const commonWords = new Set(['the', 'and', 'with', 'from', 'that', 'this', 'have', 'were', 'will', 'been', 'said', 'after', 'over', 'into', 'under', 'news', 'update', 'latest', 'today', 'report']);
  const words = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4 && !commonWords.has(w));
  
  const unique = Array.from(new Set(words)).slice(0, 4);
  return Array.from(new Set([categorySlug.replace('-', ' '), ...unique]));
}

/**
 * Transforms incoming raw feed content via Google Gemini API
 */
async function callGeminiApi(apiKey, model, title, snippet, sourceName) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`;

  const prompt = `You are a senior news editor at NRK News24, an independent digital news organization.
Transform this incoming wire report into an original, factual, and engaging news article.
DO NOT fabricate false facts. Synthesize and expand based on the verified report.

Source Attribution: ${sourceName}
Incoming Headline: ${title}
Information Summary: ${snippet}

Respond ONLY with valid JSON with this exact schema (no markdown surrounding ticks, just raw json):
{
  "headline": "Compelling journalistic headline (up to 90 characters)",
  "summary": "Clear, concise 2-sentence summary providing core developments",
  "content": "<p>Opening paragraph stating the who, what, when, and where.</p><h2>Key Developments</h2><p>Second paragraph providing full context and verified quotes or facts.</p><h2>Background and Impact</h2><p>Third paragraph providing background history, official reactions, and wider implications.</p><p>Concluding paragraph regarding ongoing investigations or future actions.</p>",
  "suggestedCategory": "india|andhra-pradesh|telangana|world|politics|sports|business|technology|entertainment|education",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"]
}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Gemini API');

  return JSON.parse(rawText);
}

/**
 * Built-in intelligent news transformer fallback
 */
function fallbackGenerateArticle(title, snippet, sourceName, fallbackCategory) {
  const categorySlug = detectCategorySlug(`${title} ${snippet}`, fallbackCategory);
  const tags = extractTags(`${title} ${snippet}`, categorySlug);

  const cleanTitle = title.replace(/\s*-\s*[^-]+$/, '').trim();
  const leadSummary = snippet.length > 50
    ? snippet.slice(0, 240) + '...'
    : `${cleanTitle} — key developments and verified updates reported by ${sourceName}.`;

  const content = `
<p><strong>${cleanTitle}</strong> — In a significant development, key updates have emerged regarding current proceedings. As reported by ${sourceName} and verified by NRK News24 desk, authorities and concerned parties are closely assessing the situation.</p>

<h2>Key Details and Verified Facts</h2>
<p>${snippet || 'Further details are being gathered as official briefings conclude. Preliminary information indicates substantial interest from regional observers and stakeholders.'}</p>

<h2>Background and Broader Context</h2>
<p>The latest events follow a series of policy evaluations and strategic milestones observed over recent months. Analysts emphasize the long-term impact on governance, regional industry, and civic engagement.</p>

<p>NRK News24 will continue to monitor this story and provide verified updates as official statements are released.</p>
  `.trim();

  return {
    headline: cleanTitle,
    summary: leadSummary,
    content,
    suggestedCategory: categorySlug,
    tags,
  };
}

/**
 * Main article generator pipeline
 */
async function generateArticleFromFeedItem(item, source) {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || 'gemini-1.5-flash';

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const generated = await callGeminiApi(apiKey, model, item.title, item.snippet || item.rawContent, source.name);
      return {
        headline: generated.headline || item.title,
        summary: generated.summary || item.snippet,
        content: generated.content,
        suggestedCategory: generated.suggestedCategory || detectCategorySlug(item.title),
        tags: Array.isArray(generated.tags) ? generated.tags : [source.name],
        isAiGenerated: true,
      };
    } catch (err) {
      console.warn(`[AI Engine] Gemini API call failed, falling back to built-in transformer:`, err.message);
    }
  }

  // Fallback transformer
  const fallback = fallbackGenerateArticle(item.title, item.snippet || item.rawContent, source.name, source.category_slug);
  return {
    ...fallback,
    isAiGenerated: false,
  };
}

/**
 * Ingests a single feed item into the database with pending_review status
 */
async function ingestFeedItem(db, item, source) {
  const { isSupabaseConfigured, getSupabaseAdmin } = require('./supabase');

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    // Check if article with same sourceUrl or title already exists
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .or(`source_url.eq."${item.link}",title.eq."${item.title.replace(/"/g, '""')}"`)
      .maybeSingle();

    if (existing) {
      return { skipped: true, reason: 'Already exists' };
    }

    const generated = await generateArticleFromFeedItem(item, source);

    let categoryId = source.category_id || 1;
    const { data: categoryRow } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', generated.suggestedCategory)
      .maybeSingle();

    if (categoryRow) {
      categoryId = categoryRow.id;
    }

    const articleId = uuidv4();
    const slug = await generateUniqueSlug(generated.headline);
    const tagsJson = JSON.stringify(generated.tags);
    const fallbackImage = item.imageUrl || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80`;

    await supabase.from('articles').insert({
      id: articleId,
      title: generated.headline,
      slug,
      summary: generated.summary,
      content: generated.content,
      featured_image: fallbackImage,
      category_id: categoryId,
      tags: tagsJson,
      author: 'NRK AI News Desk',
      source_name: source.name,
      source_url: item.link,
      status: 'pending_review',
      is_featured: 0,
      is_breaking: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return {
      skipped: false,
      articleId,
      title: generated.headline,
      slug,
      status: 'pending_review',
    };
  }

  // SQLite Fallback
  if (!db) {
    const { getDb } = require('./db');
    db = getDb();
  }
  if (!db) return { skipped: true, reason: 'Database unavailable' };

  const existing = db.prepare(`
    SELECT id FROM articles 
    WHERE source_url = ? OR title = ?
  `).get(item.link, item.title);

  if (existing) {
    return { skipped: true, reason: 'Already exists' };
  }

  // Generate article draft
  const generated = await generateArticleFromFeedItem(item, source);

  // Match category
  let categoryId = null;
  const categoryRow = db.prepare('SELECT id FROM categories WHERE slug = ?').get(generated.suggestedCategory);
  if (categoryRow) {
    categoryId = categoryRow.id;
  } else if (source.category_id) {
    categoryId = source.category_id;
  } else {
    const defaultCat = db.prepare("SELECT id FROM categories WHERE slug = 'india'").get();
    categoryId = defaultCat ? defaultCat.id : 1;
  }

  const articleId = uuidv4();
  const slug = generateUniqueSlug(db, generated.headline);
  const tagsJson = JSON.stringify(generated.tags);

  const fallbackImage = item.imageUrl || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80`;

  db.prepare(`
    INSERT INTO articles (
      id, title, slug, summary, content, featured_image,
      category_id, tags, author, source_name, source_url,
      status, is_featured, is_breaking, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      'pending_review', 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
  `).run(
    articleId,
    generated.headline,
    slug,
    generated.summary,
    generated.content,
    fallbackImage,
    categoryId,
    tagsJson,
    'NRK AI News Desk',
    source.name,
    item.link
  );

  return {
    skipped: false,
    articleId,
    title: generated.headline,
    slug,
    status: 'pending_review'
  };
}

module.exports = {
  detectCategorySlug,
  extractTags,
  generateArticleFromFeedItem,
  ingestFeedItem,
};
