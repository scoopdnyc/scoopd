#!/usr/bin/env node
/**
 * POC: Test whether pre-authenticated OT cookies bypass Akamai bot scoring.
 * Flow: inject cookies → navigate to restaurant page → intercept RestaurantsAvailability response.
 * Env vars required: OT_COOKIES (JSON array: [{name, value, domain, path}, ...])
 * To export cookies: open opentable.com in Chrome → DevTools → Application → Cookies
 *   → copy all cookies for .opentable.com as JSON.
 * Run: node scripts/opentable-playwright-test.mjs
 */

import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

chromium.use(StealthPlugin())

const OT_COOKIES_RAW = process.env.OT_COOKIES
const TARGET_URL = 'https://www.opentable.com/r/don-angie-new-york'
const TARGET_OP = 'RestaurantsAvailability'

if (!OT_COOKIES_RAW) {
  console.error('[ot-playwright] Missing OT_COOKIES')
  process.exit(1)
}

let cookies
try {
  cookies = JSON.parse(OT_COOKIES_RAW)
  console.log(`[ot-playwright] Loaded ${cookies.length} cookies`)
} catch (err) {
  console.error('[ot-playwright] Failed to parse OT_COOKIES JSON:', err.message)
  process.exit(1)
}

async function main() {
  console.log('[ot-playwright] Launching Chromium headless with stealth')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  })

  // Inject pre-authenticated cookies before any navigation
  await context.addCookies(cookies)
  console.log('[ot-playwright] Cookies injected into browser context')

  const page = await context.newPage()
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
    console.warn(`[ot-playwright] Navigation ended: ${err.message}`)
  }

  await page.waitForTimeout(3000)

  console.log('[ot-playwright] Page URL:', page.url())
  console.log('[ot-playwright] Page title:', await page.title().catch(() => 'unknown'))

  if (!captured) {
    console.log('[ot-playwright] No RestaurantsAvailability response intercepted')
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
