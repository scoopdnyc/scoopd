#!/usr/bin/env node
/**
 * POC: Test whether a logged-in OpenTable session bypasses Akamai bot scoring.
 * Flow: login → navigate to restaurant page → intercept RestaurantsAvailability response.
 * Env vars required: OT_EMAIL, OT_PASSWORD
 * Run: node scripts/opentable-playwright-test.mjs
 */

import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

chromium.use(StealthPlugin())

const OT_EMAIL = process.env.OT_EMAIL
const OT_PASSWORD = process.env.OT_PASSWORD
const LOGIN_URL = 'https://www.opentable.com/login'
const TARGET_URL = 'https://www.opentable.com/r/don-angie-new-york'
const TARGET_OP = 'RestaurantsAvailability'

if (!OT_EMAIL || !OT_PASSWORD) {
  console.error('[ot-playwright] Missing OT_EMAIL or OT_PASSWORD')
  process.exit(1)
}

async function main() {
  console.log('[ot-playwright] Launching Chromium headless with stealth')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  // --- Login ---
  console.log(`[ot-playwright] Navigating to ${LOGIN_URL}`)
  try {
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 })
  } catch (err) {
    console.warn(`[ot-playwright] Login page navigation ended: ${err.message}`)
  }

  console.log('[ot-playwright] Login page title:', await page.title().catch(() => 'unknown'))

  // Fill email — try multiple selector strategies
  const emailSelectors = ['input[type="email"]', 'input[name="email"]', '#email', 'input[autocomplete="email"]']
  let emailFilled = false
  for (const sel of emailSelectors) {
    try {
      await page.fill(sel, OT_EMAIL, { timeout: 3000 })
      console.log(`[ot-playwright] Email filled via selector: ${sel}`)
      emailFilled = true
      break
    } catch {}
  }
  if (!emailFilled) {
    console.error('[ot-playwright] Could not find email input — dumping visible inputs:')
    const inputs = await page.$$eval('input', els => els.map(e => ({ type: e.type, name: e.name, id: e.id, placeholder: e.placeholder })))
    console.log(JSON.stringify(inputs, null, 2))
  }

  // Fill password
  const passwordSelectors = ['input[type="password"]', 'input[name="password"]', '#password']
  let passwordFilled = false
  for (const sel of passwordSelectors) {
    try {
      await page.fill(sel, OT_PASSWORD, { timeout: 3000 })
      console.log(`[ot-playwright] Password filled via selector: ${sel}`)
      passwordFilled = true
      break
    } catch {}
  }
  if (!passwordFilled) {
    console.error('[ot-playwright] Could not find password input')
  }

  // Submit
  const submitSelectors = ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Sign in")', 'button:has-text("Log in")', 'button:has-text("Continue")']
  let submitted = false
  for (const sel of submitSelectors) {
    try {
      await page.click(sel, { timeout: 3000 })
      console.log(`[ot-playwright] Form submitted via selector: ${sel}`)
      submitted = true
      break
    } catch {}
  }
  if (!submitted) {
    console.error('[ot-playwright] Could not find submit button')
  }

  // Wait for post-login navigation
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 })
  } catch (err) {
    console.warn(`[ot-playwright] Post-login navigation wait: ${err.message}`)
  }

  const postLoginTitle = await page.title().catch(() => 'unknown')
  const postLoginUrl = page.url()
  console.log(`[ot-playwright] Post-login URL: ${postLoginUrl}`)
  console.log(`[ot-playwright] Post-login title: ${postLoginTitle}`)

  const loggedIn = !postLoginUrl.includes('/login') && !postLoginUrl.includes('/signin')
  console.log(`[ot-playwright] Login succeeded: ${loggedIn}`)

  // --- Intercept RestaurantsAvailability ---
  let captured = null

  page.on('response', async response => {
    const url = response.url()
    if (url.includes(TARGET_OP)) {
      console.log(`[ot-playwright] Intercepted: ${url}`)
      console.log(`[ot-playwright] Status: ${response.status()}`)
      try {
        const json = await response.json()
        captured = json
        console.log('[ot-playwright] Response body:')
        console.log(JSON.stringify(json, null, 2))
      } catch (err) {
        const text = await response.text().catch(() => '<unreadable>')
        console.log('[ot-playwright] Response (non-JSON):')
        console.log(text.slice(0, 2000))
      }
    }
  })

  console.log(`[ot-playwright] Navigating to ${TARGET_URL}`)
  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 })
  } catch (err) {
    console.warn(`[ot-playwright] Restaurant page navigation ended: ${err.message}`)
  }

  await page.waitForTimeout(3000)

  if (!captured) {
    console.log('[ot-playwright] No RestaurantsAvailability response intercepted')
    console.log('[ot-playwright] Page title:', await page.title().catch(() => 'unknown'))
    console.log('[ot-playwright] Page URL:', page.url())
  } else {
    console.log('[ot-playwright] SUCCESS — response captured')
  }

  await browser.close()
  console.log('[ot-playwright] Done')
}

main().catch(err => {
  console.error('[ot-playwright] Fatal:', err)
  process.exit(1)
})
