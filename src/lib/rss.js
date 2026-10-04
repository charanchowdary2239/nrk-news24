const Parser = require('rss-parser');
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
      ['enclosure', 'enclosure'],
      ['dc:creator', 'dcCreator'],
    ],
  },
});

/**
 * Extracts a high-res image URL from RSS item metadata or HTML content
 */
function extractImageFromItem(item) {
  // Check enclosure
  if (item.enclosure && item.enclosure.url && (item.enclosure.type?.includes('image') || /\.(jpg|jpeg|png|webp|avif)/i.test(item.enclosure.url))) {
    return item.enclosure.url;
  }

  // Check media:content
  if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
    return item.mediaContent.$.url;
  }
  if (Array.isArray(item.mediaContent) && item.mediaContent[0]?.$?.url) {
    return item.mediaContent[0].$.url;
  }

  // Check media:thumbnail
  if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
    return item.mediaThumbnail.$.url;
  }

  // Check HTML in content or content:encoded or description
  const html = item.contentEncoded || item.content || item.summary || item.description || '';
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }

  return null;
}

/**
 * Cleans HTML tags from text
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '')
    .replace(/<style[^>]*>([\S\s]*?)<\/style>/gmi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch and parse a single RSS feed URL
 */
async function fetchRssFeed(feedUrl) {
  try {
    const feed = await parser.parseURL(feedUrl);
    
    const items = (feed.items || []).map((item) => {
      const rawText = item.contentEncoded || item.content || item.summary || item.description || '';
      const cleanSnippet = stripHtml(rawText);
      const imageUrl = extractImageFromItem(item);

      return {
        title: item.title ? item.title.trim() : 'Untitled News',
        link: item.link || '',
        pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        author: item.dcCreator || item.creator || feed.title || 'Agency Feed',
        snippet: cleanSnippet.substring(0, 1000),
        rawContent: cleanSnippet,
        imageUrl: imageUrl || null,
        guid: item.guid || item.id || item.link,
      };
    });

    return {
      title: feed.title || 'News Feed',
      description: feed.description || '',
      items: items.slice(0, 15), // Process top 15 latest items
    };
  } catch (error) {
    console.error(`Error fetching RSS feed from ${feedUrl}:`, error.message);
    throw error;
  }
}

module.exports = {
  fetchRssFeed,
  stripHtml,
};
