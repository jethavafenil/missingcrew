const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = 'postgresql://postgres:t4wgwfedE232@db.yrnccxmxpquetyvxnnwq.supabase.co:5432/postgres';

async function seed() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to Supabase...');

  const passwordHash = await bcrypt.hash('password123', 10);
  const now = new Date();

  // 1. Create Sample Employers
  const employers = [
    { name: 'Karan Johar', email: 'producer@dharma-productions.com', company: 'Dharma Productions' },
    { name: 'Farhan Akhtar', email: 'contact@excelmovies.com', company: 'Excel Entertainment' },
    { name: 'Gauri Khan', email: 'team@redchillies.com', company: 'Red Chillies VFX' },
    { name: 'Anurag Kashyap', email: 'anurag@goodbadfilms.com', company: 'Good Bad Films' },
  ];

  const createdEmployerIds = [];

  for (const emp of employers) {
    const userRes = await client.query(
      `INSERT INTO users (name, email, role, password, "phoneVerified", created_at, updated_at)
       VALUES ($1, $2, 'EMPLOYER', $3, true, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [emp.name, emp.email, passwordHash]
    );
    const userId = userRes.rows[0].id;
    const profRes = await client.query(
      `INSERT INTO employer_profiles ("userId", company_name, completed, created_at, updated_at)
       VALUES ($1, $2, true, NOW(), NOW())
       ON CONFLICT ("userId") DO UPDATE SET company_name = EXCLUDED.company_name
       RETURNING id`,
      [userId, emp.company]
    );
    createdEmployerIds.push(profRes.rows[0].id);
  }

  console.log(`Created ${employers.length} employers.`);

  // 2. Create Sample Projects
  const projects = [
    {
      name: 'Shadows of Mumbai',
      type: 'Feature Film',
      roles: ['Director of Photography (DOP / Cinematographer)', 'Gaffer (Chief Lighting Technician)', 'Production Sound Mixer / Sound Recordist'],
      location: 'Mumbai, Maharashtra',
      desc: 'An intense neo-noir psychological thriller set in old south Mumbai. Seeking experienced DOP with low-light camera mastery.',
    },
    {
      name: 'Himalayan Echoes',
      type: 'Documentary',
      roles: ['Director of Photography (DOP / Cinematographer)', 'Drone Operator', 'Sound Recordist'],
      location: 'Manali & Spiti Valley',
      desc: 'Feature-length environmental documentary focusing on high-altitude local communities. High altitude shoot experience required.',
    },
    {
      name: 'Neon Nights Music Video',
      type: 'Music Video',
      roles: ['Art Director', 'Costume Designer', 'Gaffer (Chief Lighting Technician)'],
      location: 'Bengaluru, Karnataka',
      desc: 'Fast-paced cyberpunk-themed music video for a top electronic music duo. Requires stylized neon lighting setups.',
    },
    {
      name: 'Urban Chronicles Season 2',
      type: 'Web Series',
      roles: ['1st Assistant Camera (Focus Puller)', 'Key Grip', 'Production Designer'],
      location: 'Delhi NCR',
      desc: 'Second season of a hit crime drama series for a major streaming platform. 45-day shooting schedule.',
    },
    {
      name: 'Heritage Silk Commercial',
      type: 'Ad Film',
      roles: ['Colorist', 'Hair & Makeup Stylist', 'Director of Photography (DOP / Cinematographer)'],
      location: 'Varanasi, Uttar Pradesh',
      desc: 'High-end TV commercial showcasing traditional handloom weavers. Vibrant colors and rich textile aesthetics.',
    }
  ];

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const employerId = createdEmployerIds[i % createdEmployerIds.length];
    const startDate = new Date(now.getTime() + (i + 5) * 86400000);
    const endDate = new Date(startDate.getTime() + 15 * 86400000);

    await client.query(
      `INSERT INTO projects (
        employer_id, project_name, project_type, roles_needed,
        shoot_start_date, shoot_end_date, location, description,
        questions, contact_preference, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4::jsonb, $5, $6, $7, $8,
        $9::jsonb, $10::jsonb, 'OPEN', NOW(), NOW()
      )`,
      [
        employerId,
        p.name,
        p.type,
        JSON.stringify(p.roles),
        startDate,
        endDate,
        p.location,
        p.desc,
        JSON.stringify(['What camera package do you own or prefer?', 'Share your latest showreel link.']),
        JSON.stringify(['email', 'phone'])
      ]
    );
  }

  console.log(`Created ${projects.length} featured projects.`);

  // 3. Create Sample Crew Members
  const crewList = [
    { name: 'Arjun Verma', city: 'Mumbai', roles: ['Director of Photography (DOP / Cinematographer)'], exp: '8+ years', dailyMin: 35000, dailyMax: 60000 },
    { name: 'Priya Sharma', city: 'Delhi', roles: ['Production Designer', 'Art Director'], exp: '6 years', dailyMin: 25000, dailyMax: 45000 },
    { name: 'Vikram Joshi', city: 'Bengaluru', roles: ['Production Sound Mixer / Sound Recordist'], exp: '10+ years', dailyMin: 30000, dailyMax: 50000 },
    { name: 'Rohan Mehta', city: 'Mumbai', roles: ['Gaffer (Chief Lighting Technician)'], exp: '7 years', dailyMin: 20000, dailyMax: 35000 },
    { name: 'Ananya Roy', city: 'Kolkata', roles: ['Costume Designer', 'Stylist'], exp: '5 years', dailyMin: 22000, dailyMax: 40000 },
    { name: 'Siddharth Rao', city: 'Hyderabad', roles: ['Colorist', 'Video Editor'], exp: '9 years', dailyMin: 28000, dailyMax: 55000 },
    { name: 'Neha Kapoor', city: 'Mumbai', roles: ['Makeup Artist', 'Prosthetics Artist'], exp: '6 years', dailyMin: 25000, dailyMax: 45000 },
    { name: 'Aditya Nair', city: 'Kochi', roles: ['1st Assistant Camera (Focus Puller)'], exp: '4 years', dailyMin: 15000, dailyMax: 25000 },
  ];

  for (let i = 0; i < crewList.length; i++) {
    const c = crewList[i];
    const email = `crew.${c.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;

    const userRes = await client.query(
      `INSERT INTO users (name, email, role, password, phone, "phoneVerified", created_at, updated_at)
       VALUES ($1, $2, 'CREW', $3, $4, true, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [c.name, email, passwordHash, `+9198765${10000 + i}`]
    );
    const userId = userRes.rows[0].id;

    await client.query(
      `INSERT INTO crew_profiles (
        "userId", city, primary_roles, years_experience, location,
        available_to_travel, availability, project_types,
        daily_budget_min, daily_budget_max, languages, portfolio_links,
        terms_agreed, subscription_tier, completed, created_at, updated_at
      ) VALUES (
        $1, $2, $3::jsonb, $4, $5,
        true, true, $6::jsonb,
        $7, $8, $9::jsonb, $10::jsonb,
        true, 'PRO', true, NOW(), NOW()
      )
      ON CONFLICT ("userId") DO NOTHING`,
      [
        userId,
        c.city,
        JSON.stringify(c.roles),
        c.exp,
        `${c.city}, India`,
        JSON.stringify(['Feature Film', 'Web Series', 'Commercial']),
        c.dailyMin,
        c.dailyMax,
        JSON.stringify(['Hindi', 'English']),
        JSON.stringify(['https://vimeo.com/showcase/example', 'https://instagram.com/work']),
      ]
    );
  }

  console.log(`Created ${crewList.length} crew profiles.`);
  await client.end();
  console.log('\nSeed completed successfully!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
