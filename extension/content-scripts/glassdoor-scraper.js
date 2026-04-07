// Glassdoor JD scraper

(function () {
  if (window.__careerbotGlassdoor) return;
  window.__careerbotGlassdoor = true;

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
    const url  = window.location.href;
    const path = window.location.pathname;
    return /glassdoor\.(com|co\.in)\/job-listing\//i.test(url) ||
           /glassdoor\.(com|co\.in)\/Jobs\//i.test(url) ||
           /glassdoor\.(com|co\.in)\/Job\//i.test(url) ||       // /Job/ (no s) — co.in pattern
           /glassdoor\.(com|co\.in)\/partner\/jobListing/i.test(url) ||
           /[?&]jl=\d+/.test(window.location.search) ||
           /SRCH_/.test(path);                                   // search results with job panel
  }

  function extractJobDescription() {
    const selectors = [
      // data-test attributes are most stable across redesigns
      '[data-test="jobDescriptionContent"]',
      '[data-test="jobDescription"]',
      // CSS module partial matches (obfuscated suffix changes but prefix stays)
      '[class*="JobDetails_jobDescription"]',
      '[class*="JobDescriptionContainer"]',
      '[class*="jobDescriptionContent"]',
      '[class*="JobDetails_jobDetails"]',
      '[class*="jobDetails"]',
      // Older Glassdoor
      '.desc',
      '[class*="job-desc"]',
      '[id*="JobDesc"]',
      '[class*="JobDesc"]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim().length > 50) return el.innerText.trim();
    }

    // Fallback: find container holding a "Job Description" heading
    const headings = document.querySelectorAll('h2, h3, h4, section');
    for (const h of headings) {
      if (/^job\s*desc/i.test(h.textContent.trim())) {
        let el = h.parentElement;
        for (let i = 0; i < 4 && el; i++, el = el.parentElement) {
          if (el.innerText.trim().length > 200) return el.innerText.trim();
        }
      }
    }
    return null;
  }

  function extractMeta() {
    const titleEl = document.querySelector(
      '[class*="JobDetails_jobTitle"] h1, [data-test="job-title"], h1[class*="title"]'
    );
    const companyEl = document.querySelector(
      '[class*="EmployerProfile_employerName"], [data-test="employer-name"], [class*="employer-name"]'
    );
    return {
      title:   titleEl?.innerText?.trim()   || document.title,
      company: companyEl?.innerText?.trim() || '',
      url:     window.location.href,
      source:  'glassdoor',
    };
  }

  let _lastDetectedFingerprint = '';
  let _retries = 0;
  let _mutationTimer = null;

  function tryDetect() {
    if (!isJobPage()) return;
    const jd = extractJobDescription();
    if (!jd) {
      if (_retries < 5) {
        _retries++;
        setTimeout(tryDetect, 2000);
      }
      return;
    }
    _retries = 0;
    const meta = extractMeta();
    // Use first 120 chars of JD + title as fingerprint to detect job change
    // This works even when the URL does NOT change (e.g. Glassdoor "For You" panel)
    const fingerprint = (meta.title + jd).slice(0, 120);
    if (fingerprint !== _lastDetectedFingerprint) {
      _lastDetectedFingerprint = fingerprint;
      chrome.runtime.sendMessage({ type: 'JD_DETECTED', data: { jd, meta } });
      // Remove old banner and inject new one for the new job
      document.getElementById('cb-shadow-host')?.remove();
      injectBanner(meta, jd);
    }
  }

  function injectBanner(meta, jd) {
    if (document.getElementById('cb-shadow-host')) return;

    const host = document.createElement('div');
    host.id = 'cb-shadow-host';
    host.style.cssText = 'position:fixed!important;bottom:24px!important;right:24px!important;top:auto!important;left:auto!important;z-index:2147483647!important;pointer-events:auto!important;margin:0!important;padding:0!important;border:none!important;background:transparent!important;';

    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
  :host {
    position: fixed !important;
    bottom: 24px !important;
    right: 24px !important;
    top: auto !important;
    left: auto !important;
    z-index: 2147483647 !important;
    pointer-events: auto !important;
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    background: transparent !important;
  }

  @keyframes cb-in {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  .cb-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #ffffff;
    border: 1.5px solid #ede9fe;
    border-left: 5px solid #7c3aed;
    border-radius: 14px;
    padding: 13px 16px 13px 14px;
    box-shadow: 0 4px 24px rgba(109,40,217,0.18), 0 1px 4px rgba(0,0,0,0.08);
    width: 340px;
    max-width: calc(100vw - 48px);
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: cb-in 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }

  .cb-icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #f5f3ff, #ede9fe);
    border: 1px solid #ddd6fe;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
  }

  .cb-meta {
    flex: 1;
    min-width: 0;
  }

  .cb-title {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }

  .cb-company {
    display: block;
    font-size: 11px;
    color: #6b7280;
    margin-top: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cb-badge {
    display: inline-block;
    font-size: 9px;
    font-weight: 700;
    color: #7c3aed;
    background: #f5f3ff;
    border: 1px solid #ddd6fe;
    border-radius: 4px;
    padding: 1px 5px;
    margin-top: 3px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .cb-btn {
    flex-shrink: 0;
    padding: 9px 15px;
    background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
    color: #fff;
    border: none;
    border-radius: 9px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(124,58,237,0.4);
    transition: transform 0.15s, box-shadow 0.15s;
    font-family: inherit;
  }

  .cb-btn:hover {
    background: linear-gradient(135deg, #6d28d9, #7c3aed);
    box-shadow: 0 4px 16px rgba(124,58,237,0.5);
    transform: translateY(-1px);
  }

  .cb-btn:active {
    transform: translateY(0);
    box-shadow: 0 1px 4px rgba(124,58,237,0.3);
  }

  .cb-close {
    flex-shrink: 0;
    width: 25px;
    height: 25px;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    color: #9ca3af;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
    font-family: inherit;
  }

  .cb-close:hover {
    background: #fee2e2;
    border-color: #fca5a5;
    color: #ef4444;
  }
`;

    const wrap = document.createElement('div');
    wrap.className = 'cb-wrap';
    // Static structure only — user data set via textContent below to prevent XSS
    const staticBanner = `
      <div class="cb-icon">✨</div>
      <div class="cb-meta">
        <span class="cb-title"></span>
        <span class="cb-company"></span>
        <span class="cb-badge"></span>
      </div>
      <button class="cb-btn" id="cb-tailor-btn">✦ Tailor Resume</button>
      <button class="cb-close" id="cb-close-btn">✕</button>
    `;
    wrap.innerHTML = staticBanner; // safe: static structure only, user data via textContent
    wrap.querySelector('.cb-title').textContent = meta.title || 'Job Detected';
    const companyEl = wrap.querySelector('.cb-company');
    if (meta.company) { companyEl.textContent = meta.company; } else { companyEl.remove(); }
    wrap.querySelector('.cb-badge').textContent = meta.source || 'careerbot';

    shadow.appendChild(style);
    shadow.appendChild(wrap);
    document.body.appendChild(host);

    shadow.getElementById('cb-tailor-btn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'JD_TAILOR_NOW', data: { jd, meta } });
      host.remove();
    });

    shadow.getElementById('cb-close-btn').addEventListener('click', () => {
      host.remove();
    });
  }

  // Initial detection
  setTimeout(tryDetect, 1000);

  // Watch for ANY DOM change (job panel updates without URL change on "For You" page)
  // Debounced so it doesn't fire hundreds of times per second
  new MutationObserver(() => {
    clearTimeout(_mutationTimer);
    _mutationTimer = setTimeout(() => {
      _retries = 0;
      tryDetect();
    }, 800);
  }).observe(document, { subtree: true, childList: true });
})();
