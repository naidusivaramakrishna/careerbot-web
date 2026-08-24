// Indeed JD scraper

(function () {

  // querySelectorAll('*') also returns SVG leaves (<path>, <circle>) from
  // decorative icons. innerText is an HTMLElement property, so on those it is
  // undefined and .trim() throws -- one icon inside a chip container was
  // enough to abort extraction entirely. Read defensively.
  function leafText(el) {
    const t = typeof el?.innerText === 'string' ? el.innerText : (el?.textContent || '');
    return t.trim();
  }

  if (window.__careerbotIndeed) return;
  window.__careerbotIndeed = true;

  // Per-frame: this guard lives on each frame's own window, so it does not
  // deduplicate across frames.
  const IS_TOP_FRAME = (() => {
    try { return window.top === window.self; } catch { return false; }
  })();

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
    return document.querySelector('#jobDescriptionText, .react-native-html-content, .simple-job-description-html, [class*="simple-job-description"]') !== null ||
           /viewjob/.test(window.location.href) ||
           // vjk (view-job-key) shows up in the URL for every split-view job
           // preview across Indeed's page types (search results, "Jobs for
           // you" home feed), including ones that never render
           // #jobDescriptionText at all — needed so extractJobDescription's
           // Job details/Benefits fallback gets a chance to run on those.
           /[?&]vjk=/.test(window.location.href);
  }

  // Indeed shows Location, Pay, and Job type in a structured header/"Job
  // details" widget that sits outside the JD paragraph (#jobDescriptionText),
  // so none of it was being scraped — only the free-text JD body was (the
  // reported bug: title/company came through but location/pay/job type
  // didn't). They can't be added to meta because service-worker.js's
  // sanitizeJDPayload only forwards {title, company, url, source} and would
  // silently drop anything else; instead they're prepended into the jd text
  // itself — the same technique naukri-scraper.js uses to append Key
  // Skills — so they reach the backend through the one channel that's
  // actually wired end-to-end.
  function extractJobDetail(labelText) {
    const leaves = Array.from(document.querySelectorAll('h3, span, div, strong, label'))
      .filter(el => el.children.length === 0);
    const heading = leaves.find(el => el.innerText.trim().toLowerCase() === labelText.toLowerCase());
    if (!heading) return null;
    const container = heading.nextElementSibling || heading.parentElement?.nextElementSibling;
    if (!container) return null;
    const values = Array.from(container.querySelectorAll('*'))
      .filter(el => el.children.length === 0 && leafText(el).length > 0)
      .map(el => leafText(el));
    const unique = [...new Set(values)];
    return unique.length ? unique.join(', ') : (container.innerText.trim() || null);
  }

  // Benefits is a chip/bullet list, not a single value, so it needs the
  // chip-reading technique (search within the heading's own parent, not a
  // following sibling — see the Naukri Key Skills fix for why that matters)
  // rather than extractJobDetail's single-value lookup.
  function extractBenefits() {
    const leaves = Array.from(document.querySelectorAll('h3, span, div, strong, label'))
      .filter(el => el.children.length === 0);
    const heading = leaves.find(el => el.innerText.trim().toLowerCase() === 'benefits');
    if (!heading) return null;
    const containers = [heading.nextElementSibling, heading.parentElement].filter(Boolean);
    for (const container of containers) {
      const items = Array.from(container.querySelectorAll('*'))
        .filter(el => el.children.length === 0)
        .map(el => leafText(el))
        .filter(s => s && s.length <= 80 && !/pulled from the full job description/i.test(s) && s.toLowerCase() !== 'benefits');
      const unique = [...new Set(items)];
      if (unique.length >= 1 && unique.length <= 30) return unique.join(', ');
    }
    return null;
  }

  function extractJobDetails() {
    const locationEl = document.querySelector(
      '[data-testid="job-location"], [data-testid="inlineHeader-companyLocation"], .jobsearch-JobInfoHeader-subtitle [class*="location"]'
    );
    const location = locationEl?.innerText?.trim() || extractJobDetail('Location');
    const pay = extractJobDetail('Pay');
    const jobType = extractJobDetail('Job type');
    const benefits = extractBenefits();

    const lines = [];
    if (location) lines.push(`Location: ${location}`);
    if (pay) lines.push(`Pay: ${pay}`);
    if (jobType) lines.push(`Job Type: ${jobType}`);
    if (benefits) lines.push(`Benefits: ${benefits}`);
    return lines.length ? lines.join('\n') : null;
  }

  function extractJobDescription() {
    const el = document.querySelector(
      '#jobDescriptionText, [class*="jobDescription"], .jobsearch-jobDescriptionText, .react-native-html-content, .simple-job-description-html, [class*="simple-job-description"]'
    );
    const details = extractJobDetails();
    if (el && el.innerText.trim().length > 100) {
      const jdText = el.innerText.trim();
      return details ? `${details}\n\n${jdText}` : jdText;
    }
    // No full JD text on the page (common for postings sourced from an
    // external site, e.g. DataAnnotation, where Indeed only shows a
    // condensed "Job details"/"Benefits" summary and never renders
    // #jobDescriptionText at all) — fall back to that summary instead of
    // reporting nothing detected.
    return details;
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

  let lastDetectedJd = null;
  let staleJdAfterNavigation = null;
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
    // isJobPage() can be false on the very first call simply because
    // Indeed's React app hasn't rendered #jobDescriptionText yet (a race,
    // not a real "not a job page" result). Retrying on that case the same
    // way as a failed extraction — instead of returning immediately with no
    // retry scheduled, as this used to — is what actually catches the
    // content once it renders; relying solely on the MutationObserver was
    // unreliable since it doesn't start watching until 1s after load and
    // misses pages that finish rendering before that or never mutate again.
    const jd = isJobPage() ? extractJobDescription() : null;
    // Indeed changes the URL before replacing the job details pane. Do not
    // publish the previous job under the newly selected job's URL while that
    // asynchronous replacement is still in progress.
    if (!jd || (staleJdAfterNavigation && jd === staleJdAfterNavigation)) {
      detectionAttempts++;
      if (detectionAttempts < MAX_ATTEMPTS) {
        scheduleRetry();
      }
      return;
    }

    if (jd === lastDetectedJd && document.getElementById('cb-shadow-host')) return;
    lastDetectedJd = jd;
    staleJdAfterNavigation = null;
    detectionAttempts = 0;
    clearTimeout(retryTimer);

    const meta = extractMeta();
    chrome.runtime.sendMessage({ type: 'JD_DETECTED', data: { jd, meta } }).catch(() => {});
    // manifest.json runs this script with all_frames:true so the split-view
    // job description (which Indeed renders in a same-origin iframe) can be
    // read. The BANNER, though, must only ever be injected by the top frame:
    // position:fixed resolves against the containing frame's viewport, so a
    // subframe would paint the banner inside its own box, and a page whose
    // top document ALSO matches would end up with two banners.
    if (IS_TOP_FRAME) injectBanner(meta, jd);
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

  // Initial detection attempt
  tryDetect();

  // Monitor for dynamic content changes (jobs loaded after initial page load)
  const observer = new MutationObserver(() => {
    // Indeed can emit many mutations for one job click. Debounce them so they
    // do not exhaust the retry budget before the description has rendered.
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(tryDetect, 100);
  });

  // Start observing when DOM is ready
  const startObserver = () => {
    // The description node itself is replaced on every result click. Observe
    // the persistent document body so subsequent replacements are detected.
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

  // Detect URL changes for job navigation
  let lastUrl = window.location.href;
  const pollUrl = () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      // Keep only the JD we actually published as stale. The interval may
      // notice the URL after Indeed has already rendered the new description;
      // treating the current DOM text as stale would suppress that valid JD.
      staleJdAfterNavigation = lastDetectedJd;
      lastDetectedJd = null;
      detectionAttempts = 0;
      document.getElementById('cb-shadow-host')?.remove();
      tryDetect();
    }
  };
  let urlPollInterval = setInterval(pollUrl, 500);

  // Neither the interval nor the MutationObserver above stop on their own —
  // without this, both keep running on a bfcache-restored or long-lived
  // Indeed tab (see linkedin-scraper.js / wellfound-scraper.js, which already
  // tear down their equivalents this way).
  // Suspend on pagehide, resume on pageshow. Using { once: true } here meant a
  // back-forward-cache restore -- which reuses this same document, so the
  // script does not re-run and __careerbotIndeed is still set -- left the
  // poller and observer permanently dead, and detection never recovered.
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
