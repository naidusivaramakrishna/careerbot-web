// LinkedIn JD scraper

(function () {
  if (window.__careerbotLinkedIn) return;
  window.__careerbotLinkedIn = true;

  // Inject critical CSS to lock banner positioning
  const style = document.createElement('style');
  style.textContent = `
    #careerbot-banner {
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      top: auto !important;
      left: auto !important;
      width: auto !important;
      height: auto !important;
      z-index: 2147483647 !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-end !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
      background: transparent !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      transform: none !important;
      pointer-events: auto !important;
      inset: auto 24px 24px auto !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  function isJobPage() {
    return /\/jobs\/view\/\d+/.test(window.location.pathname) ||
           /\/jobs\/collections\//.test(window.location.pathname) ||
           /\/jobs\/search\//.test(window.location.pathname) ||
           /\/jobs\//.test(window.location.pathname);
  }

  function extractJobDescription() {
    const selectors = [
      // Current LinkedIn selectors (2024-2025)
      '#job-details',
      '#job-details span',
      '.jobs-description__container',
      '.jobs-description__content',
      '.jobs-description-content__text',
      '.jobs-description-content__text--stretch',
      // Older selectors as fallback
      '.description__text',
      '[class*="job-description"]',
      '.jobs-box__html-content',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim().length > 100) return el.innerText.trim();
    }

    // Last resort: find any element with substantial text near "job-details" or "description"
    const candidates = document.querySelectorAll('article, section, div[id*="job"], div[class*="description"]');
    for (const el of candidates) {
      const text = el.innerText?.trim();
      if (text && text.length > 200 && !el.querySelector('nav') && !el.querySelector('header')) {
        return text;
      }
    }
    return null;
  }

  function extractMeta() {
    const titleEl = document.querySelector(
      '.job-details-jobs-unified-top-card__job-title h1, .jobs-unified-top-card__job-title h1, h1.t-24'
    );
    const companyEl = document.querySelector(
      '.job-details-jobs-unified-top-card__company-name a, .jobs-unified-top-card__company-name a, .topcard__org-name-link'
    );
    return {
      title:   titleEl?.innerText?.trim()   || document.title,
      company: companyEl?.innerText?.trim() || '',
      url:     window.location.href,
      source:  'linkedin',
    };
  }

  function tryDetect() {
    console.log('[CareerBot] tryDetect fired, URL:', window.location.pathname);
    if (!isJobPage()) {
      console.log('[CareerBot] Not a job page, skipping.');
      return;
    }
    const jd = extractJobDescription();
    console.log('[CareerBot] JD found:', jd ? jd.slice(0, 80) + '...' : 'NULL');
    if (!jd) {
      // Log what selectors are available on the page for debugging
      const all = ['#job-details', '.jobs-description__container', '.jobs-description__content',
        '.jobs-description-content__text', '.jobs-description-content__text--stretch',
        '.description__text', '[class*="job-description"]', '.jobs-box__html-content'];
      all.forEach(s => {
        const el = document.querySelector(s);
        console.log(`[CareerBot] selector "${s}":`, el ? `found, text len=${el.innerText.trim().length}` : 'not found');
      });
      return;
    }

    const meta = extractMeta();
    chrome.runtime.sendMessage({ type: 'JD_DETECTED', data: { jd, meta } });
    injectBanner(meta, jd);
  }

  function applyBannerStyles(banner) {
    banner.style.cssText = `
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      top: auto !important;
      left: auto !important;
      width: auto !important;
      height: auto !important;
      z-index: 2147483647 !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-end !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
      background: transparent !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      transform: none !important;
      pointer-events: auto !important;
      inset: auto 24px 24px auto !important;
    `;
  }

  function injectBanner(meta, jd) {
    if (document.getElementById('careerbot-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'careerbot-banner';
    applyBannerStyles(banner);

    banner.innerHTML = `
      <div class="cb-banner-inner">
        <span class="cb-spark">✨</span>
        <div class="cb-meta">
          <strong>${meta.title || 'Job Detected'}</strong>
          <span>${meta.company || ''}</span>
        </div>
        <button class="cb-btn" id="cb-tailor-btn">Tailor Resume</button>
        <button class="cb-close" id="cb-close-btn">✕</button>
      </div>
    `;
    document.body.appendChild(banner);

    let isActive = true;

    // Continuous position monitor - re-apply every 100ms as a safeguard
    const positionCheckInterval = setInterval(() => {
      if (!isActive) return;
      const banner = document.getElementById('careerbot-banner');
      if (banner) {
        applyBannerStyles(banner);
      } else {
        isActive = false;
        clearInterval(positionCheckInterval);
      }
    }, 100);

    // Monitor for style changes and re-apply if needed
    const observer = new MutationObserver(() => {
      const banner = document.getElementById('careerbot-banner');
      if (banner) applyBannerStyles(banner);
    });
    observer.observe(banner, { attributes: true, attributeFilter: ['style'] });

    document.getElementById('cb-tailor-btn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'JD_DETECTED', data: { jd, meta } });
      isActive = false;
      banner.remove();
      observer.disconnect();
      clearInterval(positionCheckInterval);
    });
    document.getElementById('cb-close-btn').addEventListener('click', () => {
      isActive = false;
      banner.remove();
      observer.disconnect();
      clearInterval(positionCheckInterval);
    });
  }

  // Wait for dynamic content - try multiple times in case content loads late
  setTimeout(tryDetect, 1500);
  setTimeout(tryDetect, 3000);
  setTimeout(tryDetect, 5000);

  // Re-run on URL change (SPA navigation)
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(tryDetect, 1500);
      setTimeout(tryDetect, 3000);
    }
  }).observe(document, { subtree: true, childList: true });
})();
