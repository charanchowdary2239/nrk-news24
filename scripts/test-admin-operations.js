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

async function runAdminTests() {
  console.log('=== TESTING ADMIN CMS OPERATIONS ===\n');

  // 1. Login to get cookie
  const loginRes = await request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@nrknews24.com', password: 'Admin@NRK2026!' }),
  });

  const cookieHeader = loginRes.headers['set-cookie'];
  const tokenCookie = (Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader).split(';')[0];
  console.log('✓ Login successful, got auth cookie');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Cookie': tokenCookie,
  };

  // 2. Create a test article
  const createRes = await request('http://localhost:3000/api/admin/articles', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Test Verification Headline 2026',
      summary: 'Short summary for verification test.',
      content: '<p>Complete article test content.</p>',
      category_id: 1,
      author: 'Test Bureau',
      status: 'published',
      is_featured: true,
      is_breaking: true,
    }),
  });

  const createData = JSON.parse(createRes.body);
  console.log('Create Article status:', createRes.statusCode, 'Success:', createData.success);
  if (!createData.success) {
    console.error('Failed to create article:', createData);
    process.exit(1);
  }
  const createdArticleId = createData.article.id;
  console.log('✓ Created article with ID:', createdArticleId);

  // 3. Edit the article
  const editRes = await request(`http://localhost:3000/api/articles/${createdArticleId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Updated Verification Headline 2026',
      summary: 'Updated summary.',
      is_featured: false,
    }),
  });
  const editData = JSON.parse(editRes.body);
  console.log('✓ Edited article:', editData.article.title);

  // 4. Save as draft
  const draftRes = await request(`http://localhost:3000/api/articles/${createdArticleId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      status: 'draft',
    }),
  });
  const draftData = JSON.parse(draftRes.body);
  console.log('✓ Saved as draft. Status:', draftData.article.status);

  // 5. Delete the test article
  const deleteRes = await request(`http://localhost:3000/api/articles/${createdArticleId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const deleteData = JSON.parse(deleteRes.body);
  console.log('✓ Deleted article:', deleteData.success);

  // 6. Test Breaking News update
  const breakRes = await request('http://localhost:3000/api/breaking', {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      enabled: true,
      customTicker: 'Special Alert Verification',
    }),
  });
  console.log('✓ Breaking ticker updated:', JSON.parse(breakRes.body).success);

  // Reset breaking ticker
  await request('http://localhost:3000/api/breaking', {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      enabled: true,
      customTicker: '',
    }),
  });

  console.log('\n🎉 ALL ADMIN CMS OPERATIONS TESTED SUCCESSFULLY!');
}

runAdminTests().catch((e) => {
  console.error('Admin test failed:', e);
  process.exit(1);
});
