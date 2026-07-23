// ─── CareerBot Extension Config ───────────────────────────────────────────────
// Before publishing a release build:
//   1. Set IS_DEV = false
//   2. Fill in PROD_CONFIG below with the real production URLs
//
// Both URL sets are kept here so a release can never accidentally ship pointing
// at localhost — the guard below throws at startup if PROD_CONFIG is empty.
// ──────────────────────────────────────────────────────────────────────────────

const IS_DEV = true; // RELEASE CHECKLIST: set to false before publishing

const DEV_CONFIG = {
  BASE_URL:   'http://localhost:8000/api/v1',
  PORTAL_URL: 'http://localhost:3000',
};

const PROD_CONFIG = {
  BASE_URL:   '', // e.g. https://api.careerbot.ai/api/v1
  PORTAL_URL: '', // e.g. https://app.careerbot.ai
};

// Guard: refuse to initialise in production mode with empty URLs so the
// extension fails loudly at install time rather than silently routing to
// localhost or an empty string.
if (IS_DEV && (PROD_CONFIG.BASE_URL || PROD_CONFIG.PORTAL_URL)) {
  // Dev mode with prod URLs accidentally filled in — warn but allow.
  console.warn('CareerBot extension: IS_DEV=true but PROD_CONFIG is non-empty. Did you mean IS_DEV=false?');
}

if (!IS_DEV && (!PROD_CONFIG.BASE_URL || !PROD_CONFIG.PORTAL_URL)) {
  throw new Error('[CareerBot] PROD_CONFIG.BASE_URL and PROD_CONFIG.PORTAL_URL must both be set before a production build.');
}

const CAREERBOT_CONFIG = IS_DEV ? DEV_CONFIG : PROD_CONFIG;
