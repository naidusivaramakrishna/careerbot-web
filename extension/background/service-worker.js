// background/service-worker.js

chrome.action.onClicked.addListener(() => {
  openPopup();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate that the message comes from our own extension only.
  // This prevents any externally_connectable web page from triggering handlers.
  if (sender.id !== chrome.runtime.id) {
    return false;
  }

  if (message.type === 'JD_DETECTED') {
    handleJDDetected(message.data, sender.tab);
    sendResponse({ ok: true });
  }

  // User clicked "Tailor Resume" in the banner — save JD and open popup immediately
  if (message.type === 'JD_TAILOR_NOW') {
    handleJDDetected(message.data, sender.tab).then(() => {
      openPopup();
    });
    sendResponse({ ok: true });
  }

  return true;
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

async function openPopup() {
  const popupUrl = chrome.runtime.getURL('popup/popup.html');

  // If already open, just focus it
  const existing = await chrome.windows.getAll({ windowTypes: ['popup'] });
  const careerbotWin = existing.find(w => w.type === 'popup');
  if (careerbotWin) {
    await chrome.windows.update(careerbotWin.id, { focused: true });
    return;
  }

  const win = await chrome.windows.getCurrent().catch(() => null);
  const W = 800;
  const H = Math.round((win?.height || screen.availHeight) * 0.90);
  const left = (win?.left || 0) + (win?.width || screen.availWidth) - W;
  const top  = win?.top || 0;

  chrome.windows.create({
    url:    popupUrl,
    type:   'popup',
    width:  W,
    height: H,
    left:   Math.max(0, left),
    top:    Math.max(0, top),
  });
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
    chrome.tabs.create({ url: 'http://localhost:3000' });
  }
});
