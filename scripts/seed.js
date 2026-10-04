const path = require('path');
const fs = require('fs');

// Simple native .env loader without external dependency
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../src/lib/db');
const { slugify } = require('../src/lib/slugify');

async function seed() {
  console.log('--- Starting NRK News24 Database Seeding ---');
  const db = getDb();

  // 1. Seed Categories
  const categories = [
    { name: 'India', slug: 'india', description: 'National news, policy decisions, and affairs across India', order: 1 },
    { name: 'Andhra Pradesh', slug: 'andhra-pradesh', description: 'Comprehensive coverage of Amaravati, Visakhapatnam, and AP state governance', order: 2 },
    { name: 'Telangana', slug: 'telangana', description: 'In-depth reporting from Hyderabad, Secunderabad, and Telangana districts', order: 3 },
    { name: 'World', slug: 'world', description: 'Global geopolitics, international relations, and major world events', order: 4 },
    { name: 'Politics', slug: 'politics', description: 'Parliamentary debates, party politics, legislative updates, and election analysis', order: 5 },
    { name: 'Sports', slug: 'sports', description: 'Cricket, Olympics, football, badminton, and athlete profiles', order: 6 },
    { name: 'Business', slug: 'business', description: 'Markets, economy, Sensex, RBI monetary policy, and corporate developments', order: 7 },
    { name: 'Technology', slug: 'technology', description: 'Artificial intelligence, gadgets, cybersecurity, software, and space missions', order: 8 },
    { name: 'Entertainment', slug: 'entertainment', description: 'Cinema, Tollywood, Bollywood, streaming, and culture', order: 9 },
    { name: 'Education', slug: 'education', description: 'Entrance examinations, career guidance, university policies, and admissions', order: 10 },
  ];

  const insertCategory = db.prepare(`
    INSERT INTO categories (name, slug, description, display_order)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name=excluded.name,
      description=excluded.description,
      display_order=excluded.display_order
  `);

  for (const cat of categories) {
    insertCategory.run(cat.name, cat.slug, cat.description, cat.order);
  }
  console.log(`✓ Seeded ${categories.length} categories.`);

  // 2. Seed Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nrknews24.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@NRK2026!';
  const adminName = process.env.ADMIN_NAME || 'NRK Editor';

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const existingAdmin = db.prepare('SELECT id FROM admins WHERE email = ?').get(adminEmail);

  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO admins (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, 'admin')
    `).run(uuidv4(), adminName, adminEmail, passwordHash);
    console.log(`✓ Created primary administrator: ${adminEmail}`);
  } else {
    db.prepare(`
      UPDATE admins SET password_hash = ?, name = ? WHERE email = ?
    `).run(passwordHash, adminName, adminEmail);
    console.log(`✓ Updated administrator credentials for: ${adminEmail}`);
  }

  // 3. Seed Approved News Sources (RSS feeds)
  const defaultSources = [
    {
      name: 'Google News - National Headlines',
      feed_url: 'https://news.google.com/rss/headlines/section/topic/NATION.en_in?ceid=IN:en&oc=3',
      category_slug: 'india',
      source_type: 'rss'
    },
    {
      name: 'Google News - Andhra Pradesh',
      feed_url: 'https://news.google.com/rss/search?q=Andhra+Pradesh&hl=en-IN&gl=IN&ceid=IN%3Aen',
      category_slug: 'andhra-pradesh',
      source_type: 'rss'
    },
    {
      name: 'Google News - Telangana',
      feed_url: 'https://news.google.com/rss/search?q=Telangana+Hyderabad&hl=en-IN&gl=IN&ceid=IN%3Aen',
      category_slug: 'telangana',
      source_type: 'rss'
    },
    {
      name: 'The Hindu - Technology',
      feed_url: 'https://www.thehindu.com/sci-tech/technology/feeder/default.rss',
      category_slug: 'technology',
      source_type: 'rss'
    },
    {
      name: 'The Hindu - Business & Markets',
      feed_url: 'https://www.thehindu.com/business/feeder/default.rss',
      category_slug: 'business',
      source_type: 'rss'
    },
    {
      name: 'The Hindu - Sports Desk',
      feed_url: 'https://www.thehindu.com/sport/feeder/default.rss',
      category_slug: 'sports',
      source_type: 'rss'
    }
  ];

  for (const src of defaultSources) {
    const cat = db.prepare('SELECT id FROM categories WHERE slug = ?').get(src.category_slug);
    const existing = db.prepare('SELECT id FROM news_sources WHERE feed_url = ?').get(src.feed_url);
    if (!existing) {
      db.prepare(`
        INSERT INTO news_sources (name, feed_url, source_type, category_id, is_enabled)
        VALUES (?, ?, ?, ?, 1)
      `).run(src.name, src.feed_url, src.source_type, cat ? cat.id : 1);
    }
  }
  console.log(`✓ Verified approved news sources.`);

  // 4. Seed Representative Sample Articles (clearly labeled demo/editorial content)
  const sampleArticles = [
    {
      title: 'Amaravati High-Speed Rail & Port Expressway Corridor Approved by Center',
      slug: 'amaravati-high-speed-rail-and-port-expressway-corridor-approved',
      category_slug: 'andhra-pradesh',
      summary: 'The Union Ministry has given fast-track environmental clearance for the Amaravati multimodal transit corridor connecting the state capital to Machilipatnam and Visakhapatnam ports.',
      content: `<p><strong>AMARAVATI</strong> — In a significant infrastructure milestone for Andhra Pradesh, the Central Government has accorded statutory clearance for the multi-billion rupee Amaravati Port Connectivity and High-Speed Rail Corridor.</p>
<h2>Key Project Highlights</h2>
<p>The 160-kilometer multi-lane economic corridor is slated to link the administrative core of Amaravati directly with deep-water port facilities at Machilipatnam, cutting freight movement times by more than 60 percent. State urban planning authorities emphasized that the project will feature dedicated freight tracks alongside passenger transit links.</p>
<blockquote>"This corridor lays the industrial backbone for Andhra Pradesh's coastal manufacturing renaissance," stated senior officials during the inter-ministerial briefing.</blockquote>
<h2>Timeline and Financing</h2>
<p>Funding will be facilitated through a hybrid annuity model supported by international infrastructure development consortiums and state budgetary allocations. Phase-1 civil tenders are scheduled for publication by the end of the current fiscal quarter.</p>
<p>Regional business chambers have welcomed the announcement, noting that direct expressway connectivity will catalyze logistics parks and export-oriented processing clusters across the Krishna and Guntur belts.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
      is_featured: 1,
      is_breaking: 1,
      views: 3420,
      shares: 412,
      tags: ['Andhra Pradesh', 'Amaravati', 'Infrastructure', 'Railways', 'Economy'],
      author: 'K. S. Narayana / NRK Bureau',
      source_name: 'NRK Special Correspondent, Amaravati',
      source_url: 'https://nrknews24.com',
      status: 'published',
    },
    {
      title: 'Hyderabad IT Hub Crosses New Export Benchmark with AI Innovation Zones',
      slug: 'hyderabad-it-hub-crosses-new-export-benchmark-ai-innovation-zones',
      category_slug: 'telangana',
      summary: 'Telangana records unprecedented software and electronics exports driven by rapid expansion in semiconductor design, cloud services, and specialized AI research labs across HITEC City.',
      content: `<p><strong>HYDERABAD</strong> — Telangana's technology ecosystem has achieved a historic milestone, with annual information technology and enabled services exports setting a new all-time record, propelled by substantial foreign direct investments in high-compute artificial intelligence clusters.</p>
<h2>Exponential Growth in Emerging Tech</h2>
<p>State industrial reports indicate a 24 percent year-on-year surge in semiconductor design licenses and specialized AI research labs establishing headquarters across Hyderabad's HITEC City and Financial District corridors.</p>
<p>Global technology leaders have expanded their engineering presence, citing favorable power tariffs, rapid infrastructure provisioning, and access to top-tier engineering talent from premier technical institutes in the state.</p>
<h2>Skilling Initiatives for Youth</h2>
<p>The state government has announced plans to expand its specialized digital skilling academy, targeting over 50,000 engineering graduates annually in machine learning pipelines, embedded chip design, and cloud security architectures.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
      is_featured: 1,
      is_breaking: 0,
      views: 2890,
      shares: 310,
      tags: ['Telangana', 'Hyderabad', 'IT Exports', 'Artificial Intelligence', 'Economy'],
      author: 'P. Ravinder Reddy / Tech Desk',
      source_name: 'NRK Hyderabad Bureau',
      source_url: 'https://nrknews24.com',
      status: 'published',
    },
    {
      title: 'ISRO Gears Up for Next-Gen Space Station Module Testing at Sriharikota',
      slug: 'isro-next-gen-space-station-module-testing-sriharikota',
      category_slug: 'technology',
      summary: 'Indian Space Research Organisation prepares for critical atmospheric re-entry and habitat endurance tests ahead of the anticipated Bharatiya Antariksh Station launch schedule.',
      content: `<p><strong>SRIHARIKOTA</strong> — India's premier space agency ISRO has commenced final telemetry and habitat simulation trials at the Satish Dhawan Space Centre in Sriharikota for its indigenous space station modules.</p>
<h2>Mission Architecture and Objectives</h2>
<p>The preparatory series focuses on high-altitude escape mechanisms, environmental life-support systems (ECLSS), and automated rendezvous and docking simulators designed specifically for long-duration low Earth orbit missions.</p>
<p>Senior scientists confirmed that indigenous composite materials and thermal protection tiles underwent rigorous thermal shock testing, yielding performance benchmarks exceeding operational criteria.</p>
<h2>International Collaborations</h2>
<p>While the orbital habitat remains an indigenous flagship enterprise, payload telemetry standards adhere to global safety conventions, opening avenues for scientific experiment partnerships with space agencies worldwide.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      is_featured: 1,
      is_breaking: 0,
      views: 4120,
      shares: 580,
      tags: ['ISRO', 'Space', 'Sriharikota', 'Technology', 'Science'],
      author: 'NRK Science & Tech Bureau',
      source_name: 'Press Information Bureau / ISRO Updates',
      source_url: 'https://isro.gov.in',
      status: 'published',
    },
    {
      title: 'Parliament Winter Session: Crucial Digital Data & Broadcasting Bills Introduced',
      slug: 'parliament-winter-session-crucial-digital-data-broadcasting-bills',
      category_slug: 'politics',
      summary: 'Both houses of Parliament witness active deliberations as the government tables landmark legislative reforms focusing on digital compliance, cybersecurity, and media accountability.',
      content: `<p><strong>NEW DELHI</strong> — The Parliament convened for high-stakes legislative sessions today, with treasury and opposition benches engaging in spirited debates following the introduction of major regulatory updates for digital communications and broadcasting ethics.</p>
<h2>Key Debates on the Floor</h2>
<p>Lawmakers scrutinized clauses regarding user consent frameworks, data localization guidelines for sensitive personal information, and grievance redressal timelines for digital platforms operating in India.</p>
<p>The Union Minister for Communications stated that the revised framework ensures consumer safety while preserving innovation and cross-border commercial viability.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
      is_featured: 0,
      is_breaking: 0,
      views: 1950,
      shares: 145,
      tags: ['Parliament', 'Politics', 'Law', 'New Delhi', 'India'],
      author: 'NRK National Political Desk',
      source_name: 'Parliamentary Records / PTI',
      source_url: 'https://sansad.in',
      status: 'published',
    },
    {
      title: 'Reserve Bank of India Holds Repo Rate Steady at 6.5%, Upgrades GDP Growth Outlook',
      slug: 'rbi-holds-repo-rate-steady-upgrades-gdp-growth-outlook',
      category_slug: 'business',
      summary: 'The Monetary Policy Committee votes unanimously to maintain benchmark lending rates while expressing confidence in resilient domestic consumption and robust capital expenditure.',
      content: `<p><strong>MUMBAI</strong> — The Reserve Bank of India (RBI) Monetary Policy Committee (MPC) has kept the benchmark repo rate unchanged at 6.5 percent, emphasizing a vigilant policy stance aimed at anchoring core inflation while supporting robust economic momentum.</p>
<h2>Economic Projections</h2>
<p>In his policy statement, the RBI Governor revised the projected gross domestic product growth estimate upward, citing resilience in rural consumption, strong agricultural output, and uninterrupted credit flows into manufacturing.</p>
<p>Financial markets responded positively, with the BSE Sensex and NSE Nifty recording modest gains led by banking and capital goods equities.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
      is_featured: 0,
      is_breaking: 0,
      views: 2430,
      shares: 198,
      tags: ['RBI', 'Economy', 'Sensex', 'Finance', 'Markets'],
      author: 'Financial Markets Desk / NRK',
      source_name: 'Reserve Bank of India Press Release',
      source_url: 'https://rbi.org.in',
      status: 'published',
    },
    {
      title: 'India Seals Spectacular Series Triumph with Dominant Performance in Final Test',
      slug: 'india-seals-spectacular-series-triumph-final-test',
      category_slug: 'sports',
      summary: 'A disciplined bowling display followed by an unbeaten fourth-innings partnership powers the Indian cricket team to an emphatic 7-wicket victory on Day 4.',
      content: `<p><strong>CHENNAI</strong> — In a clinical demonstration of Test match discipline, India wrapped up the international cricket series with an emphatic seven-wicket victory on the fourth afternoon at the MA Chidambaram Stadium.</p>
<h2>Turning Points of the Match</h2>
<p>The pace attack dismantled the opposition middle order in the morning session, extracting sharp movement off the deteriorating surface. The top order then chased down the fourth-innings target with calm authority.</p>
<p>The team management praised the bench strength and youthful composure displayed under pressure, noting this victory cements India's position atop the World Test Championship standings.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
      is_featured: 0,
      is_breaking: 1,
      views: 5240,
      shares: 920,
      tags: ['Cricket', 'Team India', 'BCCI', 'Sports', 'Test Match'],
      author: 'NRK Sports Bureau',
      source_name: 'BCCI Official / Sports Desk',
      source_url: 'https://bcci.tv',
      status: 'published',
    },
    {
      title: 'Global Climate Summit Adopts Accelerated Clean Energy Transition Pact in Geneva',
      slug: 'global-climate-summit-clean-energy-transition-pact-geneva',
      category_slug: 'world',
      summary: 'Over 140 nations sign multilateral commitment to triple renewable power generation capacity and unlock green climate adaptation funding for developing economies.',
      content: `<p><strong>GENEVA</strong> — Delegates from over 140 countries concluded intensive diplomatic negotiations today by unanimously endorsing the Geneva Clean Transition Accord.</p>
<h2>Core Commitments</h2>
<p>The framework establishes binding international targets to triple solar and wind energy capacity before 2035, while establishing a dedicated multi-billion dollar green finance facility to assist developing nations in modernizing grid infrastructure.</p>
<p>United Nations environmental officials described the consensus as a pragmatic roadmap balancing industrial development with emissions mitigation targets.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
      is_featured: 0,
      is_breaking: 0,
      views: 1670,
      shares: 130,
      tags: ['World', 'Climate', 'United Nations', 'Renewable Energy'],
      author: 'NRK World Affairs Desk',
      source_name: 'United Nations Information Service',
      source_url: 'https://un.org',
      status: 'published',
    },
    {
      title: 'Tollywood Big-Budget Spectacle Creates Global Pre-Release Record with Worldwide Screenings',
      slug: 'tollywood-big-budget-spectacle-creates-global-record',
      category_slug: 'entertainment',
      summary: 'The upcoming pan-India visual extravaganza directed by visionary Telugu filmmakers locks monumental overseas distribution across North America, UK, and Japan.',
      content: `<p><strong>HYDERABAD</strong> — The Telugu film industry continues its commanding global footprint as the eagerly awaited historical fantasy epic locked historic distribution pacts across premier international circuits.</p>
<h2>Unmatched Scale and Global Demand</h2>
<p>Trade analysts report the film will open across more than 8,500 screens worldwide, setting a milestone for South Indian cinema. Advance bookings in international multiplex chains reported unprecedented traffic within minutes of tickets going live.</p>
<p>The production house highlighted state-of-the-art VFX supervised by Oscar-winning digital studios, reinforcing Hyderabad's stature as a premier cinematic production powerhouse.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      is_featured: 0,
      is_breaking: 0,
      views: 4800,
      shares: 740,
      tags: ['Tollywood', 'Telugu Cinema', 'Entertainment', 'Box Office', 'Movies'],
      author: 'Film Bureau / NRK News24',
      source_name: 'NRK Entertainment Correspondent',
      source_url: 'https://nrknews24.com',
      status: 'published',
    },
    {
      title: 'National Testing Agency Unveils Modernized Exam Pattern and Digital Centers for 2026',
      slug: 'nta-unveils-modernized-exam-pattern-and-digital-centers',
      category_slug: 'education',
      summary: 'Reforms aim to bolster cybersecurity, eliminate paper leak risks, and provide biometric AI verification at all national entrance testing hubs.',
      content: `<p><strong>NEW DELHI</strong> — The National Testing Agency (NTA) has released comprehensive guidelines introducing multi-layered biometric authentication, dynamic question shuffling, and centralized digital proctoring for key competitive examinations.</p>
<h2>Student-Friendly Enhancements</h2>
<p>The revised schedule introduces localized test centers within 30 kilometers of all registered candidate districts, along with adaptive digital practice mock tests accessible freely on mobile devices.</p>
<p>Academic counselors have welcomed the transparency measures, affirming that rigorous cybersecurity protocols will restore complete student confidence in merit-based entrance procedures.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
      is_featured: 0,
      is_breaking: 0,
      views: 3100,
      shares: 260,
      tags: ['Education', 'NTA', 'Exams', 'Students', 'India'],
      author: 'NRK Education Desk',
      source_name: 'Ministry of Education Bulletin',
      source_url: 'https://nta.ac.in',
      status: 'published',
    },
    // AI Pending Review items to test AI Review Workflow
    {
      title: 'Visakhapatnam Green Hydrogen Valley Secures Major Industrial Investment',
      slug: 'visakhapatnam-green-hydrogen-valley-secures-investment-draft',
      category_slug: 'andhra-pradesh',
      summary: 'AI INGESTION DRAFT: Major renewable energy consortia pledge green ammonia and hydrogen manufacturing units in the coastal industrial corridor.',
      content: `<p><strong>VISAKHAPATNAM</strong> — [AI Draft for Editorial Approval] A major international energy consortium has announced plans to establish a green hydrogen and derivative export terminal in the Visakhapatnam industrial cluster.</p>
<h2>Project Details</h2>
<p>The planned facility will leverage offshore wind and solar power generation, positioning the port city as a prime bunkering hub along Bay of Bengal maritime lanes.</p>
<p><em>Note for Editor: Please review the investment figures and environmental assessment citations before publishing.</em></p>`,
      featured_image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
      is_featured: 0,
      is_breaking: 0,
      views: 0,
      shares: 0,
      tags: ['Andhra Pradesh', 'Visakhapatnam', 'Green Energy', 'Hydrogen'],
      author: 'NRK AI News Desk',
      source_name: 'PTI Wire via RSS',
      source_url: 'https://ptinews.com/sample-hydrogen-story',
      status: 'pending_review',
    },
    {
      title: 'Hyderabad Metro Phase-2 Airport Corridor Route Alignment Finalized',
      slug: 'hyderabad-metro-phase-2-airport-corridor-route-alignment-draft',
      category_slug: 'telangana',
      summary: 'AI INGESTION DRAFT: Detailed Project Report confirms elevated and underground stretches connecting central transit hubs directly to Rajiv Gandhi International Airport.',
      content: `<p><strong>HYDERABAD</strong> — [AI Draft for Editorial Approval] Urban transit authorities have finalized the updated alignment for Hyderabad Metro Phase-2 connecting the international airport to high-density economic corridors.</p>
<h2>Station Locations and Interchanges</h2>
<p>The route features strategic interchange hubs at Gachibowli, Raidurg, and Shamshabad, providing seamless transfers to regional railway and bus networks.</p>
<p><em>Note for Editor: Verify the timeline for land acquisition notifications before clearing for publication.</em></p>`,
      featured_image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80',
      is_featured: 0,
      is_breaking: 0,
      views: 0,
      shares: 0,
      tags: ['Telangana', 'Hyderabad', 'Metro', 'Urban Transit'],
      author: 'NRK AI News Desk',
      source_name: 'Telangana Today via RSS',
      source_url: 'https://telanganatoday.com/sample-metro-story',
      status: 'pending_review',
    },
    // Draft article to test Draft System
    {
      title: 'Investigation: Modernization of Public Healthcare Primary Centers Across Rural AP',
      slug: 'investigation-modernization-of-public-healthcare-ap-draft',
      category_slug: 'andhra-pradesh',
      summary: 'Draft investigative report assessing doctor staffing levels, diagnostic equipment availability, and telemedicine penetration in tribal agency areas.',
      content: `<p>[DRAFT - UNDER EDITORIAL REVIEW] Field reporting from East Godavari agency tracts on healthcare infrastructure.</p>`,
      featured_image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
      is_featured: 0,
      is_breaking: 0,
      views: 0,
      shares: 0,
      tags: ['Healthcare', 'Investigation', 'Andhra Pradesh'],
      author: 'NRK Investigative Bureau',
      source_name: 'NRK News24 Investigation',
      source_url: 'https://nrknews24.com',
      status: 'draft',
    }
  ];

  for (const art of sampleArticles) {
    const cat = db.prepare('SELECT id FROM categories WHERE slug = ?').get(art.category_slug);
    const existing = db.prepare('SELECT id FROM articles WHERE slug = ?').get(art.slug);

    if (!existing) {
      db.prepare(`
        INSERT INTO articles (
          id, title, slug, summary, content, featured_image,
          category_id, tags, author, source_name, source_url,
          status, is_featured, is_breaking, published_at,
          created_at, updated_at, views, shares
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, datetime('now', '-${Math.floor(Math.random() * 24)} hours'),
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?
        )
      `).run(
        uuidv4(),
        art.title,
        art.slug,
        art.summary,
        art.content,
        art.featured_image,
        cat ? cat.id : 1,
        JSON.stringify(art.tags),
        art.author,
        art.source_name,
        art.source_url,
        art.status,
        art.is_featured,
        art.is_breaking,
        art.views,
        art.shares
      );
    }
  }

  console.log(`✓ Seeded ${sampleArticles.length} representative articles.`);
  console.log('--- Database seeding completed successfully! ---');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
