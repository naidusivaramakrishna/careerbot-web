import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

console.log('Navigating to homepage...');
await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
console.log('Title:', await page.title());
console.log('URL:', page.url());
await page.screenshot({ path: 'verify-01-homepage.png', fullPage: false });

// Look for sign-in link/button
const signInSelectors = [
  'a[href*="sign-in"]', 'a[href*="signin"]', 'a[href*="login"]',
  'button:has-text("Sign in")', 'button:has-text("Login")',
  'a:has-text("Sign in")', 'a:has-text("Login")',
];
let found = null;
for (const sel of signInSelectors) {
  if (await page.locator(sel).first().isVisible().catch(() => false)) {
    found = sel;
    break;
  }
}
console.log('Sign-in element found:', found);

if (found) {
  await page.locator(found).first().click();
  await page.waitForLoadState('networkidle');
  console.log('After click URL:', page.url());
} else {
  // Try direct navigation to common auth paths
  for (const path of ['/sign-in', '/signin', '/login', '/auth/signin', '/auth/login']) {
    const resp = await page.goto('http://localhost:3000' + path).catch(() => null);
    if (resp && resp.status() < 400) {
      console.log('Direct nav to', path, 'succeeded');
      break;
    }
  }
}
await page.screenshot({ path: 'verify-02-signin-page.png', fullPage: false });
console.log('Sign-in page URL:', page.url());
console.log('Sign-in page title:', await page.title());

// Fill in credentials
const emailSelectors = ['input[type="email"]', 'input[name="email"]', 'input[placeholder*="email" i]'];
const passSelectors  = ['input[type="password"]', 'input[name="password"]'];

let emailFilled = false, passFilled = false;
for (const sel of emailSelectors) {
  const el = page.locator(sel).first();
  if (await el.isVisible().catch(() => false)) {
    await el.fill('shinnu@gmail.com');
    console.log('Filled email with selector:', sel);
    emailFilled = true;
    break;
  }
}
for (const sel of passSelectors) {
  const el = page.locator(sel).first();
  if (await el.isVisible().catch(() => false)) {
    await el.fill('Shinny4#');
    console.log('Filled password with selector:', sel);
    passFilled = true;
    break;
  }
}

if (!emailFilled || !passFilled) {
  console.error('Could not fill credentials. Page HTML snippet:');
  console.error(await page.content().then(h => h.substring(0, 2000)));
} else {
  await page.screenshot({ path: 'verify-03-filled.png', fullPage: false });

  // Submit
  const submitSelectors = [
    'button[type="submit"]', 'button:has-text("Sign in")', 'button:has-text("Login")',
    'input[type="submit"]',
  ];
  for (const sel of submitSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) {
      console.log('Clicking submit:', sel);
      await el.click();
      break;
    }
  }

  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);
  console.log('Post-login URL:', page.url());
  console.log('Post-login title:', await page.title());
  await page.screenshot({ path: 'verify-04-post-login.png', fullPage: false });
}

await browser.close();
console.log('Done. Screenshots saved as verify-0*.png');
