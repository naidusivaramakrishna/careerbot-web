// background/service-worker.js

const POPUP_WIDTH  = 380;
const POPUP_HEIGHT = 580;

chrome.action.onClicked.addListener(async () => {
  const win = await chrome.windows.getCurrent();

  const left = win.left + win.width - POPUP_WIDTH - 16;
  const top  = win.top  + Math.round((win.height - POPUP_HEIGHT) / 2);

  chrome.windows.create({
    url:    chrome.runtime.getURL('popup/popup.html'),
    type:   'popup',
    width:  POPUP_WIDTH,
    height: POPUP_HEIGHT,
    left:   Math.max(0, left),
    top:    Math.max(0, top),
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'JD_DETECTED') {
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
      timestamp: Date.now(),
    }
  });

  // Show badge on extension icon
  chrome.action.setBadgeText({ text: '1', tabId: tab?.id });
  chrome.action.setBadgeBackgroundColor({ color: '#8b5cf6', tabId: tab?.id });
}

// Clear old detected JDs when tab navigates away
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    const { detectedJD } = await chrome.storage.local.get('detectedJD');
    if (detectedJD) {
      chrome.action.setBadgeText({ text: '' });
    }
  }
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  }
});
