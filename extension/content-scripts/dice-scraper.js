// Dice JD scraper

(function () {

  if (window.__careerbotDice) return;
  window.__careerbotDice = true;

  // Inject critical CSS to lock banner positioning
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

  function isJobPage() {
    return /\/job-detail\//.test(window.location.pathname) ||
           // The split-view search page (/jobs?...&selectedJobId=<uuid>) loads
           // the job panel client-side without a full navigation.
           /[?&]selectedJobId=/.test(window.location.href);
  }

  // Dice renders the job panel's data from a schema.org JobPosting block —
  // <script type="application/ld+json" id="jobDetailStructuredData">. This is
  // far sturdier than CSS-class scraping (which breaks on every deploy that
  // rotates class hashes, as the Naukri/Indeed scrapers' comments note) since
  // it's stable, standardized SEO markup rather than an implementation detail.
  function extractJobPostingJson() {
    const el = document.getElementById('jobDetailStructuredData') ||
               document.querySelector('script[type="application/ld+json"]');
    if (!el) return null;
    try {
      const data = JSON.parse(el.textContent || '');
      return data && data['@type'] === 'JobPosting' ? data : null;
    } catch {
      return null;
    }
  }

  // The JobPosting's description field is itself an HTML string. A DOMParser
  // document is inert — never rendered, scripts never run, <img>/other
  // resources never load — so it's a safe way to decode entities and strip
  // tags from this third-party HTML without the XSS risk of assigning it to
  // a live element's innerHTML.
  function htmlToPlainText(html) {
    if (!html) return '';
    // DOMParser's .textContent never inserts whitespace between adjacent
    // elements, and Dice's description HTML often has none in the source
    // either — e.g. a pseudo-heading like <strong>Key Responsibilities</strong>
    // immediately followed by <ul><li>. A narrower allowlist here (just
    // p/div/li/h1-6/br) missed tags like <strong>, so those boundaries
    // collapsed into run-together words ("ResponsibilitiesCollaborate"),
    // corrupting every skill keyword that happened to sit at one — which is
    // what was producing 0% matches for every Dice job. Inserting a break at
    // EVERY tag boundary, regardless of tag name, closes that gap for good.
    const withBreaks = html
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?>/g, '\n');
    try {
      const doc = new DOMParser().parseFromString(withBreaks, 'text/html');
      return (doc.body?.textContent || '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } catch {
      return withBreaks.replace(/<[^>]*>/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    }
  }

  // Location/employment type sit as separate structured fields, not in the
  // description body — same gap Indeed's extractJobDetails() fills, appended
  // into the JD text since that's the only channel that reaches the backend
  // (service-worker.js's sanitizeJDPayload only forwards {title, company,
  // url, source} on meta).
  function extractJobDetailsLine(posting) {
    const lines = [];
    if (posting.jobLocationType === 'TELECOMMUTE') {
      lines.push('Location: Remote');
    } else if (posting.jobLocation) {
      const loc = Array.isArray(posting.jobLocation) ? posting.jobLocation[0] : posting.jobLocation;
      const addr = loc?.address;
      const parts = [addr?.addressLocality, addr?.addressRegion, addr?.addressCountry].filter(Boolean);
      if (parts.length) lines.push(`Location: ${parts.join(', ')}`);
    }
    if (posting.employmentType) {
      const et = String(posting.employmentType).replace(/_/g, ' ').toLowerCase();
      lines.push(`Employment Type: ${et.charAt(0).toUpperCase()}${et.slice(1)}`);
    }
    return lines.join('\n');
  }

  // Dice's "Skills" chip list is its own auto-tagger applied to the whole
  // posting (including boilerplate benefits/EEO text), not an employer-curated
  // required-skills field like Naukri's Key Skills — it tags things like
  // "Jersey" (a fragment of "Jersey City", the job's location) and "Health
  // Care"/"Law"/"Military"/"Brand" as "skills". Appending that noisy dump onto
  // otherwise-clean JD text was diluting/confusing the backend's own skill
  // extraction (0% match, "no skill keywords detected", even on well-formed
  // text) — the description prose already names real skills in natural
  // sentences, which is all every other scraper in this codebase relies on.
  function extractJobDescription() {
    const posting = extractJobPostingJson();
    if (posting?.description) {
      const text = htmlToPlainText(posting.description);
      if (text.length > 100) {
        const details = extractJobDetailsLine(posting);
        return details ? `${details}\n\n${text}` : text;
      }
    }
    // Fallback for the split-view search page (/jobs?...&selectedJobId=...),
    // which renders the same content client-side instead of via the JSON-LD
    // block above. Verified against the live DOM: the container is
    // `job-detail-description-module__<hash>_jobDescription` — a CSS-module
    // class whose hash rotates every deploy, so match on the stable
    // "jobDescription" substring rather than the exact generated class name.
    const selectors = [
      '[class*="jobDescription"]',
      '[class*="job-detail-description-module"]',
      '[data-testid="jobDescriptionHtml"]',
      '[id*="jobDescription"]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim().length > 100) return el.innerText.trim();
    }
    return null;
  }

  function extractLocationFromPosting(posting) {
    if (!posting) return '';
    if (posting.jobLocationType === 'TELECOMMUTE') return 'Remote';
    const loc = Array.isArray(posting.jobLocation) ? posting.jobLocation[0] : posting.jobLocation;
    const addr = loc?.address;
    return [addr?.addressLocality, addr?.addressRegion, addr?.addressCountry].filter(Boolean).join(', ');
  }

  function extractMeta() {
    const posting = extractJobPostingJson();
    if (posting) {
      return {
        title:    posting.title || document.title,
        company:  posting.hiringOrganization?.name || '',
        location: extractLocationFromPosting(posting),
        url:      window.location.href,
        source:   'dice',
      };
    }
    const titleEl    = document.querySelector('[data-testid="job-detail-header-card"] h1, h1[class*="title"]');
    const companyEl  = document.querySelector('[data-testid="legalInfo-companyName"], [data-testid="job-card-company-name"]');
    const locationEl = document.querySelector('[data-testid*="location" i], [class*="location" i]');
    return {
      title:    titleEl?.innerText?.trim()   || document.title,
      company:  companyEl?.innerText?.trim() || '',
      location: locationEl?.innerText?.trim() || '',
      url:      window.location.href,
      source:   'dice',
    };
  }

  let lastDetectedJd = null;
  // The JD the user explicitly closed the banner for. Closing it (host.remove())
  // is itself a DOM mutation, which the MutationObserver below picks up and
  // re-runs tryDetect() from — without this, the "already showing" guard
  // (document.getElementById('cb-shadow-host')) is now false since the banner
  // was just removed, so it re-injects the very banner the user just closed.
  let dismissedJd = null;
  let detectionAttempts = 0;
  const MAX_ATTEMPTS = 15;
  const ATTEMPT_INTERVAL = 500;
  let retryTimer = null;
  let mutationTimer = null;

  function scheduleRetry() {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(tryDetect, ATTEMPT_INTERVAL);
  }

  function tryDetect() {
    // isJobPage() can be false on the very first call simply because Dice's
    // React app hasn't rendered the job panel yet (a race, not a real
    // "not a job page" result) — retry the same way as a failed extraction.
    const jd = isJobPage() ? extractJobDescription() : null;
    if (!jd) {
      detectionAttempts++;
      if (detectionAttempts < MAX_ATTEMPTS) {
        scheduleRetry();
      }
      return;
    }

    // Dice updates selectedJobId in the URL before the split-view panel finishes
    // swapping in the newly selected job's content. lastDetectedJd is kept across
    // URL changes, so the previous job's text is not published again under the
    // new URL, and a closed banner stays closed for this job. The mutation
    // observer below picks up the new content as soon as it renders.
    if (jd === lastDetectedJd) return;
    lastDetectedJd = jd;
    detectionAttempts = 0;
    clearTimeout(retryTimer);

    const meta = extractMeta();
    chrome.runtime.sendMessage({ type: 'JD_DETECTED', data: { jd, meta } }).catch(() => {});
    // Still report JD_DETECTED even if the user dismissed the banner for this
    // job — dismissing is "stop showing this floating prompt", not "stop
    // tracking this job" — but skip re-showing the banner itself.
    if (jd !== dismissedJd) injectBanner(meta, jd);
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
      dismissedJd = jd;
      host.remove();
    });
  }

  // Initial detection attempt
  tryDetect();

  // Monitor for dynamic content changes (job panel swapped in after a card click)
  const observer = new MutationObserver(() => {
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(tryDetect, 100);
  });

  const startObserver = () => {
    const targetNode = document.body;
    if (targetNode) {
      observer.observe(targetNode, {
        childList: true,
        subtree: true,
        characterData: false,
      });
    }
  };

  setTimeout(startObserver, 1000);

  // Detect URL changes for job navigation (selectedJobId changes without a
  // full page reload in the split-view search results page)
  let lastUrl = window.location.href;
  const pollUrl = () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      detectionAttempts = 0;
      // Keep the banner and lastDetectedJd: a URL change doesn't always mean the
      // job changed. tryDetect() swaps in a new job as soon as different content
      // shows up. Leaving the job page clears both.
      if (!isJobPage()) {
        lastDetectedJd = null;
        document.getElementById('cb-shadow-host')?.remove();
      }
      tryDetect();
    }
  };
  let urlPollInterval = setInterval(pollUrl, 500);

  // Suspend on pagehide, resume on pageshow — a bfcache restore reuses this
  // same document (__careerbotDice stays set, so the script never re-runs),
  // so without this the poller/observer would stay dead forever after one.
  window.addEventListener('pagehide', () => {
    clearInterval(urlPollInterval);
    observer.disconnect();
  });

  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    lastUrl = window.location.href;
    urlPollInterval = setInterval(pollUrl, 500);
    startObserver();
    tryDetect();
  });

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
