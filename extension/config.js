// ─── CareerBot Extension Config ───────────────────────────────────────────────
// Flip IS_DEV to false and fill in the PRODUCTION urls below before publishing
// a release build. Keeping both sets here (instead of only the active one)
// means a release can never accidentally ship pointing at localhost.
// ──────────────────────────────────────────────────────────────────────────────

const IS_DEV = true;

const DEV_CONFIG = {
  BASE_URL:   'http://localhost:8000/api/v1',
  PORTAL_URL: 'http://localhost:3000',
};

const PROD_CONFIG = {
  BASE_URL:   '', // TODO: set production backend URL before shipping, e.g. https://api.careerbot.ai/api/v1
  PORTAL_URL: '', // TODO: set production portal URL before shipping, e.g. https://app.careerbot.ai
};

if (!IS_DEV && (!PROD_CONFIG.BASE_URL || !PROD_CONFIG.PORTAL_URL)) {
  // Fail loudly instead of silently sending traffic to an empty/localhost URL.
  throw new Error('CareerBot extension: PROD_CONFIG.BASE_URL/PORTAL_URL must be set before a non-dev build.');
}

const CAREERBOT_CONFIG = IS_DEV ? DEV_CONFIG : PROD_CONFIG;
