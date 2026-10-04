const http = require('http');

async function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 3000,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      }
    );

    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING NRK NEWS24 COMPREHENSIVE VERIFICATION ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  // 1. Homepage
  try {
    const res = await request('http://localhost:3000/');
    assert(res.statusCode === 200, 'Homepage returns HTTP 200');
    assert(res.body.includes('NRK'), 'Homepage contains NRK logo badge');
    assert(res.body.includes('NEWS') && res.body.includes('24'), 'Homepage contains NEWS24 brand elements');
    assert(res.body.includes('TOP STORIES'), 'Homepage renders Top Stories section');
    assert(res.body.includes('BREAKING NEWS'), 'Homepage contains Breaking News ticker');
  } catch (e) {
    assert(false, 'Homepage test', e.message);
  }

  // 2. Latest News
  try {
    const res = await request('http://localhost:3000/latest');
    assert(res.statusCode === 200, 'Latest News page returns HTTP 200');
    assert(res.body.includes('LATEST NEWS STREAM'), 'Latest News stream header present');
  } catch (e) {
    assert(false, 'Latest News test', e.message);
  }

  // 3. Category: Andhra Pradesh
  try {
    const res = await request('http://localhost:3000/category/andhra-pradesh');
    assert(res.statusCode === 200, 'Andhra Pradesh category page returns HTTP 200');
    assert(res.body.toLowerCase().includes('andhra pradesh'), 'AP category title rendered');
    assert(res.body.includes('Amaravati'), 'AP category contains Amaravati story');
  } catch (e) {
    assert(false, 'AP Category test', e.message);
  }

  // 4. Category: Telangana
  try {
    const res = await request('http://localhost:3000/category/telangana');
    assert(res.statusCode === 200, 'Telangana category page returns HTTP 200');
    assert(res.body.toLowerCase().includes('telangana'), 'Telangana category title rendered');
    assert(res.body.includes('Hyderabad'), 'Telangana category contains Hyderabad story');
  } catch (e) {
    assert(false, 'Telangana Category test', e.message);
  }

  // 5. Individual Article Page & SEO Open Graph tags
  try {
    const slug = 'amaravati-high-speed-rail-and-port-expressway-corridor-approved';
    const res = await request(`http://localhost:3000/news/${slug}`);
    assert(res.statusCode === 200, 'Article page returns HTTP 200');
    assert(res.body.includes('Amaravati High-Speed Rail'), 'Headline rendered in article body');
    assert(res.body.includes('WhatsApp'), 'WhatsApp share button present');
    assert(res.body.includes('Copy Link'), 'Copy Link button present');
    assert(res.body.includes('property="og:title"'), 'Open Graph og:title rendered for social crawlers');
    assert(res.body.includes('name="twitter:card"'), 'Twitter card metadata rendered');
    assert(res.body.includes('rel="canonical"'), 'Canonical URL tag rendered');
  } catch (e) {
    assert(false, 'Article Page test', e.message);
  }

  // 6. View & Share API tracking
  try {
    const slug = 'amaravati-high-speed-rail-and-port-expressway-corridor-approved';
    const viewRes = await request(`http://localhost:3000/api/articles/${slug}/view`, { method: 'POST' });
    const viewJson = JSON.parse(viewRes.body);
    assert(viewRes.statusCode === 200 && viewJson.success === true, 'View counter increments and responds');

    const shareRes = await request(`http://localhost:3000/api/articles/${slug}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: 'whatsapp' }),
    });
    const shareJson = JSON.parse(shareRes.body);
    assert(shareRes.statusCode === 200 && shareJson.success === true, 'Share counter increments and responds');
  } catch (e) {
    assert(false, 'View/Share tracking test', e.message);
  }

  // 7. Search API
  try {
    const res = await request('http://localhost:3000/api/search?q=Amaravati');
    const json = JSON.parse(res.body);
    assert(res.statusCode === 200 && json.results.length > 0, `Search API finds results for "Amaravati" (${json.results.length} found)`);
  } catch (e) {
    assert(false, 'Search API test', e.message);
  }

  // 8. Dynamic Sitemap XML
  try {
    const res = await request('http://localhost:3000/sitemap.xml');
    assert(res.statusCode === 200, 'Sitemap returns HTTP 200');
    assert(res.body.includes('<urlset'), 'Sitemap returns valid XML urlset');
    assert(res.body.includes('/news/'), 'Sitemap contains /news/ URLs');
  } catch (e) {
    assert(false, 'Sitemap test', e.message);
  }

  // 9. Robots.txt
  try {
    const res = await request('http://localhost:3000/robots.txt');
    assert(res.statusCode === 200, 'Robots.txt returns HTTP 200');
    assert(res.body.includes('Disallow: /admin/'), 'Robots.txt disallows /admin/');
    assert(res.body.includes('Sitemap:'), 'Robots.txt references sitemap.xml');
  } catch (e) {
    assert(false, 'Robots test', e.message);
  }

  // 10. Security: Unauthenticated Admin Access blocked
  try {
    const res = await request('http://localhost:3000/admin/dashboard');
    assert(
      [302, 307, 308].includes(res.statusCode) && (res.headers.location?.includes('/admin/login')),
      `Unauthorized access to /admin/dashboard redirects to /admin/login (Status: ${res.statusCode}, Location: ${res.headers.location})`
    );
  } catch (e) {
    assert(false, 'Protected admin route test', e.message);
  }

  // 11. Admin Login API
  let adminCookie = '';
  try {
    const res = await request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nrknews24.com', password: 'Admin@NRK2026!' }),
    });
    const json = JSON.parse(res.body);
    assert(res.statusCode === 200 && json.success === true, 'Admin login succeeds with credentials');
    const setCookie = res.headers['set-cookie'];
    if (setCookie && setCookie.length > 0) {
      adminCookie = setCookie[0].split(';')[0];
      assert(adminCookie.startsWith('nrk_admin_token='), 'HTTP-only auth cookie set properly');
    } else {
      assert(false, 'Auth cookie set', 'No cookie returned');
    }
  } catch (e) {
    assert(false, 'Admin login test', e.message);
  }

  // 12. Authenticated Admin Stats
  try {
    const res = await request('http://localhost:3000/api/admin/stats', {
      headers: { Cookie: adminCookie },
    });
    const json = JSON.parse(res.body);
    assert(res.statusCode === 200 && json.success === true, 'Authenticated admin can fetch stats');
    assert(json.stats.totalArticles >= 12, `Total articles reported: ${json.stats.totalArticles}`);
    assert(json.stats.pendingAiCount >= 2, `Pending AI articles in queue: ${json.stats.pendingAiCount}`);
  } catch (e) {
    assert(false, 'Admin Stats test', e.message);
  }

  // 13. AI News Queue
  try {
    const res = await request('http://localhost:3000/api/admin/ai-news', {
      headers: { Cookie: adminCookie },
    });
    const json = JSON.parse(res.body);
    assert(res.statusCode === 200 && json.articles.length >= 2, `AI News Queue lists ${json.articles.length} pending items`);
  } catch (e) {
    assert(false, 'AI News Queue test', e.message);
  }

  // 14. News Sources
  try {
    const res = await request('http://localhost:3000/api/admin/news-sources', {
      headers: { Cookie: adminCookie },
    });
    const json = JSON.parse(res.body);
    assert(res.statusCode === 200 && json.sources.length >= 6, `Approved News Sources configured: ${json.sources.length}`);
  } catch (e) {
    assert(false, 'News Sources test', e.message);
  }

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
