#!/usr/bin/env node
/**
 * POC: Intercept OpenTable RestaurantsAvailability response via Playwright.
 * Goal: confirm GitHub Actions Chromium can bypass Akamai and get real availability data.
 * Run: node scripts/opentable-playwright-test.mjs
 */

import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

chromium.use(StealthPlugin())

const TARGET_URL = 'https://www.opentable.com/r/don-angie-new-york'
const TARGET_OP = 'RestaurantsAvailability'

async function main() {
  console.log('[ot-playwright] Launching Chromium headless')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })
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

  // Brief wait in case the availability request fires after initial load
  await page.waitForTimeout(3000)

  if (!captured) {
    console.log('[ot-playwright] No RestaurantsAvailability response intercepted')
    console.log('[ot-playwright] Page title:', await page.title().catch(() => 'unknown'))
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
