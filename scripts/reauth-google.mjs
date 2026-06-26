#!/usr/bin/env node
// Re-authorizes the Google OAuth app and writes a fresh refresh token to .env.local
// Run: node scripts/reauth-google.mjs
import http from 'http'
import { exec } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { URL } from 'url'

const ENV_FILE = new URL('../.env.local', import.meta.url).pathname

function readEnv() {
  try { return readFileSync(ENV_FILE, 'utf8') } catch { return '' }
}

function getEnvVar(content, key) {
  const match = content.match(new RegExp(`^${key}=(.+)$`, 'm'))
  return match ? match[1].trim() : null
}

function setEnvVar(content, key, value) {
  const line = `${key}=${value}`
  if (new RegExp(`^${key}=`, 'm').test(content)) {
    return content.replace(new RegExp(`^${key}=.*$`, 'm'), line)
  }
  return content + (content.endsWith('\n') ? '' : '\n') + line + '\n'
}

const envContent = readEnv()
const CLIENT_ID = getEnvVar(envContent, 'GOOGLE_CLIENT_ID')
const CLIENT_SECRET = getEnvVar(envContent, 'GOOGLE_CLIENT_SECRET')

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not found in .env.local')
  process.exit(1)
}

const PORT = 4242
const REDIRECT_URI = `http://localhost:${PORT}/callback`
const SCOPES = 'https://www.googleapis.com/auth/gmail.modify'

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&access_type=offline` +
  `&prompt=consent`  // force consent to always get a refresh token

console.log('\nOpening browser for Google authorization...')
console.log('If it does not open, visit:\n', authUrl)

exec(`open "${authUrl}"`)

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/callback')) return
  const params = new URL(req.url, `http://localhost:${PORT}`).searchParams
  const code = params.get('code')
  const error = params.get('error')

  if (error || !code) {
    res.end('Authorization failed: ' + (error || 'no code'))
    console.error('Authorization failed:', error)
    server.close()
    process.exit(1)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })
  const tokens = await tokenRes.json()

  if (!tokens.refresh_token) {
    res.end('No refresh token returned. Try revoking access at myaccount.google.com/permissions and re-running.')
    console.error('Response:', tokens)
    server.close()
    process.exit(1)
  }

  // Write to .env.local
  let updated = readEnv()
  updated = setEnvVar(updated, 'GOOGLE_REFRESH_TOKEN', tokens.refresh_token)
  writeFileSync(ENV_FILE, updated)
  console.log('\n✓ .env.local updated with new GOOGLE_REFRESH_TOKEN')

  // Push to Vercel if project is linked, otherwise print instructions
  console.log('\nPushing to Vercel env vars...')
  const { execSync } = await import('child_process')
  try {
    execSync(
      `echo "${tokens.refresh_token}" | npx vercel env add GOOGLE_REFRESH_TOKEN production --force`,
      { stdio: 'pipe', cwd: new URL('..', import.meta.url).pathname }
    )
    console.log('✓ Vercel GOOGLE_REFRESH_TOKEN updated')
  } catch {
    console.log('\nVercel CLI update failed (project may not be linked).')
    console.log('Manually set this in Vercel dashboard > Settings > Environment Variables:')
    console.log(`  GOOGLE_REFRESH_TOKEN = ${tokens.refresh_token}`)
  }

  res.end('<h2>Success! You can close this tab.</h2>')
  console.log('\nDone. Restart the nightly workflow to pick up the new token.')
  server.close()
  process.exit(0)
})

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`)
})
