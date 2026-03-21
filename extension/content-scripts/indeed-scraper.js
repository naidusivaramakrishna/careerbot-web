// Indeed JD scraper

(function () {
  if (window.__careerbotIndeed) return;
  window.__careerbotIndeed = true;

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
    return document.querySelector('#jobDescriptionText') !== null ||
           /viewjob/.test(window.location.href);
  }

  function extractJobDescription() {
    const el = document.querySelector('#jobDescriptionText, [class*="jobDescription"], .jobsearch-jobDescriptionText');
    return el && el.innerText.trim().length > 100 ? el.innerText.trim() : null;
  }

  function extractMeta() {
    const titleEl   = document.querySelector('.jobsearch-JobInfoHeader-title, h1[class*="jobTitle"]');
    const companyEl = document.querySelector('[data-testid="inlineHeader-companyName"], .jobsearch-InlineCompanyRating-companyHeader');
    return {
      title:   titleEl?.innerText?.trim()   || document.title,
      company: companyEl?.innerText?.trim() || '',
      url:     window.location.href,
      source:  'indeed',
    };
  }

  function tryDetect() {
    if (!isJobPage()) return;
    const jd = extractJobDescription();
    if (!jd) return;

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

  setTimeout(tryDetect, 2000);
})();
