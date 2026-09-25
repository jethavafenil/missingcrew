#!/usr/bin/env node
/**
 * Import Indian crew profiles directly via Supabase (no HTTP).
 *
 * Usage examples:
 *   node scripts/import_indian_crew.js --count=20
 *   node scripts/import_indian_crew.js --seed=42 --count=50
 *   node scripts/import_indian_crew.js --from-file=crew_profiles.json
 *     - crew_profiles.json may be either:
 *         [ { ...crewProfile }, ... ]
 *       or  { crewProfiles: [...], employerProfiles: [], projects: [] }
 *
 * Notes:
 * - Loads SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from .env via dotenv.
 * - Creates users with role CREW and password 'password123' (bcryptjs hashed).
 * - Skips emails that already exist.
 */

const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') })

const bcrypt = require('bcryptjs')
const { getSupabaseServiceClient, unwrap, iso } = require('./lib/supabase')

const supabase = getSupabaseServiceClient()

// --- Data helpers (kept small and realistic) ---
const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Chandigarh', 'Lucknow', 'Kochi',
  'Indore', 'Bhopal', 'Guwahati', 'Thiruvananthapuram', 'Noida', 'Gurugram'
]

const INDIAN_LANGUAGES = [
  'Hindi', 'English', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Kannada',
  'Malayalam', 'Gujarati', 'Punjabi', 'Odia'
]

const PROJECT_TYPES = [
  'Feature Film', 'Short Film', 'Web Series', 'TV Series', 'Ad Film',
  'Documentary', 'Music Video', 'Corporate Video'
]

const PLATFORMS = ['Instagram', 'YouTube', 'Vimeo', 'Behance', 'Website', 'IMDb']

const ROLES = [
  'Director', 'Associate Director', 'Assistant Director (AD)',
  'Director of Photography (DOP / Cinematographer)', 'Camera Operator',
  '1st Assistant Camera (Focus Puller)', 'Gaffer (Chief Lighting Technician)',
  'Key Grip', 'Production Designer', 'Art Director', 'Set Designer',
  'Props Master', 'Costume Designer', 'Stylist', 'Makeup Artist',
  'Hair Stylist', 'Casting Director', 'Casting Associate',
  'Production Sound Mixer / Sound Recordist', 'Boom Operator',
  'Line Producer', 'Executive Producer', 'Production Manager',
  'Location Manager', 'Still Photographer', 'BTS Videographer',
  'Video Editor', 'Assistant Editor', 'Colorist', 'Sound Designer',
  'VFX Artist', 'Music Director', 'Stunt Coordinator'
]

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Reyansh', 'Sai', 'Krishna', 'Ishaan',
  'Rohan', 'Kabir', 'Ayaan', 'Ananya', 'Diya', 'Isha', 'Aisha', 'Kiara',
  'Myra', 'Sara', 'Riya', 'Anika', 'Priya', 'Aarohi'
]

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Iyer', 'Reddy', 'Nair', 'Patel', 'Singh',
  'Khan', 'Kapoor', 'Mehta', 'Das', 'Ghosh', 'Bose', 'Chatterjee',
  'Kulkarni', 'Bhat', 'Menon', 'Rao', 'Roy'
]

const EMAIL_DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com']

const DESC_SNIPPETS = [
  'Worked with leading production houses across India.',
  'Known for efficient on-set coordination and problem solving.',
  'Experienced in both studio and outdoor shoots.',
  'Expert in tight schedules and high-pressure environments.',
  'Strong collaborative skills with cross-functional teams.'
]

function makeRng(seed) {
  // deterministic rng based on seed
  let s = seed != null ? (seed >>> 0) : Math.floor(Math.random() * 0xffffffff)
  return {
    random() {
      // xorshift32
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5
      return ((s >>> 0) / 0xffffffff)
    },
    randint(min, max) { // inclusive
      const r = this.random()
      return Math.floor(r * (max - min + 1)) + min
    },
    choice(arr) { return arr[this.randint(0, arr.length - 1)] },
    sample(arr, k) {
      const copy = arr.slice()
      const out = []
      for (let i = 0; i < k && copy.length; i++) {
        const idx = this.randint(0, copy.length - 1)
        out.push(copy.splice(idx, 1)[0])
      }
      return out
    }
  }
}

function randName(rng) { return `${rng.choice(FIRST_NAMES)} ${rng.choice(LAST_NAMES)}` }
function randEmail(name, idx, rng) { return `${name.toLowerCase().replace(/\s+/g, '.')}.${idx+1}@${rng.choice(EMAIL_DOMAINS)}` }
function randPhone(rng) { return `+91${rng.choice([9,8,7,6])}${Array.from({length:9}, ()=>rng.randint(0,9)).join('')}` }
function randRoles(rng) { return rng.sample(ROLES, rng.randint(1,2)) }
function randLanguages(rng) {
  const count = rng.randint(2,4)
  const langs = rng.sample(INDIAN_LANGUAGES, count)
  if (!langs.includes('English')) langs[0] = 'English'
  return langs
}
function randProjectTypes(rng) { return rng.sample(PROJECT_TYPES, rng.randint(2,4)) }
function randBudget(rng) {
  const dailyMin = [1500,2000,2500,3000,4000,5000,8000][rng.randint(0,6)]
  const dailyMax = dailyMin + [1000,2000,3000,5000,7000,10000][rng.randint(0,5)]
  const projMin = dailyMin * rng.randint(5,10)
  const projMax = projMin + dailyMax * rng.randint(5,15)
  return { dailyMin, dailyMax, projMin, projMax }
}
function randYearsExp(rng){ return ['0-1 years','1-3 years','3-5 years','5-8 years','8+ years'][rng.randint(0,4)] }
function randPortfolioLinks(name, rng) {
  const slug = name.toLowerCase().replace(/\s+/g,'')
  const platforms = rng.sample(PLATFORMS, rng.randint(1,3))
  return platforms.map(p => {
    let url
    switch(p){
      case 'Instagram': url = `https://instagram.com/${slug}${rng.randint(1,9999)}`; break
      case 'YouTube': url = `https://youtube.com/@${slug}${rng.randint(1,9999)}`; break
      case 'Vimeo': url = `https://vimeo.com/${rng.randint(1000000,9999999)}`; break
      case 'Behance': url = `https://www.behance.net/${slug}${rng.randint(1,9999)}`; break
      case 'Website': url = `https://${slug}.portfolio.site`; break
      case 'IMDb': url = `https://www.imdb.com/name/nm${rng.randint(1000000,9999999)}`; break
      default: url = `https://example.com/${slug}`
    }
    return { platform: p, url }
  })
}
function randPastProjects(primaryRoles, rng){
  const titles = ['Silent Streets','Rising Shadows','Monsoon Dreams','Neon Nights','Echoes of Dawn','Red City','Parallel Lines','Beyond Frames']
  const n = rng.randint(1,3)
  const items = []
  for(let i=0;i<n;i++){
    items.push({
      title: `${rng.choice(titles)} ${rng.randint(1,99)}`,
      role: rng.choice(primaryRoles),
      year: String(rng.randint(2016, new Date().getFullYear())),
      description: rng.choice(DESC_SNIPPETS),
      type: rng.choice(PROJECT_TYPES)
    })
  }
  return items
}

function genProfile(idx, rng){
  const name = randName(rng)
  const email = randEmail(name, idx, rng)
  const phone = randPhone(rng)
  const city = rng.choice(INDIAN_CITIES)
  const location = `${city}, India`
  const primaryRoles = randRoles(rng)
  const { dailyMin, dailyMax, projMin, projMax } = randBudget(rng)

  const today = new Date()
  const availability = rng.random() < 0.75
  let availabilityStart = null
  let availabilityEnd = null
  if (rng.random() < 0.7){
    const start = new Date(today.getTime() + rng.randint(0,60) * 86400000)
    const end = new Date(start.getTime() + rng.randint(10,60) * 86400000)
    availabilityStart = start
    availabilityEnd = end
  }

  const imdbLink = rng.random() < 0.25 ? `https://www.imdb.com/name/nm${rng.randint(1000000, 9999999)}` : null

  return {
    name,
    email,
    phone,
    phoneVerified: rng.random() < 0.6,
    city,
    budgetRangeMin: projMin,
    budgetRangeMax: projMax,
    budgetFlexible: rng.random() < 0.5,
    primaryRoles,
    yearsExperience: randYearsExp(rng),
    location,
    availableToTravel: rng.random() < 0.7,
    availability,
    availabilityStart,
    availabilityEnd,
    projectTypes: randProjectTypes(rng),
    dailyBudgetMin: dailyMin,
    dailyBudgetMax: dailyMax,
    languages: randLanguages(rng),
    imdbLink,
    portfolioLinks: randPortfolioLinks(name, rng),
    pastProjects: randPastProjects(primaryRoles, rng),
    referredBy: [null, 'Industry Colleague', 'Film School', 'Production House', 'Event Meetup'][Math.floor(rng.random()*5)],
    contactWhatsApp: phone,
    subscriptionTier: ['FREE_TRIAL','BASIC','PRO'][Math.floor(rng.random()*3)],
    trialEnds: new Date(Date.now() + 30*86400000),
    completed: true,
  }
}

function parseArgs(){
  const args = process.argv.slice(2)
  const opts = { count: 20, seed: undefined, fromFile: undefined }
  for (const a of args){
    if (a.startsWith('--count=')) opts.count = parseInt(a.split('=')[1],10)
    else if (a.startsWith('--seed=')) opts.seed = parseInt(a.split('=')[1],10)
    else if (a.startsWith('--from-file=')) opts.fromFile = a.split('=')[1]
    else if (a === '-h' || a === '--help') {
      console.log('Usage: node scripts/import_indian_crew.js [--count=N] [--seed=S] [--from-file=path]')
      process.exit(0)
    }
  }
  return opts
}

async function ensureUserAndCrew(profile){
  // skip if user exists
  const existing = unwrap('user.findUnique',
    await supabase.from('users').select('id').eq('email', profile.email).maybeSingle())
  if (existing) return { skipped: true, reason: 'exists', email: profile.email }

  const now = new Date().toISOString()
  const hashed = await bcrypt.hash('password123', 10)
  const user = unwrap('user.create',
    await supabase
      .from('users')
      .insert({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        phoneVerified: !!profile.phoneVerified,
        role: 'CREW',
        password: hashed,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single())

  unwrap('crewProfile.create',
    await supabase.from('crew_profiles').insert({
      userId: user.id,
      city: profile.city,
      budget_range_min: profile.budgetRangeMin,
      budget_range_max: profile.budgetRangeMax,
      budgetFlexible: !!profile.budgetFlexible,
      primary_roles: profile.primaryRoles,
      years_experience: profile.yearsExperience,
      location: profile.location,
      available_to_travel: !!profile.availableToTravel,
      availability: !!profile.availability,
      availability_start: iso(profile.availabilityStart),
      availability_end: iso(profile.availabilityEnd),
      project_types: profile.projectTypes,
      daily_budget_min: profile.dailyBudgetMin,
      daily_budget_max: profile.dailyBudgetMax,
      languages: profile.languages,
      imdb_link: profile.imdbLink || null,
      portfolio_links: profile.portfolioLinks,
      past_projects: profile.pastProjects,
      referred_by: profile.referredBy || null,
      contact_whatsapp: profile.contactWhatsApp,
      subscription_tier: profile.subscriptionTier || 'FREE_TRIAL',
      trial_ends: profile.trialEnds ? iso(profile.trialEnds) : iso(new Date(Date.now() + 30*86400000)),
      completed: profile.completed != null ? profile.completed : true,
      created_at: now,
      updated_at: now,
    }))

  return { created: true, email: profile.email, userId: user.id }
}

async function main(){
  const { count, seed, fromFile } = parseArgs()
  const rng = makeRng(seed)

  let crewProfiles
  if (fromFile){
    const raw = fs.readFileSync(path.resolve(fromFile), 'utf-8')
    const data = JSON.parse(raw)
    if (Array.isArray(data)) crewProfiles = data
    else if (data && Array.isArray(data.crewProfiles)) crewProfiles = data.crewProfiles
    else throw new Error('Unsupported input file format')
  } else {
    crewProfiles = Array.from({ length: count }, (_, i) => genProfile(i, rng))
  }

  const results = { usersCreated: 0, crewProfilesCreated: 0, skipped: 0, errors: [] }

  for (const p of crewProfiles){
    try {
      const r = await ensureUserAndCrew(p)
      if (r.skipped){ results.skipped++ } else { results.usersCreated++; results.crewProfilesCreated++ }
    } catch (e) {
      results.errors.push(`${p.email}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  console.log('Import complete:', JSON.stringify(results, null, 2))
}

main()
  .catch((e) => { console.error('Fatal error:', e); process.exit(1) })
