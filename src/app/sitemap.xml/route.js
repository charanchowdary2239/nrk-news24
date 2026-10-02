import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const articles = db.prepare(`
      SELECT slug, published_at, updated_at 
      FROM articles 
      WHERE status = 'published'
      ORDER BY published_at DESC
      LIMIT 1000
    `).all();

    const categories = db.prepare('SELECT slug FROM categories ORDER BY display_order ASC').all();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    xml += `  <url>\n`;
    xml += `    <loc>${siteUrl}/</loc>\n`;
    xml += `    <changefreq>always</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    xml += `  <url>\n`;
    xml += `    <loc>${siteUrl}/latest</loc>\n`;
    xml += `    <changefreq>hourly</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `  </url>\n`;

    for (const cat of categories) {
      xml += `  <url>\n`;
      xml += `    <loc>${siteUrl}/category/${cat.slug}</loc>\n`;
      xml += `    <changefreq>hourly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    for (const art of articles) {
      const lastMod = art.updated_at || art.published_at || new Date().toISOString();
      xml += `  <url>\n`;
      xml += `    <loc>${siteUrl}/news/${art.slug}</loc>\n`;
      xml += `    <lastmod>${new Date(lastMod).toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err) {
    console.error('Error generating sitemap:', err);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
