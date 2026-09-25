// background/service-worker.js
importScripts('../config.js');

// Open side panel on icon click (direct user gesture — always works).
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});

// Hostnames our content scripts are declared against in manifest.json —
// JD_DETECTED/JD_TAILOR_NOW are only trusted from these origins.
const ALLOWED_JD_HOSTS = new Set([
  'www.linkedin.com', 'linkedin.com',
  'www.naukri.com',
  'www.indeed.co.in', 'in.indeed.com', 'www.indeed.com',
  'www.glassdoor.com', 'glassdoor.com', 'www.glassdoor.co.in', 'glassdoor.co.in',
  'www.shine.com', 'shine.com',
  'www.timesjobs.com',
  'internshala.com',
  'www.foundit.in', 'www.foundit.sg', 'www.foundit.my', 'www.foundit.ph',
  'www.ziprecruiter.com',
  'wellfound.com', 'angel.co',
  'boards.greenhouse.io', 'job-boards.greenhouse.io',
  'jobs.lever.co',
  'www.dice.com',
  'www.jobleads.com',
  'www.zippia.com',
]);

function isFromAllowedHost(tab) {
  if (!tab?.url) return false;
  try {
    const tabUrl = new URL(tab.url);
    if (!['http:', 'https:'].includes(tabUrl.protocol)) return false;
    // Strict allowlist only — a check against data.meta.url would compare
    // two attacker-controlled values (both come from the message sender),
    // making the check self-satisfying and equivalent to "any http(s) tab".
    return ALLOWED_JD_HOSTS.has(tabUrl.hostname);
  } catch {
    return false;
  }
}

const MAX_JD_LENGTH = 30000;
const MAX_META_FIELD_LENGTH = 300;

function sanitizeJDPayload(data) {
  if (!data || typeof data.jd !== 'string' || !data.jd.trim()) return null;
  const meta = data.meta && typeof data.meta === 'object' ? data.meta : {};
  const str = (v) => (typeof v === 'string' ? v.slice(0, MAX_META_FIELD_LENGTH) : '');
  return {
    jd: data.jd.slice(0, MAX_JD_LENGTH),
    meta: {
      title:    str(meta.title),
      company:  str(meta.company),
      location: str(meta.location),
      url:      str(meta.url),
      source:   str(meta.source),
    },
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate that the message comes from our own extension only.
  if (sender.id !== chrome.runtime.id) return false;

  if (message.type === 'JD_DETECTED') {
    if (!isFromAllowedHost(sender.tab)) return false;
    const payload = sanitizeJDPayload(message.data);
    if (payload) handleJDDetected(payload, sender.tab);
    sendResponse({ ok: Boolean(payload) });
    return true;
  }

  // "Tailor Resume" clicked in banner — open panel immediately (user gesture
  // context is still active), then store the JD asynchronously.
  if (message.type === 'JD_TAILOR_NOW') {
    if (!isFromAllowedHost(sender.tab)) return false;
    const payload = sanitizeJDPayload(message.data);
    if (payload && sender.tab?.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => {});
    }
    if (payload) handleJDDetected(payload, sender.tab);
    sendResponse({ ok: Boolean(payload) });
    return true;
  }

  return false;
});

async function handleJDDetected(data, tab) {
  await chrome.storage.local.set({
    detectedJD: {
      jd:        data.jd,
      meta:      data.meta,
      url:       tab?.url || '',
      tabId:     tab?.id  || null,
      timestamp: Date.now(),
    }
  });

  // Show badge on extension icon
  chrome.action.setBadgeText({ text: '1', tabId: tab?.id });
  chrome.action.setBadgeBackgroundColor({ color: '#8b5cf6', tabId: tab?.id });
}


// Clear detected JD only when the exact tab that detected it navigates away
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'loading') return;
  // Never clear when our own popup/extension pages are loading
  if (tab.url?.startsWith('chrome-extension://')) return;

  const { detectedJD } = await chrome.storage.local.get('detectedJD');
  if (detectedJD && detectedJD.tabId === tabId) {
    await chrome.storage.local.remove('detectedJD');
    chrome.action.setBadgeText({ text: '' });
  }
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: CAREERBOT_CONFIG.PORTAL_URL });
  }
});
