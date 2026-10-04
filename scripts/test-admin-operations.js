const http = require('http');
const fs = require('fs');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

loadEnvFile('.env.local');
loadEnvFile('.env');

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

async function runAdminTests() {
  console.log('=== TESTING ADMIN CMS OPERATIONS & DUAL-LAYER AUTH ===\n');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nrknews24.com';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@NRK2026!';

  // 1. Login
  const loginRes = await request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });

  const loginData = JSON.parse(loginRes.body);
  if (!loginData.success || !loginData.token) {
    console.error('Login failed:', loginData);
    process.exit(1);
  }
  console.log('✓ [1/8] Login successful. Dual-layer token received in response body.');

  const token = loginData.token;
  const cookieHeader = loginRes.headers['set-cookie'];
  const tokenCookie = cookieHeader ? (Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader).split(';')[0] : '';
  console.log('✓ [2/8] Set-Cookie received.');

  // Test 1: Verify Bearer header ONLY (simulates browser where cookies are blocked or across domains)
  const bearerHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Test 2: Create a test article using Bearer token
  const createRes = await request('http://localhost:3000/api/admin/articles', {
    method: 'POST',
    headers: bearerHeaders,
    body: JSON.stringify({
      title: 'Verification Test Story 2026',
      summary: 'Automated verification test story for admin auth migration.',
      content: '<p>This is a test article created via Bearer header authentication.</p>',
      category_id: 1,
      author: 'NRK Quality Assurance',
      status: 'published',
      is_featured: true,
      is_breaking: true,
    }),
  });

  const createData = JSON.parse(createRes.body);
  if (!createData.success) {
    console.error('Failed to create article via Bearer auth:', createData);
    process.exit(1);
  }
  const createdArticleId = createData.article.id;
  console.log('✓ [3/8] Created article via Bearer Auth (ID:', createdArticleId, ')');

  // Test 3: Edit the article using Cookie ONLY (simulates traditional cookie flow)
  const cookieHeaders = {
    'Content-Type': 'application/json',
    'Cookie': tokenCookie,
  };

  const editRes = await request(`http://localhost:3000/api/articles/${createdArticleId}`, {
    method: 'PUT',
    headers: cookieHeaders,
    body: JSON.stringify({
      title: 'Updated Verification Test Story 2026',
      summary: 'Updated summary via Cookie Auth.',
      is_featured: false,
    }),
  });
  const editData = JSON.parse(editRes.body);
  if (!editData.success) {
    console.error('Failed to edit article via Cookie auth:', editData);
    process.exit(1);
  }
  console.log('✓ [4/8] Edited article via Cookie Auth ("' + editData.article.title + '")');

  // Test 4: Save as draft using combined dual-layer headers
  const dualHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Cookie': tokenCookie,
  };

  const draftRes = await request(`http://localhost:3000/api/articles/${createdArticleId}`, {
    method: 'PUT',
    headers: dualHeaders,
    body: JSON.stringify({
      status: 'draft',
    }),
  });
  const draftData = JSON.parse(draftRes.body);
  if (!draftData.success || draftData.article.status !== 'draft') {
    console.error('Failed to save draft:', draftData);
    process.exit(1);
  }
  console.log('✓ [5/8] Saved as draft via Dual-layer Auth. Status:', draftData.article.status);

  // Test 5: Test image upload endpoint with multipart payload
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const dummyFileContent = 'fake-image-png-content';
  const multipartBody = 
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="test-auth-image.png"\r\n` +
    `Content-Type: image/png\r\n\r\n` +
    `${dummyFileContent}\r\n` +
    `--${boundary}--\r\n`;

  const uploadRes = await request('http://localhost:3000/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Authorization': `Bearer ${token}`,
    },
    body: multipartBody,
  });

  const uploadData = JSON.parse(uploadRes.body);
  if (!uploadData.success || !uploadData.url) {
    console.error('Upload failed:', uploadData);
    process.exit(1);
  }
  console.log('✓ [6/8] Uploaded image via Bearer Auth. URL:', uploadData.url);

  // Test 6: Delete the test article
  const deleteRes = await request(`http://localhost:3000/api/articles/${createdArticleId}`, {
    method: 'DELETE',
    headers: bearerHeaders,
  });
  const deleteData = JSON.parse(deleteRes.body);
  if (!deleteData.success) {
    console.error('Failed to delete article:', deleteData);
    process.exit(1);
  }
  console.log('✓ [7/8] Deleted test article via Bearer Auth successfully.');

  // Test 7: Verify Admin Stats
  const statsRes = await request('http://localhost:3000/api/admin/stats', {
    method: 'GET',
    headers: bearerHeaders,
  });
  const statsData = JSON.parse(statsRes.body);
  if (!statsData.success) {
    console.error('Failed to get admin stats:', statsData);
    process.exit(1);
  }
  console.log('✓ [8/8] Admin stats retrieved successfully. Total articles in Supabase:', statsData.stats.totalArticles);

  console.log('\n======================================================');
  console.log('🎉 ALL ADMIN CMS OPERATIONS & AUTH TESTS PASSED 100%!');
  console.log('======================================================\n');
}

runAdminTests().catch((e) => {
  console.error('Admin test failed:', e);
  process.exit(1);
});
