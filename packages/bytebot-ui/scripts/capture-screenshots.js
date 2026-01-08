const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const pages = ['desktop', 'web', 'tasks'];
  
  for (const p of pages) {
    const page = await browser.newPage();
    console.log(`Capturing ${p}...`);
    try {
      await page.goto(`http://localhost:9992/${p}`, { timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await page.screenshot({ path: `bytebot-ui/public/${p}.png` });
      console.log(`Saved ${p}.png`);
    } catch (error) {
      console.error(`Failed to capture ${p}: ${error.message}`);
    }
  }
  
  await browser.close();
  console.log('Done!');
})();
