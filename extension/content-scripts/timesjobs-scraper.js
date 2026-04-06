// TimesJobs JD scraper

(function () {
  if (window.__careerbotTimesJobs) return;
  window.__careerbotTimesJobs = true;

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
    return /timesjobs\.com\/(candidate\/)?job-detail/.test(window.location.href) ||
           document.querySelector('.jd-desc') !== null;
  }

  function extractJobDescription() {
    // 1. Try known TimesJobs class selectors
    const selectors = [
      '.dang-inner-html',
      '.jd-desc',
      '[class*="dang-inner-html"]',
      '.job-description',
      '[class*="jd-desc"]',
      '.jd-sec',
      '#job-detail-section',
      '#jobDescSection',
      '.job-article',
      '[class*="job-desc"]',
      '.liBullet',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim().length > 50) return el.innerText.trim();
    }

    // 2. Fallback: find the container that holds the "Job Description" heading
    const headings = document.querySelectorAll('h2, h3, h4, strong, b');
    for (const heading of headings) {
      if (/^job\s*desc/i.test(heading.textContent.trim())) {
        let el = heading.parentElement;
        for (let i = 0; i < 4 && el; i++, el = el.parentElement) {
          const text = el.innerText.trim();
          if (text.length > 200) return text;
        }
      }
    }

    // 3. Last resort: largest text block in the main content area
    const candidates = document.querySelectorAll('div, article, section');
    let best = null;
    for (const el of candidates) {
      // Skip nav, header, footer, sidebar
      if (/nav|header|footer|sidebar|menu|ad-|banner/i.test(el.className + el.id)) continue;
      // Only consider direct text containers (avoid nested giant divs)
      const children = el.children.length;
      if (children > 20) continue;
      const text = el.innerText.trim();
      if (text.length > 300 && (!best || text.length < best.length)) {
        best = text;
      }
    }
    return best;
  }

  function extractMeta() {
    const titleEl   = document.querySelector('h1.jd-job-title, h1[class*="job-title"], .heading-tit h1, h1');
    const companyEl = document.querySelector('.jd-header-comp-name a, .comp-name a, [class*="comp-name"]');
    return {
      title:   titleEl?.innerText?.trim()   || document.title,
      company: companyEl?.innerText?.trim() || '',
      url:     window.location.href,
      source:  'timesjobs',
    };
  }

  let _detected = false;
  let _retries  = 0;

  function tryDetect() {
    if (_detected) return;
    if (!isJobPage()) return;
    const jd = extractJobDescription();
    if (!jd) {
      if (_retries < 4) {
        _retries++;
        setTimeout(tryDetect, 2000);
      }
      return;
    }
    _detected = true;
    const meta = extractMeta();
    chrome.runtime.sendMessage({ type: 'JD_DETECTED', data: { jd, meta } });
    injectBanner(meta, jd);
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
    wrap.innerHTML = `
      <div class="cb-icon">✨</div>
      <div class="cb-meta">
        <span class="cb-title">${meta.title || 'Job Detected'}</span>
        ${meta.company ? `<span class="cb-company">${meta.company}</span>` : ''}
        <span class="cb-badge">${meta.source || 'careerbot'}</span>
      </div>
      <button class="cb-btn" id="cb-tailor-btn">✦ Tailor Resume</button>
      <button class="cb-close" id="cb-close-btn">✕</button>
    `;

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

  // Try immediately, then retry up to 4x every 2s if content not ready yet
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(tryDetect, 500));
  } else {
    setTimeout(tryDetect, 500);
  }
})();
