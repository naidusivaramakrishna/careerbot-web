// Zippia JD scraper
// Zippia has no stable, documented class names for job detail views (aggregator
// pages mix listing cards and detail panels under the same markup family), so
// this uses generic heuristics instead of guessed selectors: a real job
// description reads as a long block of prose containing JD-shaped language
// ("responsibilities", "requirements", etc.), while listing-page job cards are
// short blurbs that won't pass the length + keyword bar below.

(function () {
  if (window.__careerbotZippia) return;
  window.__careerbotZippia = true;

  const style = document.createElement('style');
  style.textContent = `
    #careerbot-banner {
      position: fixed !important;
      top: 50% !important;
      right: 24px !important;
      bottom: auto !important;
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
      transform: translateY(-50%) !important;
      pointer-events: auto !important;
      inset: 50% 24px auto auto !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  const JD_MARKERS = /responsibilit|requirement|qualification|about the (job|role|position)|job description|what you.ll (do|need)|who you are|preferred skills|nice to have/i;

  function isJobPage() {
    return /zippia\.com\/.*\bjobs?\b/i.test(window.location.href);
  }

  // The popup accepts a JD of up to 50k characters.
  const MAX_JD_CHARS = 50000;

  // textContent, not innerText — innerText forces a synchronous layout, and this
  // runs for every div/section/article on the page. innerText is read only for
  // the block that wins (see extractJobDescription).
  function isJdBlock(el) {
    if (el.querySelector('nav, header, footer')) return false;
    const text = el.textContent?.trim();
    return !!text && text.length >= 300 && JD_MARKERS.test(text);
  }

  // A JD is usually several sections (Responsibilities, Requirements, ...), each
  // in its own block that passes the length + keyword bar on its own, so keeping
  // the smallest passing block returned just one section. Instead: find the
  // individual sections (passing blocks that contain no other passing block) and
  // return their closest shared container, i.e. the whole description. A
  // page-level wrapper is never chosen because blocks holding nav/header/footer
  // don't pass.
  function extractJobDescription() {
    const blocks = Array.from(document.querySelectorAll('div, section, article')).filter(isJdBlock);
    const sections = blocks.filter((el) => !blocks.some((other) => other !== el && el.contains(other)));
    if (sections.length === 0) return null;

    let container = sections[0];
    while (container && !sections.every((section) => container.contains(section))) {
      container = container.parentElement;
    }
    if (container && isJdBlock(container)) {
      const whole = container.innerText.trim();
      if (whole.length <= MAX_JD_CHARS) return whole;
    }

    // No clean shared container: fall back to the largest single section.
    const largest = sections.reduce((a, b) => (b.textContent.length > a.textContent.length ? b : a));
    return largest.innerText.trim();
  }

  function extractMeta() {
    const titleEl = document.querySelector('h1');
    const title = titleEl?.innerText?.trim() || document.title.replace(/\s*\|\s*Zippia.*$/i, '').trim();

    // Company/location are usually short text siblings near the H1 (e.g.
    // "Acme Corp - San Jose, CA"). Look for a short line near the title
    // rather than guessing a class name.
    let company = '';
    let location = '';
    if (titleEl) {
      let node = titleEl.nextElementSibling;
      let hops = 0;
      while (node && hops < 4) {
        const t = node.innerText?.trim();
        if (t && t.length > 0 && t.length < 120 && !JD_MARKERS.test(t)) {
          const parts = t.split(/\s+[-|•]\s+/);
          company = company || parts[0]?.trim() || '';
          if (parts[1]) location = location || parts[1].trim();
          break;
        }
        node = node.nextElementSibling;
        hops++;
      }
    }

    return { title, company, location, url: window.location.href, source: 'zippia' };
  }

  let lastDetectedJd = null;
  let mutationTimer = null;
  // After a detection or a URL change, keep looking for a different JD for this
  // long (the page may still be swapping content in). Once it passes, stop
  // scanning until the URL changes again — otherwise every DOM change on a busy
  // page (ads, lazy content) would rescan the whole document.
  const WATCH_MS = 8000;
  let watchUntil = 0;

  function shouldScan() {
    return !lastDetectedJd || Date.now() <= watchUntil;
  }

  function tryDetect() {
    if (!isJobPage() || !shouldScan()) return;
    const jd = extractJobDescription();
    if (!jd) return;

    // Same JD as the one already published: nothing to do. lastDetectedJd is kept
    // across URL changes, so the previous job's text is never published again
    // under a new URL, and a closed banner stays closed for this job.
    if (jd === lastDetectedJd) return;
    lastDetectedJd = jd;
    watchUntil = Date.now() + WATCH_MS;

    const meta = extractMeta();
    chrome.runtime.sendMessage({ type: 'JD_DETECTED', data: { jd, meta } }).catch(() => {});
    injectBanner(meta, jd);
  }

  function injectBanner(meta, jd) {
    document.getElementById('cb-shadow-host')?.remove();

    const host = document.createElement('div');
    host.id = 'cb-shadow-host';
    host.style.cssText = 'position:fixed!important;top:50%!important;right:24px!important;bottom:auto!important;left:auto!important;transform:translateY(-50%)!important;z-index:2147483647!important;pointer-events:auto!important;margin:0!important;padding:0!important;border:none!important;background:transparent!important;';

    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
  :host {
    position: fixed !important;
    top: 50% !important;
    right: 24px !important;
    bottom: auto !important;
    left: auto !important;
    transform: translateY(-50%) !important;
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
    overflow: hidden;
  }

  .cb-icon img {
    width: 30px;
    height: 30px;
    object-fit: contain;
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
    setBrandIcon(wrap.querySelector('.cb-icon'));

    shadow.appendChild(style);
    shadow.appendChild(wrap);
    document.body.appendChild(host);

    shadow.getElementById('cb-tailor-btn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'JD_TAILOR_NOW', data: { jd, meta } }).catch(() => {});
      host.remove();
    });

    shadow.getElementById('cb-close-btn').addEventListener('click', () => {
      host.remove();
    });
  }

  // Zippia's job detail content can hydrate well after document_idle, so retry
  // detection on a schedule instead of a single fixed-delay attempt (tryDetect
  // is idempotent once a JD is found — see the lastDetectedJd guard above).
  [1000, 2500, 4500, 7000, 10000, 14000].forEach((delay) => setTimeout(tryDetect, delay));

  // Re-run when the page changes (SPA navigation, content hydrating). Scanning
  // stops once a JD is found, until the URL changes again (see shouldScan).
  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      watchUntil = Date.now() + WATCH_MS;
      // A URL change (even only the hash or query) doesn't mean the job changed,
      // so keep the banner and lastDetectedJd; tryDetect swaps in a new job as
      // soon as different content shows up. Leaving the job page clears both.
      if (!isJobPage()) {
        lastDetectedJd = null;
        document.getElementById('cb-shadow-host')?.remove();
      }
    }

    if (!shouldScan()) return;
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(tryDetect, 250);
  });
  urlObserver.observe(document.body || document.documentElement, { subtree: true, childList: true });
  window.addEventListener('pagehide', () => urlObserver.disconnect(), { once: true });

  // Show the CareerBot brand icon in the banner (static — not the company's logo).
  function setBrandIcon(iconEl) {
    if (!iconEl) return;
    const img = document.createElement('img');
    img.src = chrome.runtime.getURL('icons/logo.png');
    img.alt = 'CareerBot';
    img.onerror = () => { iconEl.textContent = '✨'; };
    iconEl.replaceChildren(img);
  }

})();
