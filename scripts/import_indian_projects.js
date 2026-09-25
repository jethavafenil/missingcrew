#!/usr/bin/env node
/**
 * Import Indian projects directly via Supabase (no HTTP).
 *
 * Usage examples:
 *   node scripts/import_indian_projects.js --count=20
 *   node scripts/import_indian_projects.js --seed=42 --count=30
 *   node scripts/import_indian_projects.js --from-file=projects.json
 *     - projects.json may be either:
 *         [ { ...project }, ... ]
 *       or  { projects: [...], employerProfiles: [...], crewProfiles: [...] }
 *
 * Notes:
 * - Loads SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from .env via dotenv.
 * - If no employers exist, the script will create a few sample employers to attach projects.
 */

const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') })

const bcrypt = require('bcryptjs')
const { getSupabaseServiceClient, unwrap, iso } = require('./lib/supabase')

const supabase = getSupabaseServiceClient()

// ---- Data helpers ----
const INDIAN_CITIES = [
  'Mumbai','Delhi','Bengaluru','Hyderabad','Chennai','Kolkata','Pune','Ahmedabad','Jaipur','Chandigarh','Lucknow','Kochi'
]
const PROJECT_TYPES = ['Feature Film','Short Film','Web Series','TV Series','Ad Film','Documentary','Music Video','Corporate Video']
const CONTACT_PREFS = ['email','phone','whatsapp']
const ROLES = [
  'Director','Associate Director','Assistant Director (AD)',
  'Director of Photography (DOP / Cinematographer)','Camera Operator',
  '1st Assistant Camera (Focus Puller)','Gaffer (Chief Lighting Technician)',
  'Key Grip','Production Designer','Art Director','Set Designer',
  'Props Master','Costume Designer','Stylist','Makeup Artist',
  'Hair Stylist','Casting Director','Casting Associate',
  'Production Sound Mixer / Sound Recordist','Boom Operator',
  'Line Producer','Executive Producer','Production Manager',
  'Location Manager','Still Photographer','BTS Videographer',
  'Video Editor','Assistant Editor','Colorist','Sound Designer',
  'VFX Artist','Music Director','Stunt Coordinator'
]

function makeRng(seed) {
  let s = seed != null ? (seed >>> 0) : Math.floor(Math.random() * 0xffffffff)
  return {
    random() { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 0xffffffff) },
    randint(min, max) { const r = this.random(); return Math.floor(r * (max - min + 1)) + min },
    choice(arr) { return arr[this.randint(0, arr.length - 1)] },
    sample(arr, k) { const copy = arr.slice(); const out = []; for (let i=0;i<k && copy.length;i++){ const idx = this.randint(0, copy.length-1); out.push(copy.splice(idx,1)[0]) } return out }
  }
}

function sentence(words){
  const s = words.join(' ')
  return s.charAt(0).toUpperCase()+s.slice(1)+'.'
}

function genDescription(rng){
  const phrases = [
    'A high-concept narrative set in urban India',
    'Story focuses on relationships and ambition',
    'Fast-paced schedule with multiple locations',
    'Looking for experienced and collaborative crew',
    'Includes night shoots and outdoor sequences',
    'Strong visual tone and realistic performances',
    'Tight budget but professional working environment'
  ]
  const n = rng.randint(2,4)
  return Array.from({length:n},()=>rng.choice(phrases)).join(' ')
}

function genQuestions(rng){
  const qs = [
    'Are you available for the entire schedule?',
    'Please share your portfolio links.',
    'Any recent relevant credits?',
    'Are you comfortable with night shoots?',
    'Preferred daily rate range?'
  ]
  const n = rng.randint(2,4)
  return rng.sample(qs, n).map(q => ({ question: q }))
}

function genRolesNeededAndBudgets(rng){
  const rolesCount = rng.randint(2, 6)
  const roles = rng.sample(ROLES, rolesCount)
  const rolesNeeded = roles.map(r => ({ role: r, count: rng.randint(1, 4) }))
  const budgetPerRole = {}
  for (const r of roles) {
    const min = [1500,2000,3000,4000,5000,8000][rng.randint(0,5)]
    const max = min + [1000,2000,3000,5000,7000,10000][rng.randint(0,5)]
    budgetPerRole[r] = { min, max }
  }
  return { rolesNeeded, budgetPerRole }
}

function genProject(i, rng){
  const city = rng.choice(INDIAN_CITIES)
  const projectType = rng.choice(PROJECT_TYPES)
  const nameParts = [
    'Silent','Rising','Monsoon','Neon','Echoes','Red','Parallel','Beyond','Golden','Last','Hidden','Broken','Sacred','Midnight','Desert','Mountain','River'
  ]
  const nameEnd = ['Streets','Shadows','Dreams','Nights','Dawn','City','Lines','Frames','Voices','Stories','Journey']
  const projectName = `${rng.choice(nameParts)} ${rng.choice(nameEnd)} ${rng.randint(1,99)}`

  const start = new Date(Date.now() + rng.randint(7, 60) * 86400000)
  const end = new Date(start.getTime() + rng.randint(10, 45) * 86400000)
  const { rolesNeeded, budgetPerRole } = genRolesNeededAndBudgets(rng)

  const description = genDescription(rng)
  const questions = genQuestions(rng)
  const contactPreference = rng.choice(CONTACT_PREFS)

  return {
    projectName,
    projectType,
    rolesNeeded,
    shootStartDate: start,
    shootEndDate: end,
    location: `${city}, India`,
    budgetPerRole,
    description,
    questions,
    contactPreference,
    status: 'OPEN'
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
      console.log('Usage: node scripts/import_indian_projects.js [--count=N] [--seed=S] [--from-file=path]')
      process.exit(0)
    }
  }
  return opts
}

async function ensureEmployers(minCount = 3){
  const { count, error } = await supabase
    .from('employer_profiles')
    .select('id', { count: 'exact', head: true })
  if (error) throw new Error(`employerProfile.count: ${error.message}`)
  if ((count ?? 0) >= minCount) return
  const seeds = [
    { name: 'Akash Films', email: 'contact@akashfilms.in', phone: '+911234567890', companyWebsite: 'https://akashfilms.in' },
    { name: 'Lotus Production', email: 'hello@lotusprod.in', phone: '+919812345678', companyWebsite: 'https://lotusprod.in' },
    { name: 'River Studios', email: 'info@riverstudios.in', phone: '+919900112233', companyWebsite: 'https://riverstudios.in' },
    { name: 'Parallel Pictures', email: 'team@parallelpictures.in', phone: '+919900223344', companyWebsite: 'https://parallelpictures.in' }
  ]
  const now = new Date().toISOString()
  for (const p of seeds){
    try {
      const exists = unwrap('user.findUnique',
        await supabase.from('users').select('id').eq('email', p.email).maybeSingle())
      if (exists) continue
      const hashed = await bcrypt.hash('password123', 10)
      const user = unwrap('user.create',
        await supabase
          .from('users')
          .insert({
            name: p.name,
            email: p.email,
            phone: p.phone,
            role: 'EMPLOYER',
            password: hashed,
            created_at: now,
            updated_at: now,
          })
          .select('id')
          .single())
      unwrap('employerProfile.create',
        await supabase.from('employer_profiles').insert({
          userId: user.id,
          company_name: p.name,
          company_website: p.companyWebsite,
          completed: true,
          created_at: now,
          updated_at: now,
        }))
    } catch (e) {
      // continue
    }
  }
}

async function createProject(project){
  // pick random employer
  const employers = unwrap('employerProfile.findMany',
    await supabase.from('employer_profiles').select('id'))
  if (employers.length === 0) throw new Error('No employers available to assign projects')
  const idx = Math.floor(Math.random() * employers.length)
  const employer = employers[idx]
  const now = new Date().toISOString()

  unwrap('project.create',
    await supabase.from('projects').insert({
      employer_id: employer.id,
      project_name: project.projectName,
      project_type: project.projectType,
      roles_needed: project.rolesNeeded,
      shoot_start_date: iso(project.shootStartDate),
      shoot_end_date: iso(project.shootEndDate),
      location: project.location,
      budget_per_role: project.budgetPerRole ?? null,
      description: project.description,
      questions: project.questions,
      contact_preference: project.contactPreference,
      status: project.status || 'OPEN',
      created_at: now,
      updated_at: now,
    }))
}

async function main(){
  const { count, seed, fromFile } = parseArgs()
  const rng = makeRng(seed)
  await ensureEmployers(3)

  let projects
  if (fromFile){
    const raw = fs.readFileSync(path.resolve(fromFile), 'utf-8')
    const data = JSON.parse(raw)
    if (Array.isArray(data)) projects = data
    else if (data && Array.isArray(data.projects)) projects = data.projects
    else throw new Error('Unsupported input file format for projects')
  } else {
    projects = Array.from({ length: count }, (_, i) => genProject(i, rng))
  }

  const results = { projectsCreated: 0, errors: [] }
  for (const p of projects){
    try {
      await createProject(p)
      results.projectsCreated++
    } catch (e) {
      results.errors.push(`${p.projectName}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  console.log('Project import complete:', JSON.stringify(results, null, 2))
}

main()
  .catch((e) => { console.error('Fatal error:', e); process.exit(1) })
