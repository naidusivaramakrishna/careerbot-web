// JobLeads JD scraper
// JobLeads detail URLs look like https://www.jobleads.com/us/job/<title-slug>--<location-slug>--<id>
// but exact class names weren't available to verify at build time, so this
// uses generic heuristics (largest JD-shaped text block) rather than guessed
// selectors, same approach as zippia-scraper.js.

(function () {
  if (window.__careerbotJobleads) return;
  window.__careerbotJobleads = true;

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
    return /jobleads\.com\/[a-z]{2}\/job\//i.test(window.location.href);
  }

  function extractJobDescription() {
    const candidates = document.querySelectorAll('div, section, article');
    let best = null;
    for (const el of candidates) {
      if (el.querySelector('nav') || el.querySelector('header') || el.querySelector('footer')) continue;
      const text = el.innerText?.trim();
      if (!text || text.length < 300) continue;
      if (!JD_MARKERS.test(text)) continue;
      if (!best || text.length < best.length) best = text; // smallest qualifying block = most specific container
    }
    return best;
  }

  // Fall back to the URL slug (title--location--id) when the page gates the
  // full description behind a signup wall and only a preview is visible.
  function metaFromUrlSlug() {
    const match = window.location.pathname.match(/\/job\/([^/]+)/i);
    if (!match) return { title: '', location: '' };
    const parts = match[1].split('--');
    const toTitle = (slug) => slug?.replace(/-job$/i, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '';
    return { title: toTitle(parts[0]), location: toTitle(parts[1]) };
  }

  function extractMeta() {
    const titleEl = document.querySelector('h1');
    const fromSlug = metaFromUrlSlug();
    const title = titleEl?.innerText?.trim() || fromSlug.title || document.title.trim();

    let company = '';
    if (titleEl) {
      let node = titleEl.nextElementSibling;
      let hops = 0;
      while (node && hops < 4) {
        const t = node.innerText?.trim();
        if (t && t.length > 0 && t.length < 120 && !JD_MARKERS.test(t)) {
          company = t.split(/\s+[-|•]\s+/)[0]?.trim() || '';
          break;
        }
        node = node.nextElementSibling;
        hops++;
      }
    }

    return { title, company, location: fromSlug.location, url: window.location.href, source: 'jobleads' };
  }

  let lastDetectedJd = null;
  let staleJdAfterNavigation = null;
  let mutationTimer = null;

  function tryDetect() {
    if (!isJobPage()) return;
    const jd = extractJobDescription();
    if (!jd) return;
    if (staleJdAfterNavigation && jd === staleJdAfterNavigation) return;

    // Avoid re-sending the same JD / re-injecting the banner on repeated
    // retries or rapid SPA navigation callbacks.
    // Checking only the JD text (not banner presence) means a closed banner
    // stays closed for this job — checking document.getElementById
    // ('cb-shadow-host') here treated the user's own close click as "not
    // shown yet" and reopened the banner on the next retry/mutation.
    if (jd === lastDetectedJd) return;
    lastDetectedJd = jd;
    staleJdAfterNavigation = null;

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

  // JobLeads' detail content can hydrate well after document_idle, so retry
  // detection on a schedule instead of a single fixed-delay attempt (tryDetect
  // is idempotent once a JD is found — see the lastDetectedJd guard above).
  [1000, 2500, 4500, 7000, 10000, 14000].forEach((delay) => setTimeout(tryDetect, delay));

  // Re-run for both URL changes and in-place job-panel replacements — clicking
  // a different job card on a listing page often swaps the visible JD without
  // a full page navigation, so a one-time detection on initial load would
  // otherwise never see it.
  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      staleJdAfterNavigation = lastDetectedJd;
      lastDetectedJd = null;
      document.getElementById('cb-shadow-host')?.remove();
    }

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
