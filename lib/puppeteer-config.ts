import puppeteer from 'puppeteer'
import puppeteerCore from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export async function launchBrowser() {
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    // Vercel production environment - exact working config
    return await puppeteerCore.launch({
      args: [
        ...chromium.args,
        '--hide-scrollbars',
        '--disable-web-security'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })
  } else {
    // Local development environment
    return await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  }
}
