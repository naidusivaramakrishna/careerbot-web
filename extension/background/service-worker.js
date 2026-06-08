// background/service-worker.js

// Open side panel on icon click (direct user gesture — always works).
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate that the message comes from our own extension only.
  if (sender.id !== chrome.runtime.id) return false;

  if (message.type === 'JD_DETECTED') {
    handleJDDetected(message.data, sender.tab);
    sendResponse({ ok: true });
  }

  // "Tailor Resume" clicked in banner — open panel immediately (user gesture
  // context is still active), then store the JD asynchronously.
  if (message.type === 'JD_TAILOR_NOW') {
    if (sender.tab?.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => {});
    }
    handleJDDetected(message.data, sender.tab);
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
