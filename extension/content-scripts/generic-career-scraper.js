// Generic public career-page scraper.
// Dedicated portal scripts remain the preferred, higher-accuracy extractors.

(function () {
  if (window.__careerbotGenericCareer) return;
  window.__careerbotGenericCareer = true;

  const MIN_JD_LENGTH = 180;
  const MAX_JD_LENGTH = 30000;
  const JOB_PATH_RE = /\/(jobs?|careers?|positions?|vacanc(?:y|ies)|opportunities|requisitions?|openings?)(?:\/|$)/i;
  let lastDetectedJd = null;
  let staleJdAfterNavigation = null;
  let lastUrl = location.href;
  let mutationTimer = null;

  function cleanText(value) {
    return String(value || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, MAX_JD_LENGTH);
  }

  function htmlToText(value) {
    const container = document.createElement('div');
    container.innerHTML = String(value || '');
    return cleanText(container.innerText || container.textContent);
  }

  function findJobPosting(value) {
    if (!value) return null;
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findJobPosting(item);
        if (found) return found;
      }
      return null;
    }
    if (typeof value !== 'object') return null;
    const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
    if (types.some((type) => String(type).toLowerCase() === 'jobposting')) return value;
    return findJobPosting(value['@graph']);
  }

  function extractStructuredJob() {
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const posting = findJobPosting(JSON.parse(script.textContent));
        if (!posting) continue;
        const jd = htmlToText(posting.description);
        if (jd.length < MIN_JD_LENGTH) continue;
        return {
          jd,
          title: cleanText(posting.title),
          company: cleanText(posting.hiringOrganization?.name),
        };
      } catch { /* Ignore malformed third-party JSON-LD. */ }
    }
    return null;
  }

  function extractDomJob() {
    const selectors = [
      '[itemprop="description"]',
      '[data-automation-id="jobPostingDescription"]',
      '[data-testid="job-description"]',
      '[data-testid="jobDescription"]',
      '[data-test="job-description"]',
      '#job-description', '#jobDescription', '#job_description',
      '.job-description', '.job_description', '.jobDescription',
      '[class*="jobDescription"]', '[class*="JobDescription"]',
      '[id*="job-description"]', '[id*="job_description"]',
      '.posting-description', '.posting-page .section-wrapper',
      // Amazon Jobs and similarly structured company career pages.
      '#job-detail-body .content',
    ];

    let best = null;
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        const text = cleanText(element.innerText);
        if (text.length >= MIN_JD_LENGTH && (!best || text.length > best.length)) best = text;
      }
    }

    // Some career sites use only semantic headings followed by ordinary
    // sections, with no job-specific class on the actual text container.
    // Walk up from a strong JD heading and prefer the largest focused parent.
    if (!best) {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3')).filter((element) =>
        /^(job |position |role )?description$|^responsibilities$|^about (the )?role$/i.test(cleanText(element.innerText))
      );
      for (const heading of headings) {
        let element = heading.parentElement;
        for (let depth = 0; depth < 3 && element; depth++, element = element.parentElement) {
          const text = cleanText(element.innerText);
          if (text.length >= MIN_JD_LENGTH && text.length <= MAX_JD_LENGTH &&
              !element.matches('body, html') && !element.querySelector('nav')) {
            if (!best || text.length > best.length) best = text;
          }
        }
      }
    }
    if (!best) return null;

    const pageText = cleanText(document.body?.innerText).slice(0, 12000);
    const hasApplyAction = Array.from(document.querySelectorAll('a, button')).some((element) =>
      /^(apply|apply now|apply for this job|submit application)$/i.test(cleanText(element.innerText))
    );
    const hasJobHeading = Array.from(document.querySelectorAll('h1, h2')).some((element) =>
      /job description|position description|role overview|about the role/i.test(cleanText(element.innerText))
    );
    const hasJobLanguage = /responsibilities|qualifications|requirements|employment type|experience required/i.test(pageText);
    const confidence = Number(JOB_PATH_RE.test(location.pathname)) + Number(hasApplyAction) +
      Number(hasJobHeading) + Number(hasJobLanguage);
    return confidence >= 2 ? best : null;
  }

  function extractMeta(structured) {
    const title = structured?.title || cleanText(
      document.querySelector('h1, [data-automation-id="jobPostingHeader"] h2, [class*="jobTitle"]')?.innerText
    ) || document.title;
    const company = structured?.company || cleanText(
      document.querySelector('[itemprop="hiringOrganization"], [class*="companyName"], [data-testid="company-name"]')?.innerText
    ) || document.querySelector('meta[property="og:site_name"]')?.content || location.hostname.replace(/^www\./, '');
    return { title, company, url: location.href, source: 'career-page' };
  }

  function tryDetect() {
    const structured = extractStructuredJob();
    const jd = structured?.jd || extractDomJob();
    if (!jd || (staleJdAfterNavigation && jd === staleJdAfterNavigation)) return;
    if (jd === lastDetectedJd) return;

    lastDetectedJd = jd;
    staleJdAfterNavigation = null;
    const meta = extractMeta(structured);
    chrome.runtime.sendMessage({ type: 'JD_DETECTED', data: { jd, meta } }).catch(() => {});
    injectBanner(meta, jd);
  }

  function injectBanner(meta, jd) {
    document.getElementById('cb-generic-shadow-host')?.remove();
    const host = document.createElement('div');
    host.id = 'cb-generic-shadow-host';
    host.style.cssText = 'position:fixed!important;top:50%!important;right:24px!important;transform:translateY(-50%)!important;z-index:2147483647!important;';
    const shadow = host.attachShadow({ mode: 'open' });
    const wrap = document.createElement('div');
    wrap.innerHTML = '<div class="card"><img><div class="text"><strong></strong><span></span><small>CAREER PAGE</small></div><button class="tailor">Tailor Resume</button><button class="close" aria-label="Close">×</button></div>';
    const style = document.createElement('style');
    style.textContent = ':host{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.card{display:flex;align-items:center;gap:11px;width:340px;box-sizing:border-box;padding:12px 14px;background:#fff;border:1px solid #ddd6fe;border-left:5px solid #7c3aed;border-radius:14px;box-shadow:0 4px 24px rgba(109,40,217,.2)}img{width:34px;height:34px}.text{flex:1;min-width:0}.text strong,.text span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.text strong{font-size:13px;color:#111827}.text span{font-size:11px;color:#6b7280;margin-top:2px}.text small{font-size:9px;font-weight:700;color:#7c3aed}.tailor{padding:9px 12px;border:0;border-radius:9px;background:#7c3aed;color:#fff;font-weight:600;cursor:pointer}.close{border:0;background:#f3f4f6;border-radius:6px;width:25px;height:25px;cursor:pointer;color:#6b7280}';
    wrap.querySelector('img').src = chrome.runtime.getURL('icons/logo.png');
    wrap.querySelector('strong').textContent = meta.title || 'Job detected';
    wrap.querySelector('span').textContent = meta.company || location.hostname;
    wrap.querySelector('.tailor').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'JD_TAILOR_NOW', data: { jd, meta } }).catch(() => {});
      host.remove();
    });
    wrap.querySelector('.close').addEventListener('click', () => host.remove());
    shadow.append(style, wrap);
    document.body.appendChild(host);
  }

  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      staleJdAfterNavigation = lastDetectedJd;
      lastDetectedJd = null;
      document.getElementById('cb-generic-shadow-host')?.remove();
    }
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(tryDetect, 400);
  });

  tryDetect();
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(tryDetect, 1500);
  setTimeout(tryDetect, 3500);
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
})();
